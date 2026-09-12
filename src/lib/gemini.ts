import { GoogleGenAI } from '@google/genai';
import { db, getTodayDateString } from './db';
import { deobfuscateKey } from './crypto';
import { UserProfile, Recipe } from '@/types';

// Modelos recomendados con fallback automático (iniciando por gemini-3.6-flash como solicita Google AI)
export const CANDIDATE_MODELS = [
  'gemini-3.6-flash',
  'gemini-3.7-flash',
  'gemini-3.5-flash-lite'
];

/**
 * Ejecuta generateContent probando los modelos candidatos en caso de 404 o deprecación
 */
async function generateContentWithFallback(
  client: GoogleGenAI,
  params: {
    contents: any;
    systemInstruction?: string;
    temperature?: number;
    responseMimeType?: string;
  }
) {
  let lastError: any = null;
  for (const model of CANDIDATE_MODELS) {
    try {
      const config: any = {};
      if (params.systemInstruction) config.systemInstruction = params.systemInstruction;
      if (params.temperature !== undefined) config.temperature = params.temperature;
      if (params.responseMimeType) config.responseMimeType = params.responseMimeType;

      return await client.models.generateContent({
        model,
        contents: params.contents,
        config
      });
    } catch (err: any) {
      lastError = err;
      const errMsg = String(err?.message || '');
      if (errMsg.includes('404') || errMsg.includes('not found') || errMsg.includes('no longer available')) {
        console.warn(`Modelo ${model} no disponible, probando siguiente candidato...`);
        continue;
      }
      throw err;
    }
  }
  throw lastError;
}

/**
 * Obtiene una instancia del cliente de GoogleGenAI con la clave del usuario
 */
export async function getGeminiClient(): Promise<{ client: GoogleGenAI; profile: UserProfile } | null> {
  const profile = await db.userProfile.toCollection().first();
  if (!profile || !profile.geminiApiKey) {
    return null;
  }
  const rawApiKey = deobfuscateKey(profile.geminiApiKey);
  if (!rawApiKey) {
    return null;
  }

  const client = new GoogleGenAI({ apiKey: rawApiKey });
  return { client, profile };
}

/**
 * Construye el prompt de sistema personalizado inyectando perfil, memoria acumulada y estado del día
 */
async function buildSystemInstruction(profile: UserProfile): Promise<string> {
  const today = getTodayDateString();
  const todayStreak = await db.dailyStreaks.where('date').equals(today).first();
  const todayFood = await db.foodLogs.where('date').equals(today).toArray();
  const memoryRecord = await db.aiMemorySummary.toCollection().first();

  const kgToLose = Math.max(0, Math.round((profile.currentWeight - profile.targetWeight) * 10) / 10);

  let memoryContext = 'Aún no hay hábitos históricos condensados.';
  if (memoryRecord && memoryRecord.summaryText) {
    memoryContext = memoryRecord.summaryText;
    if (memoryRecord.learnedHabits?.length) {
      memoryContext += `\n- Hábitos aprendidos: ${memoryRecord.learnedHabits.join(', ')}`;
    }
    if (memoryRecord.restrictions?.length) {
      memoryContext += `\n- Restricciones detectadas: ${memoryRecord.restrictions.join(', ')}`;
    }
  }

  const foodSummary = todayFood.length > 0
    ? todayFood.map(f => `• [${f.mealType.toUpperCase()} ${f.time}]: ${f.description} (~${f.estimatedCalories} kcal)`).join('\n')
    : 'No hay comidas registradas aún hoy.';

  const streakSummary = todayStreak
    ? `Agua tomada hoy: ${todayStreak.waterGlasses} vasos de 250ml (${todayStreak.waterGlasses * 250}ml / Meta: ${profile.dailyWaterGoalMl}ml). Ejercicio completado: ${todayStreak.exerciseCompleted ? 'SÍ' : 'Aún no'}. Porciones vegetales: ${todayStreak.vegetablesPortions}.`
    : 'Sin registros de racha hoy todavía.';

  return `Eres "DownPeso Coach By ChrizDev", un asesor y mentor experto en nutrición casera, hábitos saludables y reducción de peso sostenible.
Tu misión es guiar al usuario con empatía, base científica, calidez y practicidad.

DATOS DEL USUARIO:
- Nombre: ${profile.name} (Salúdalo siempre cordialmente por su nombre o haz referencia a él de forma cercana).
- Edad: ${profile.age} años | Estatura: ${profile.height} cm
- Peso actual: ${profile.currentWeight} kg | Peso meta: ${profile.targetWeight} kg (${kgToLose > 0 ? `Meta: bajar ${kgToLose} kg` : '¡En peso objetivo o mantenimiento!'})
- IMC: ${profile.bmi} | TMB: ${profile.bmr} kcal | Gasto Total (TDEE): ${profile.tdee} kcal
- Calorías meta recomendadas al día: ~${profile.targetDailyCalories} kcal (déficit moderado y seguro)
- Nivel de actividad: ${profile.activityLevel}
- Preferencias o restricciones del usuario: ${profile.dietPreferences || 'Ninguna especificada'}

MEMORIA ADAPTATIVA DEL USUARIO (Patrones y aprendizajes previos):
${memoryContext}

ESTADO DE HOY (${today}):
${streakSummary}
Comidas registradas hoy:
${foodSummary}

DIRECTRICES DE TUS RESPUESTAS:
1. Siempre reconoce sus avances y sé positivo pero realista. No recomiendes dietas milagro ni restricciones extremas.
2. Promueve comida casera, accesible y económica (ingredientes tradicionales como huevo, avena, verduras de mercado, legumbres, atún).
3. Si el usuario menciona lo que acaba de comer (ej. "Hoy comí una manzana y dos huevos"), felicítalo o dale un tip amable, e incluye al final de tu respuesta una sugerencia clara para registrarlo si lo desea con una línea formateada exactamente así:
[LOG_SUGGESTION: {"mealType": "almuerzo", "description": "Sopa de verduras con huevo", "estimatedCalories": 220, "healthyRating": "excelente"}]
4. Si pide recetas o ejercicios, adapta la recomendación a su nivel y condición articular (siempre prioriza bajo impacto si hay sobrepeso).
5. Habla en español con tono motivador, profesional y cercano.`;
}

