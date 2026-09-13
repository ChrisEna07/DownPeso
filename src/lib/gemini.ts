import { GoogleGenAI } from '@google/genai';
import { db, getTodayDateString, getOrCreateTodayStreak } from './db';
import { deobfuscateKey } from './crypto';
import { UserProfile, Recipe, CoachAction, FoodLog } from '@/types';
import { calculateBMI } from './calculations';
import { getAppSettings } from './settings';
import { getLanguagePromptInstruction } from './i18n';
import { showFeedback } from './feedback';

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

  // Cargar las reflexiones y notas escritas por el usuario en su diario de hábitos (últimos 7 días)
  const recentNotesStreaks = await db.dailyStreaks
    .orderBy('date')
    .reverse()
    .filter(s => !!s.notes && s.notes.trim().length > 0)
    .limit(7)
    .toArray();

  const notesSummary = recentNotesStreaks.length > 0
    ? recentNotesStreaks.map(s => `• [${s.date}]: "${(s.notes || '').trim()}"`).join('\n')
    : 'Aún no ha escrito reflexiones en su diario de hábitos.';

  // Cargar métricas de consistencia de la última semana
  const last7DaysStreaks = await db.dailyStreaks
    .orderBy('date')
    .reverse()
    .limit(7)
    .toArray();

  const exerciseDaysCount = last7DaysStreaks.filter(s => s.exerciseCompleted).length;
  const avgGlasses = last7DaysStreaks.length > 0
    ? (last7DaysStreaks.reduce((acc, s) => acc + (s.waterGlasses || 0), 0) / last7DaysStreaks.length).toFixed(1)
    : '0';

  // Cargar progreso de peso reciente
  const recentWeights = await db.weightRecords
    .orderBy('date')
    .reverse()
    .limit(3)
    .toArray();

  const weightProgressStr = recentWeights.length > 0
    ? recentWeights.map(w => `${w.date}: ${w.weight} kg`).join(' → ')
    : `${profile.currentWeight} kg (peso inicial)`;

  const foodSummary = todayFood.length > 0
    ? todayFood.map(f => `• [${f.mealType.toUpperCase()} ${f.time}]: ${f.description} (~${f.estimatedCalories} kcal)`).join('\n')
    : 'No hay comidas registradas aún hoy.';

  const streakSummary = todayStreak
    ? `Agua tomada hoy: ${todayStreak.waterGlasses} vasos de 250ml (${todayStreak.waterGlasses * 250}ml / Meta: ${profile.dailyWaterGoalMl}ml). Ejercicio completado: ${todayStreak.exerciseCompleted ? 'SÍ' : 'Aún no'}. Porciones vegetales: ${todayStreak.vegetablesPortions}.`
    : 'Sin registros de racha hoy todavía.';

  const currentLang = getAppSettings().language || 'es';
  const languageInstruction = getLanguagePromptInstruction(currentLang);

  return `Eres "Otto", el coach personal e hiper-inteligente de nutrición casera, hábitos y reducción de peso de DownPeso By ChrizDev.
Tu misión es guiar al usuario con empatía, base científica, calidez y practicidad.
Tu mayor valor es que APRENDES continuamente de todo lo que ${profile.name} hace, anota y conversa contigo. Recuerdas sus notas, dificultades, alimentos favoritos y logros.

${languageInstruction}

DATOS ANTROPOMÉTRICOS DEL USUARIO:
- Nombre: ${profile.name} (Salúdalo con cercanía como Otto)
- Edad: ${profile.age} años | Estatura: ${profile.height} cm
- Peso actual: ${profile.currentWeight} kg | Peso meta: ${profile.targetWeight} kg (${kgToLose > 0 ? `Meta: bajar ${kgToLose} kg` : '¡En peso objetivo o mantenimiento!'})
- IMC: ${profile.bmi} | TMB: ${profile.bmr} kcal | Gasto Total (TDEE): ${profile.tdee} kcal
- Calorías meta recomendadas al día: ~${profile.targetDailyCalories} kcal (déficit moderado y seguro)
- Nivel de actividad: ${profile.activityLevel}
- Preferencias o restricciones del usuario: ${profile.dietPreferences || 'Ninguna especificada'}

CONOCIMIENTO PROFUNDO Y APRENDIZAJES ACUMULADOS DE OTTO SOBRE ${profile.name.toUpperCase()}:
1. Memoria cognitiva a largo plazo (hábitos y patrones detectados):
${memoryContext}

2. Reflexiones personales y notas del diario de hábitos escritas por el usuario (¡Úsalas para aconsejarlo con empatía y recordar cómo se siente!):
${notesSummary}

3. Consistencia en hábitos (Últimos 7 días):
- Ejercicio realizado: ${exerciseDaysCount} de los últimos ${last7DaysStreaks.length} días registrados.
- Promedio de hidratación: ~${avgGlasses} vasos de agua/día.
- Historial reciente de pesajes: ${weightProgressStr}

ESTADO DE HOY (${today}):
${streakSummary}
Comidas registradas hoy:
${foodSummary}

DIRECTRICES DE TUS RESPUESTAS (COACH OTTO):
1. Preséntate y actúa siempre como Otto. Sé positivo, empático, realista y científico sin ser aburrido.
2. UTILIZA LO QUE HAS APRENDIDO DE ÉL: Si en sus notas o hábitos ves que ha tenido antojos por la tarde, cansancio, o por el contrario un gran día de energía y constancia, menciónalo sutilmente para que sepa que Otto realmente lo conoce y recuerda su progreso.
3. Promueve comida casera, accesible y económica (huevo, avena, verduras de mercado, legumbres, atún).
4. SUPERPODER DE REGISTRO AUTOMÁTICO (ASISTENTE INTEGRAL):
Tienes el poder de registrar y modificar directamente los hábitos y datos del usuario en la base de datos de la app.
Cuando el usuario te cuente que tomó agua, comió algo, hizo ejercicio, consumió vegetales o se pesó, respóndele de forma natural y cálida confirmándole que ya lo anotaste por él en su diario de hoy, e INCLUYE al final de tu respuesta la acción técnica en esta sintaxis EXACTA:
- Si tomó agua (ej. "tomé 3 vasos de agua", "me tomé un vaso"):
  <<<ACTION:{"type":"add_water","glasses":3}>>>
- Si comió algo (ej. "comí sopa de verduras con huevo", "cené carne molida"):
  <<<ACTION:{"type":"add_food","mealType":"cena","description":"Carne molida con 2 huevos","estimatedCalories":360,"healthyRating":"excelente"}>>>
- Si hizo ejercicio o caminó (ej. "hice 20 min de caminata", "hice la rutina"):
  <<<ACTION:{"type":"log_exercise","minutes":20}>>>
- Si consumió vegetales (ej. "comí ensalada", "comí brócoli"):
  <<<ACTION:{"type":"add_veggies","portions":1}>>>
- Si registró un nuevo peso (ej. "hoy pesé 81.5 kg"):
  <<<ACTION:{"type":"record_weight","weight":81.5}>>>

REGLA DE ORO DE INTERFAZ:
NUNCA escribas JSON, ni corchetes crudos, ni [LOG_SUGGESTION] en tu texto conversacional visible. Toda acción debe ir dentro de <<<ACTION:{...}>>>. El sistema la procesará y la ocultará automáticamente del chat.
5. Si pide recetas o ejercicios, adapta la recomendación a su nivel y condición articular (siempre prioriza bajo impacto si hay sobrepeso).
6. ${languageInstruction} Comunícate con tono motivador, profesional y cercano.`;
}

