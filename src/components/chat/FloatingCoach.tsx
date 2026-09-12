import React, { useState } from 'react';
import { UserProfile } from '@/types';
import { MessageSquareHeart, X, Maximize2, Sparkles } from 'lucide-react';
import { ChatInterface } from './ChatInterface';

interface FloatingCoachProps {
  profile: UserProfile;
  currentTab: string;
  onOpenFullChat: () => void;
  onDataUpdated?: () => void;
}

export const FloatingCoach: React.FC<FloatingCoachProps> = ({
  profile,
  currentTab,
  onOpenFullChat,
  onDataUpdated
}) => {
  const [isOpen, setIsOpen] = useState(false);

  // Si ya está en la pestaña completa de chat, no mostramos el botón flotante para evitar duplicidad
  if (currentTab === 'chat') {
    return null;
  }

  return (
    <>
      {/* Botón Flotante (FAB) accesible desde cualquier módulo */}
      {!isOpen && (
        <div className="fixed bottom-20 right-4 md:bottom-6 md:right-6 z-40 flex items-center gap-2 group animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="hidden sm:flex items-center px-3 py-1.5 rounded-full bg-slate-900/90 dark:bg-slate-800/90 text-white text-xs font-bold shadow-lg border border-slate-700/60 backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            <Sparkles className="w-3 h-3 text-emerald-400 mr-1.5" />
            Hablar con mi Coach
          </div>

          <button
            onClick={() => setIsOpen(true)}
            className="relative p-3.5 sm:p-4 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white shadow-xl shadow-emerald-700/35 transition-all hover:scale-110 active:scale-95 focus:outline-none focus:ring-4 focus:ring-emerald-500/30"
            aria-label="Abrir asistente de IA flotante"
            title="Abrir Consejero IA"
          >
            <MessageSquareHeart className="w-6 h-6 fill-current text-white" />
            <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75" />
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-400 border-2 border-white" />
            </span>
          </button>
        </div>
      )}

      {/* Modal Flotante / Drawer Superpuesto */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-end sm:justify-end p-2 sm:p-6 bg-slate-950/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full sm:w-[460px] h-[85vh] sm:h-[680px] max-h-[92vh] bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden animate-in slide-in-from-bottom-6 sm:slide-in-from-right-6 duration-300">
            {/* Cabecera del Drawer Flotante */}
            <div className="p-3.5 bg-gradient-to-r from-emerald-700 via-emerald-600 to-teal-600 text-white flex items-center justify-between shrink-0 shadow-sm">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-white/15 rounded-xl backdrop-blur-md">
                  <MessageSquareHeart className="w-5 h-5 fill-current" />
                </div>
                <div>
                  <h3 className="text-sm font-black tracking-tight leading-tight">
                    DownPeso Coach
                  </h3>
                  <p className="text-[10px] text-emerald-100 font-medium">
                    Asistente activo con memoria en tiempo real
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                {/* Botón para expandir a pantalla completa */}
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    onOpenFullChat();
                  }}
                  className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/15 transition-colors"
                  title="Abrir en pantalla completa"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>
                {/* Botón para cerrar */}
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/15 transition-colors"
                  title="Cerrar ventana flotante"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Contenido del Chat con la interfaz interactiva */}
            <div className="flex-1 overflow-hidden relative">
              <ChatInterface
                profile={profile}
                onFoodLogged={onDataUpdated}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
};
