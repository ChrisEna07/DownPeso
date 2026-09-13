import React, { useState, useEffect } from 'react';
import { Droplets, Clock, X, CheckCircle2 } from 'lucide-react';
import { recordWaterFromNotification, snoozeReminder, InAppNotification } from '@/lib/notifications';

export const NotificationBanner: React.FC = () => {
  const [currentNotification, setCurrentNotification] = useState<InAppNotification | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  useEffect(() => {
    const handleNotification = (e: any) => {
      if (e.detail) {
        setCurrentNotification(e.detail);
      }
    };

    window.addEventListener('downpeso:smart-notification', handleNotification);
    return () => window.removeEventListener('downpeso:smart-notification', handleNotification);
  }, []);

  const handleDrinkWater = async () => {
    await recordWaterFromNotification();
    setFeedbackMsg('¡Excelente! Vaso de agua registrado (+250 ml)');
    setTimeout(() => {
      setFeedbackMsg(null);
      setCurrentNotification(null);
    }, 2000);
  };

  const handleSnooze = () => {
    snoozeReminder(5);
    setFeedbackMsg('Entendido. Te recordaré de nuevo en 5 minutos.');
    setTimeout(() => {
      setFeedbackMsg(null);
      setCurrentNotification(null);
    }, 2000);
  };

  const handleDismiss = () => {
    setCurrentNotification(null);
  };

  if (!currentNotification) return null;

  return (
    <div className="fixed top-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-50 animate-in slide-in-from-top-6 duration-300">
      <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-3xl p-4 sm:p-5 border border-cyan-200 dark:border-cyan-800 shadow-2xl shadow-cyan-900/20 space-y-3">
        {feedbackMsg ? (
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 py-2">
            <CheckCircle2 className="w-5 h-5" />
            <span>{feedbackMsg}</span>
          </div>
        ) : (
          <>
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="p-2.5 bg-cyan-100 dark:bg-cyan-950 text-cyan-600 rounded-2xl shrink-0 mt-0.5 shadow-sm">
                  <Droplets className="w-5 h-5 fill-current animate-bounce" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-900 dark:text-white">
                    {currentNotification.title}
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mt-0.5">
                    {currentNotification.message}
                  </p>
                </div>
              </div>
              <button
                onClick={handleDismiss}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
                aria-label="Cerrar recordatorio"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Botones de Acción Rápida: "Ya tomé" o "Recuérdame en 5 min" */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={handleDrinkWater}
                className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-2xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-md shadow-cyan-600/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <Droplets className="w-3.5 h-3.5 fill-current" />
                ¡Ya tomé! (+1 vaso)
              </button>

              <button
                onClick={handleSnooze}
                className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs transition-colors"
              >
                <Clock className="w-3.5 h-3.5" />
                En 5 minutos
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