/**
 * Analiza y ejecuta de manera autónoma las acciones indicadas por el Consejero IA en Dexie.js
 * y limpia el texto para evitar fugas de código en la interfaz.
 */
export async function executeAndCleanCoachActions(
  rawText: string,
  profile: UserProfile
): Promise<{ cleanText: string; executedActions: CoachAction[] }> {
  const executedActions: CoachAction[] = [];
  const today = getTodayDateString();
  const now = new Date();
  const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  const actionRegexes = [
    /<<<ACTION:\s*({.*?})>>>/gis,
    /<<<ACTION>>>\s*({.*?})\s*<<<\/ACTION>>>/gis,
    /\[LOG_SUGGESTION:\s*({.*?})\]/gis,
    /\[ACTION:\s*({.*?})\]/gis
  ];

  for (const regex of actionRegexes) {
    let match;
    while ((match = regex.exec(rawText)) !== null) {
      try {
        const payload = JSON.parse(match[1]);
        const type = payload.type || (payload.mealType ? 'add_food' : null);

        if (type === 'add_water' || (payload.glasses !== undefined && !payload.mealType)) {
          const glasses = Number(payload.glasses) || 1;
          const streak = await getOrCreateTodayStreak();
          const newTotal = Math.max(0, (streak.waterGlasses || 0) + glasses);
          await db.dailyStreaks.update(streak.id!, {
            waterGlasses: newTotal
          });
          executedActions.push({
            type: 'add_water',
            label: `+${glasses} ${glasses === 1 ? 'vaso' : 'vasos'} de agua anotados (+${glasses * 250} ml)`,
            data: { glasses, totalGlasses: newTotal }
          });
        } else if (type === 'add_food' || payload.mealType || payload.description) {
          const mealType = payload.mealType || 'almuerzo';
          const description = payload.description || 'Comida registrada con el asistente';
          const estimatedCalories = Number(payload.estimatedCalories) || 250;
          const healthyRating = payload.healthyRating || 'bueno';

          const newFood: FoodLog = {
            date: today,
            time: timeStr,
            mealType,
            description,
            estimatedCalories,
            healthyRating,
            aiFeedback: 'Anotado automáticamente por Otto'
          };
          await db.foodLogs.add(newFood);
          executedActions.push({
            type: 'add_food',
            label: `Comida anotada (${mealType}): ${description} (~${estimatedCalories} kcal)`,
            data: newFood
          });
        } else if (type === 'log_exercise') {
          const minutes = Number(payload.minutes) || 20;
          const streak = await getOrCreateTodayStreak();
          await db.dailyStreaks.update(streak.id!, {
            exerciseCompleted: true,
            exerciseMinutes: (streak.exerciseMinutes || 0) + minutes
          });
          executedActions.push({
            type: 'log_exercise',
            label: `Ejercicio registrado: ${minutes} min de actividad completada`,
            data: { minutes }
          });
        } else if (type === 'add_veggies') {
          const portions = Number(payload.portions) || 1;
          const streak = await getOrCreateTodayStreak();
          const newPortions = (streak.vegetablesPortions || 0) + portions;
          await db.dailyStreaks.update(streak.id!, {
            vegetablesPortions: newPortions
          });
          executedActions.push({
            type: 'add_veggies',
            label: `+${portions} ${portions === 1 ? 'porción' : 'porciones'} de vegetales anotada`,
            data: { portions }
          });
        } else if (type === 'record_weight') {
          const newWeight = Number(payload.weight);
          if (!isNaN(newWeight) && newWeight >= 30 && newWeight <= 300) {
            const newBmi = calculateBMI(newWeight, profile.height);
            await db.userProfile.update(profile.id!, {
              currentWeight: newWeight,
              bmi: newBmi,
              updatedAt: now.toISOString()
            });
            await db.weightRecords.add({
              date: today,
              weight: newWeight,
              note: 'Anotado por Otto'
            });
            executedActions.push({
              type: 'record_weight',
              label: `Nuevo peso anotado: ${newWeight} kg (IMC: ${newBmi})`,
              data: { weight: newWeight, bmi: newBmi }
            });
          }
        }
      } catch (err) {
        console.warn('Error al procesar acción del coach:', err);
      }
    }
  }

  // Limpiar completamente el texto visible de cualquier código o etiqueta
  let cleanText = rawText;
  for (const regex of actionRegexes) {
    cleanText = cleanText.replace(regex, '');
  }
  cleanText = cleanText
    .replace(/<<<ACTION.*?>>>/gis, '')
    .replace(/\[LOG_SUGGESTION.*?\]/gis, '')
    .replace(/\[ACTION.*?\]/gis, '')
    .trim();

  // Disparar evento global para que Dashboard y demás vistas se refresquen de inmediato
  if (executedActions.length > 0 && typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('downpeso:data-updated'));
  }

  return { cleanText, executedActions };
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

    const rawReply = response.text || 'No pude generar una respuesta en este momento. Intenta de nuevo.';

    // Procesar y ejecutar cualquier acción automática (agua, comidas, ejercicio, peso)
    const { cleanText, executedActions } = await executeAndCleanCoachActions(rawReply, profile);

    // Guardar respuesta limpia del asistente en BD con sus acciones ejecutadas
    await db.chatHistory.add({
      role: 'assistant',
      content: cleanText,
      timestamp: new Date().toISOString(),
      executedActions: executedActions.length > 0 ? executedActions : undefined
    });

    // Feedback visual reactivo para cada acción ejecutada automáticamente
    if (executedActions.length > 0) {
      executedActions.forEach((act) => {
        showFeedback({
          type: 'success',
          title: '¡Acción Anotada por Otto!',
          message: act.label
        });
      });
    }

    // Disparar rutina de resumen en segundo plano si hay muchos mensajes acumulados
    triggerMemorySummarizationIfNeeded().catch(err => console.warn('Memory summarization skipped:', err));

    return cleanText;
  } catch (error: any) {
    console.error('Error en llamada a Gemini API:', error);
    let errorMsg = String(error?.message || '');
    try {
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

  // Extraer también notas recientes de hábitos para alimentar la memoria consolidada
  const recentStreakNotes = await db.dailyStreaks
    .orderBy('date')
    .reverse()
    .filter(s => !!s.notes && s.notes.trim().length > 0)
    .limit(5)
    .toArray();

  const notesTranscript = recentStreakNotes.length > 0
    ? recentStreakNotes.map(n => `• [${n.date}]: "${(n.notes || '').trim()}"`).join('\n')
    : 'Sin notas adicionales escritas.';

  const existingMemory = await db.aiMemorySummary.toCollection().first();

  const prompt = `Analiza estas conversaciones y notas de diario entre el usuario ${profile.name} y su coach Otto.
Extrae y actualiza un resumen conciso de máximo 180 palabras con:
1. Preferencias alimenticias o gustos descubiertos.
2. Dificultades emocionales, antojos o estados de energía reportados.
3. Hábitos positivos y progresos que el usuario está logrando.
4. Cualquier lesión o condición física relevante.

MEMORIA PREVIA EXISTENTE DE OTTO:
${existingMemory?.summaryText || 'Ninguna'}

REFLEXIONES RECIENTES EN SU DIARIO DE HÁBITOS:
${notesTranscript}

TRANSCRIPCIÓN RECIENTE DE CHARLAS CON OTTO:
${conversationTranscript}

Responde ÚNICAMENTE en formato JSON plano:
{
  "summaryText": "Resumen integrado y actualizado de 2 o 3 párrafos cortos que Otto recordará.",
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