/**
 * Envía un mensaje conversacional al modelo Gemini y obtiene respuesta
 */
export async function sendChatMessage(userMessage: string): Promise<string> {
  const context = await getGeminiClient();
  if (!context) {
    throw new Error('No se ha configurado una Gemini API Key válida. Por favor configúrala en el perfil.');
  }

  const { client, profile } = context;
  const systemInstruction = await buildSystemInstruction(profile);

  // Obtener últimos mensajes conversacionales para memoria de corto plazo
  const recentMessages = await db.chatHistory
    .orderBy('id')
    .reverse()
    .limit(10)
    .toArray();
  recentMessages.reverse();

  // Guardar mensaje de usuario en BD
  await db.chatHistory.add({
    role: 'user',
    content: userMessage,
    timestamp: new Date().toISOString()
  });

  // Estructurar contenido para Gemini
  const contents = recentMessages.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }]
  }));

  // Añadir el mensaje actual
  contents.push({
    role: 'user',
    parts: [{ text: userMessage }]
  });

  try {
    const response = await generateContentWithFallback(client, {
      contents: contents as any,
      systemInstruction: systemInstruction,
      temperature: 0.7
    });

    const replyText = response.text || 'No pude generar una respuesta en este momento. Intenta de nuevo.';

    // Guardar respuesta del asistente en BD
    await db.chatHistory.add({
      role: 'assistant',
      content: replyText,
      timestamp: new Date().toISOString()
    });

    // Disparar rutina de resumen en segundo plano si hay muchos mensajes acumulados
    triggerMemorySummarizationIfNeeded().catch(err => console.warn('Memory summarization skipped:', err));

    return replyText;
  } catch (error: any) {
    console.error('Error en llamada a Gemini API:', error);
    let errorMsg = String(error?.message || '');
    try {
      // Si el mensaje es un JSON de Google AI, extraer el texto limpio
      const parsed = JSON.parse(errorMsg);
      if (parsed?.error?.message) {
        errorMsg = parsed.error.message;
      }
    } catch (_) {}

    if (errorMsg.includes('API_KEY_INVALID') || errorMsg.includes('403')) {
      throw new Error('La Gemini API Key ingresada no es válida o no tiene permisos. Revisa tu clave en Configuración.');
    }
    if (errorMsg.includes('RESOURCE_EXHAUSTED') || errorMsg.includes('429')) {
      throw new Error('Límite de cuota alcanzado en Gemini API. Por favor espera un minuto antes de reintentar.');
    }
    throw new Error(`Error de conexión con la IA: ${errorMsg}`);
  }
}

/**
 * Rutina de resumen automático para compactar historial conversacional antiguo
 * y actualizar la memoria a largo plazo sin saturar tokens.
 */
