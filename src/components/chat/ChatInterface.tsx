import React, { useState, useEffect, useRef } from 'react';
import { UserProfile, ChatMessage, AIMemorySummary, FoodLog } from '@/types';
import {
  Send,
  Sparkles,
  Bot,
  User,
  Trash2,
  BrainCircuit,
  PlusCircle,
  CheckCircle2,
  Info,
  Loader2,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { db, getTodayDateString } from '@/lib/db';
import { sendChatMessage, triggerMemorySummarizationIfNeeded, sanitizeChatHistory } from '@/lib/gemini';
import { showFeedback } from '@/lib/feedback';
import { t } from '@/lib/i18n';
import confetti from 'canvas-confetti';

interface ChatInterfaceProps {
  profile: UserProfile;
  onFoodLogged?: () => void;
}

const QUICK_PROMPTS = [
  '🍽️ Registrar lo que comí hoy',
  '💧 Anota 2 vasos de agua que tomé',
  '🎯 ¿Cómo voy con mi meta y qué me sugieres?',
  '🥗 Recomiéndame una cena ligera y rápida',
  '🌙 Otto, activa el modo oscuro',
  '🔤 Otto, haz la letra más grande',
  '🏃 ¿Qué ejercicio ligero puedo hacer hoy en casa?',
  '📝 Anota en mi diario que hoy me sentí con mucha energía'
];

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ profile, onFoodLogged }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pendingUserText, setPendingUserText] = useState<string | null>(null);
  const [lastFailedText, setLastFailedText] = useState<string | null>(null);
  const [memorySummary, setMemorySummary] = useState<AIMemorySummary | null>(null);
  const [showMemoryModal, setShowMemoryModal] = useState(false);
  const [loggedSuggestions, setLoggedSuggestions] = useState<Record<number, boolean>>({});

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Cargar historial y resumen de memoria
  const loadChat = async () => {
    await sanitizeChatHistory();
    const history = await db.chatHistory.orderBy('id').toArray();
    setMessages(history);

    const memory = await db.aiMemorySummary.toCollection().first();
    setMemorySummary(memory || null);
  };

  useEffect(() => {
    loadChat();
    const handleUpdate = () => loadChat();
    window.addEventListener('downpeso:data-updated', handleUpdate);
    return () => window.removeEventListener('downpeso:data-updated', handleUpdate);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading, pendingUserText]);

  const handleSendMessage = async (textToSend?: string) => {
    const content = (textToSend || inputText).trim();
    if (!content || isLoading) return;

    setInputText('');
    setErrorMessage(null);
    setLastFailedText(null);
    setPendingUserText(content);
    setIsLoading(true);

    try {
      await sendChatMessage(content);
      setPendingUserText(null);
      await loadChat();
    } catch (err: any) {
      console.error('Error enviando mensaje:', err);
      setPendingUserText(null);
      setLastFailedText(content);
      setErrorMessage(err.message || 'Error al comunicarse con el asistente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearHistory = async () => {
    if (window.confirm('¿Deseas vaciar el historial de conversación actual? La memoria de hábitos aprendida se conservará.')) {
      await db.chatHistory.clear();
      setMessages([]);
    }
  };

  const handleSaveFoodSuggestion = async (msgIndex: number, rawJson: string) => {
    try {
      const parsed = JSON.parse(rawJson);
      const today = getTodayDateString();
      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

      const newLog: FoodLog = {
        date: today,
        time: timeStr,
        mealType: parsed.mealType || 'snack',
        description: parsed.description || 'Comida registrada con asistente',
        estimatedCalories: parsed.estimatedCalories || 200,
        healthyRating: parsed.healthyRating || 'bueno',
        aiFeedback: 'Registrado desde Otto Coach'
      };

      await db.foodLogs.add(newLog);

      // Persistir permanentemente que este mensaje fue confirmado en IndexedDB
      const targetMsg = messages[msgIndex];
      if (targetMsg?.id) {
        await db.chatHistory.update(targetMsg.id, { isConfirmed: true });
      }

      // Añadir mensaje conversacional de Otto confirmando el registro
      const confirmationText = `¡Listo, ${profile.name}! He registrado ${newLog.description} (~${newLog.estimatedCalories} kcal) en tu diario de hoy. Excelente decisión, ¡cada paso cuenta! 💪`;
      await db.chatHistory.add({
        role: 'assistant',
        content: confirmationText,
        timestamp: new Date().toISOString(),
        executedActions: [
          {
            type: 'add_food',
            label: `Comida confirmada: ${newLog.description} (~${newLog.estimatedCalories} kcal)`,
            data: newLog
          }
        ]
      });

      // Feedback visual reactivo tipo éxito
      showFeedback({
        type: 'success',
        title: '¡Comida Registrada!',
        message: `${newLog.description} (~${newLog.estimatedCalories} kcal) guardada en tu diario de hoy.`
      });

      setLoggedSuggestions(prev => ({ ...prev, [msgIndex]: true }));
      try {
        confetti({ particleCount: 50, spread: 60, origin: { y: 0.8 } });
      } catch (_) {}

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('downpeso:data-updated'));
      }
      onFoodLogged?.();
      await loadChat();
    } catch (err) {
      console.error('Error parseando sugerencia de comida:', err);
      showFeedback({
        type: 'error',
        title: 'Error al Registrar',
        message: 'No se pudo guardar la comida. Intenta de nuevo.'
      });
    }
  };

  // Helper para renderizar contenido limpio y tarjetas de acciones ejecutadas por el coach
  const renderMessageContent = (msg: ChatMessage, msgIndex: number) => {
    // Limpieza radical de cualquier residuo técnico para que NUNCA se filtre código al usuario
    const cleanedText = msg.content
      .replace(/<<<ACTION:\s*({.*?})>>>/gis, '')
      .replace(/<<<ACTION>>>\s*({.*?})\s*<<<\/ACTION>>>/gis, '')
      .replace(/\[LOG_SUGGESTION:\s*({.*?})\]/gis, '')
      .replace(/\[ACTION:\s*({.*?})\]/gis, '')
      .trim();

    const logMatch = msg.content.match(/\[LOG_SUGGESTION:\s*({.*?})\]/s);

    return (
      <div className="space-y-3">
        <div className="whitespace-pre-wrap leading-relaxed text-sm">
          {cleanedText}
        </div>

        {/* Acciones ejecutadas automáticamente por Otto */}
        {msg.executedActions && msg.executedActions.length > 0 && (
          <div className="mt-2.5 space-y-1.5">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block">
              ⚡ Acciones anotadas automáticamente por Otto:
            </span>
            {msg.executedActions.map((action, i) => (
              <div
                key={i}
                className="flex items-center gap-2 p-2.5 rounded-2xl bg-emerald-100/90 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 text-xs font-bold shadow-sm animate-in fade-in"
              >
                <div className="p-1 bg-emerald-600 text-white rounded-lg shrink-0">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
                <span>{action.label}</span>
              </div>
            ))}
          </div>
        )}

        {/* Retrocompatibilidad para mensajes antiguos con formato previo */}
        {!msg.executedActions?.length && logMatch && (
          <div className="mt-2 p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300/80 dark:border-emerald-800 rounded-2xl">
            {msg.isConfirmed || loggedSuggestions[msgIndex] ? (
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
                ¡Comida guardada en tu registro diario!
              </div>
            ) : (
              <button
                onClick={() => handleSaveFoodSuggestion(msgIndex, logMatch[1])}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors shadow-sm active:scale-95"
              >
                <PlusCircle className="w-4 h-4" />
                Confirmar y Registrar Comida
              </button>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto flex flex-col h-[calc(100vh-140px)] md:h-[calc(100vh-180px)] bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden animate-in fade-in duration-200">
      {/* Cabecera del Chat */}
      <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-tr from-emerald-600 to-teal-500 text-white rounded-2xl shadow-sm">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white">
                Otto - Tu Coach Personal
              </h2>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Conoce tu meta ({profile.targetWeight} kg) y aprende de tus hábitos y notas
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Badge de Memoria Local */}
          <button
            onClick={() => setShowMemoryModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-bold hover:bg-emerald-100 transition-colors"
            title="Ver memoria acumulada en IndexedDB"
          >
            <BrainCircuit className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Memoria Activa</span>
          </button>

          {/* Botón de limpiar chat */}
          {messages.length > 0 && (
            <button
              onClick={handleClearHistory}
              className="p-2 text-slate-400 hover:text-rose-500 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Limpiar pantalla"
              aria-label="Limpiar historial"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Área de Mensajes */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4 my-auto">
            <div className="w-14 h-14 rounded-3xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center shadow-inner">
              <Sparkles className="w-7 h-7" />
            </div>
            <div className="max-w-md space-y-1">
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                ¡Hola {profile.name}! Soy Otto, tu Coach Personal
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Estoy aquí para orientarte en tus comidas cotidianas, motivarte con tus hábitos, aprender de tus reflexiones del diario y mantenerte enfocado en tu objetivo de <strong>{profile.targetWeight} kg</strong>.
              </p>
            </div>

            {/* Chips de Inicio Rápido */}
            <div className="w-full max-w-md pt-2 space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                Preguntas frecuentes o accesos rápidos:
              </span>
              <div className="flex flex-wrap gap-2 justify-center">
                {QUICK_PROMPTS.map((prompt, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(prompt)}
                    className="text-xs font-semibold px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-emerald-950 hover:text-emerald-700 border border-slate-200 dark:border-slate-700 transition-all text-left"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={msg.id || idx}
                className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm mt-1">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] sm:max-w-[75%] rounded-3xl p-4 shadow-sm ${
                    isUser
                      ? 'bg-emerald-600 text-white rounded-br-none'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-bl-none border border-slate-200/60 dark:border-slate-700/60'
                  }`}
                >
                  {isUser ? (
                    <p className="whitespace-pre-wrap leading-relaxed text-sm">{msg.content}</p>
                  ) : (
                    renderMessageContent(msg, idx)
                  )}

                  <div
                    className={`text-[10px] mt-1.5 font-medium ${
                      isUser ? 'text-emerald-200 text-right' : 'text-slate-400'
                    }`}
                  >
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>

                {isUser && (
                  <div className="w-8 h-8 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center shrink-0 shadow-sm mt-1 font-bold text-xs">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            );
          })
        )}

        {/* Burbuja optimista del usuario mientras Otto procesa la respuesta */}
        {pendingUserText && (
          <div className="flex gap-3 justify-end animate-in fade-in duration-200">
            <div className="max-w-[85%] sm:max-w-[75%] rounded-3xl p-4 shadow-sm bg-emerald-600 text-white rounded-br-none opacity-90">
              <p className="whitespace-pre-wrap leading-relaxed text-sm">{pendingUserText}</p>
              <div className="text-[10px] mt-1.5 font-medium text-emerald-200 text-right flex items-center justify-end gap-1">
                <span>Enviando a Otto...</span>
              </div>
            </div>
            <div className="w-8 h-8 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center shrink-0 shadow-sm mt-1 font-bold text-xs">
              <User className="w-4 h-4" />
            </div>
          </div>
        )}

        {isLoading && (
          <div className="flex gap-3 items-center text-slate-500 dark:text-slate-400 text-xs">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
              <Bot className="w-4 h-4" />
            </div>
            <div className="p-3.5 bg-slate-100 dark:bg-slate-800 rounded-2xl rounded-bl-none flex items-center gap-2 border border-slate-200/60 dark:border-slate-700/60">
              <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
              <span>{t('otto_thinking')}</span>
            </div>
          </div>
        )}

        {errorMessage && (
          <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs space-y-3 shadow-sm animate-in fade-in">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-600 dark:text-rose-400 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold">{errorMessage}</p>
                <p className="text-[11px] text-rose-600/80 dark:text-rose-400/80 mt-1">
                  Si el problema persiste, verifica que tu Gemini API Key en tu perfil esté activa y sin restricciones.
                </p>
              </div>
            </div>
            {lastFailedText && (
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => handleSendMessage(lastFailedText)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition-colors shadow-sm active:scale-95 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Reintentar ahora
                </button>
                <button
                  type="button"
                  onClick={handleClearHistory}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs border border-slate-200 dark:border-slate-700 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Restablecer chat
                </button>
              </div>
            )}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input de Mensaje y Sugerencias Rápidas */}
      <div className="p-3 sm:p-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2">
        {messages.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
            <span className="text-[10px] uppercase font-bold text-slate-400 shrink-0">{t('quick_shortcuts')}</span>
            {QUICK_PROMPTS.map((qp, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleSendMessage(qp)}
                className="whitespace-nowrap px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950 text-[11px] font-semibold text-slate-600 dark:text-slate-300 transition-colors shrink-0"
              >
                {qp}
              </button>
            ))}
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            placeholder={t('otto_input_placeholder')}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={isLoading}
            className="flex-1 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 px-4 py-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-900 transition-all"
          />
          <button
            type="submit"
            disabled={isLoading || !inputText.trim()}
            className="p-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-md shadow-emerald-600/20 disabled:opacity-40 disabled:cursor-not-allowed hover:scale-105 active:scale-95"
            aria-label="Enviar mensaje"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>

      {/* Modal de Memoria Adaptativa Local */}
      {showMemoryModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-600 rounded-2xl">
                  <BrainCircuit className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Memoria Adaptativa Local
                  </h3>
                  <p className="text-xs text-slate-500">Persistida en tu IndexedDB privada</p>
                </div>
              </div>
              <button
                onClick={() => setShowMemoryModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs leading-relaxed max-h-72 overflow-y-auto p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
              {memorySummary ? (
                <>
                  <div>
                    <span className="font-bold text-slate-700 dark:text-slate-200 block mb-1">
                      Resumen Acumulado de Hábitos:
                    </span>
                    <p className="text-slate-600 dark:text-slate-300">
                      {memorySummary.summaryText}
                    </p>
                  </div>

                  {memorySummary.learnedHabits?.length > 0 && (
                    <div>
                      <span className="font-bold text-emerald-700 dark:text-emerald-400 block mb-1">
                        Patrones Positivos Detectados:
                      </span>
                      <ul className="list-disc pl-4 text-slate-600 dark:text-slate-300 space-y-0.5">
                        {memorySummary.learnedHabits.map((h, i) => (
                          <li key={i}>{h}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {memorySummary.restrictions?.length > 0 && (
                    <div>
                      <span className="font-bold text-rose-600 dark:text-rose-400 block mb-1">
                        Restricciones o Dificultades:
                      </span>
                      <ul className="list-disc pl-4 text-slate-600 dark:text-slate-300 space-y-0.5">
                        {memorySummary.restrictions.map((r, i) => (
                          <li key={i}>{r}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-6 text-slate-400 space-y-1">
                  <Info className="w-6 h-6 mx-auto text-slate-300 dark:text-slate-600" />
                  <p>A medida que converses con el asistente, compactará aquí tus hábitos y preferencias automáticamente para no saturar tokens.</p>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={async () => {
                  await triggerMemorySummarizationIfNeeded();
                  await loadChat();
                  setShowMemoryModal(false);
                }}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 font-bold text-xs"
              >
                Actualizar Síntesis
              </button>
              <button
                type="button"
                onClick={() => setShowMemoryModal(false)}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
