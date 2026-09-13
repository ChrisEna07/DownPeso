import React, { useState, useEffect } from 'react';
import { FeedbackItem } from '@/types';
import { CheckCircle2, AlertCircle, X, Bot, ArrowRight } from 'lucide-react';

export const FeedbackToastContainer: React.FC = () => {
  const [toasts, setToasts] = useState<FeedbackItem[]>([]);

  useEffect(() => {
    const handleFeedback = (e: any) => {
      if (e.detail) {
        const newToast: FeedbackItem = e.detail;
        setToasts((prev) => [...prev.slice(-3), newToast]);

        // Auto-eliminar tras la duración especificada
        const timer = setTimeout(() => {
          removeToast(newToast.id);
        }, newToast.durationMs || 4000);

        return () => clearTimeout(timer);
      }
    };

    window.addEventListener('downpeso:feedback', handleFeedback);
    return () => window.removeEventListener('downpeso:feedback', handleFeedback);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-5 right-4 left-4 sm:left-auto sm:right-6 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => {
        const isSuccess = toast.type === 'success';
        const isError = toast.type === 'error';
        const isAnnouncement = toast.type === 'announcement';

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto rounded-3xl p-4 shadow-xl border backdrop-blur-md transition-all duration-300 animate-in slide-in-from-top-4 fade-in ${
              isSuccess
                ? 'bg-white/95 dark:bg-slate-900/95 border-emerald-500/80 shadow-emerald-600/15 text-slate-900 dark:text-white'
                : isError
                ? 'bg-white/95 dark:bg-slate-900/95 border-rose-500/80 shadow-rose-600/15 text-slate-900 dark:text-white'
                : 'bg-white/95 dark:bg-slate-900/95 border-cyan-500/80 shadow-cyan-600/15 text-slate-900 dark:text-white'
            }`}
          >
            <div className="flex items-start gap-3">
              {/* Icono temático según el tipo de feedback */}
              <div
                className={`p-2 rounded-2xl shrink-0 shadow-sm ${
                  isSuccess
                    ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-600'
                    : isError
                    ? 'bg-rose-100 dark:bg-rose-950 text-rose-600'
                    : 'bg-cyan-100 dark:bg-cyan-950 text-cyan-600'
                }`}
              >
                {isSuccess && <CheckCircle2 className="w-5 h-5" />}
                {isError && <AlertCircle className="w-5 h-5" />}
                {isAnnouncement && <Bot className="w-5 h-5" />}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <span
                    className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                      isSuccess
                        ? 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300'
                        : isError
                        ? 'bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300'
                        : 'bg-cyan-100 dark:bg-cyan-900/60 text-cyan-700 dark:text-cyan-300'
                    }`}
                  >
                    {isSuccess ? 'Éxito' : isError ? 'Atención' : 'Aviso de Otto'}
                  </span>

                  <button
                    onClick={() => removeToast(toast.id)}
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 rounded-lg"
                    aria-label="Cerrar notificación"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <h4 className="text-xs sm:text-sm font-black mt-1 text-slate-900 dark:text-white">
                  {toast.title}
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">
                  {toast.message}
                </p>

                {toast.actionLabel && toast.onAction && (
                  <button
                    onClick={() => {
                      toast.onAction?.();
                      removeToast(toast.id);
                    }}
                    className={`mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold transition-all shadow-xs ${
                      isSuccess
                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                        : isError
                        ? 'bg-rose-600 hover:bg-rose-500 text-white'
                        : 'bg-cyan-600 hover:bg-cyan-500 text-white'
                    }`}
                  >
                    <span>{toast.actionLabel}</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