export async function triggerMemorySummarizationIfNeeded(): Promise<void> {
  const unsummarizedCount = await db.chatHistory
    .where('summarized')
    .equals(0)
    .or('summarized')
    .equals(undefined as any)
    .count();

  // Si hay más de 12 mensajes sin resumir, compactamos los primeros 8
  if (unsummarizedCount < 12) return;

  const context = await getGeminiClient();
  if (!context) return;
  const { client, profile } = context;

  const messagesToSummarize = await db.chatHistory
    .orderBy('id')
    .filter(m => !m.summarized)
    .limit(10)
    .toArray();

  if (messagesToSummarize.length < 6) return;

  const conversationTranscript = messagesToSummarize
    .map(m => `${m.role.toUpperCase()}: ${m.content}`)
    .join('\n');

  const existingMemory = await db.aiMemorySummary.toCollection().first();

  const prompt = `Analiza este fragmento de conversación entre el usuario ${profile.name} y el asistente de salud.
Extrae y actualiza un resumen conciso de máximo 150 palabras con:
1. Preferencias alimenticias o gustos descubiertos.
2. Dificultades, antojos o barreras mencionadas.
3. Hábitos positivos que el usuario está logrando.
4. Cualquier lesión o condición física relevante.

MEMORIA PREVIA EXISTENTE:
${existingMemory?.summaryText || 'Ninguna'}

TRANSCRIPCIÓN RECIENTE:
${conversationTranscript}

Responde ÚNICAMENTE en formato JSON plano:
{
  "summaryText": "Resumen integrado y actualizado de 2 o 3 párrafos cortos.",
  "learnedHabits": ["hábito 1", "hábito 2"],
  "restrictions": ["restricción 1"]
}`;

  try {
    const response = await generateContentWithFallback(client, {
      contents: prompt,
      responseMimeType: 'application/json'
    });

    const text = response.text;
    if (text) {
      const parsed = JSON.parse(text);
      if (existingMemory && existingMemory.id) {
        await db.aiMemorySummary.update(existingMemory.id, {
          summaryText: parsed.summaryText,
          learnedHabits: parsed.learnedHabits || existingMemory.learnedHabits,
          restrictions: parsed.restrictions || existingMemory.restrictions,
          lastUpdated: new Date().toISOString()
        });
      } else {
        await db.aiMemorySummary.add({
          summaryText: parsed.summaryText,
          learnedHabits: parsed.learnedHabits || [],
          restrictions: parsed.restrictions || [],
          weightMilestones: [],
          lastUpdated: new Date().toISOString()
        });
      }

      // Marcar los mensajes procesados como resumidos
      for (const m of messagesToSummarize) {
        if (m.id) {
          await db.chatHistory.update(m.id, { summarized: true });
        }
      }
    }
  } catch (err) {
    console.warn('No se pudo completar el auto-resumen de memoria:', err);
  }
}

/**
 * Asistente inteligente de "¿Qué hay en mi refrigerador?"
 * Genera una receta nutritiva, casera y económica con los ingredientes indicados por el usuario
 */
export async function generateSmartFridgeRecipe(ingredientsList: string[]): Promise<Recipe> {
  const context = await getGeminiClient();
  if (!context) {
    throw new Error('Configura tu Gemini API Key en tu perfil para usar el creador de recetas.');
  }
  const { client, profile } = context;

  const prompt = `Actúa como un chef y nutriólogo casero.
El usuario ${profile.name} (en plan de reducción de peso, meta de calorías diarias ~${profile.targetDailyCalories} kcal) tiene los siguientes ingredientes disponibles en casa:
${ingredientsList.join(', ')}

Crea una receta casera, sabrosa, saciante, económica y baja en calorías aprovechando principalmente estos ingredientes (puedes asumir ingredientes básicos como agua, sal, pimienta, limón, pizca de aceite o hierbas secas).

Devuelve ÚNICAMENTE un JSON válido con esta estructura exacta:
{
  "title": "Nombre apetitoso de la receta",
  "category": "almuerzo" (o desayuno, cena, snack),
  "description": "Breve descripción apetitosa y nutricional en 1 o 2 oraciones",
  "ingredients": ["ingrediente 1 con cantidad", "ingrediente 2 con cantidad", ...],
  "instructions": ["Paso 1 detallado", "Paso 2 detallado", ...],
  "prepTimeMinutes": 15,
  "estimatedCalories": 240,
  "budgetFriendly": true,
  "tags": ["Económica", "Con lo que hay en el refri", "Saludable"]
}`;

  const response = await generateContentWithFallback(client, {
    contents: prompt,
    responseMimeType: 'application/json'
  });

  const text = response.text;
  if (!text) throw new Error('No se pudo generar la receta con los ingredientes proporcionados.');

  const recipeData: Recipe = JSON.parse(text);
  recipeData.isCustom = true;
  return recipeData;
}
