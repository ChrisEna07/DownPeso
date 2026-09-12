import React from 'react';
import { UserProfile } from '@/types';
import { Flame, UserCog, Database, Sparkles } from 'lucide-react';

interface NavbarProps {
  profile: UserProfile | null;
  onOpenProfile: () => void;
  onOpenBackup: () => void;
  activeStreak: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  profile,
  onOpenProfile,
  onOpenBackup,
  activeStreak
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 px-4 sm:px-6 py-3 transition-colors">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo & Marca */}
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 p-0.5 shadow-md shadow-emerald-500/20 flex items-center justify-center">
            <img src="/favicon.svg" alt="DownPeso Logo" className="w-8 h-8 rounded-xl" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-base sm:text-lg font-black tracking-tight text-slate-900 dark:text-white">
                DownPeso
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-300/40">
                By ChrizDev
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:block">
              Salud, Nutrición Casera & Hábitos
            </p>
          </div>
        </div>

        {/* Acciones de cabecera */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Contador de racha visible */}
          <div
            className="flex items-center gap-1.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 px-3 py-1.5 rounded-full text-amber-700 dark:text-amber-400 shadow-sm"
            title={`${activeStreak} días de racha activa`}
          >
            <Flame className="w-4 h-4 fill-amber-500 text-amber-500 animate-pulse-subtle" />
            <span className="text-xs sm:text-sm font-extrabold">{activeStreak}</span>
            <span className="text-[11px] hidden sm:inline font-semibold">días</span>
          </div>

          {/* Botón rápido de Respaldo */}
          <button
            onClick={onOpenBackup}
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-slate-800 transition-colors"
            title="Centro de Respaldo JSON"
            aria-label="Abrir centro de respaldo"
          >
            <Database className="w-5 h-5" />
          </button>

          {/* Perfil del Usuario */}
          <button
            onClick={onOpenProfile}
            className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-2xl border border-slate-200 dark:border-slate-700 hover:border-emerald-400 dark:hover:border-emerald-500 bg-slate-50 dark:bg-slate-800 transition-all shadow-sm"
            title="Ver o editar perfil antropométrico"
          >
            <div className="w-7 h-7 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shadow-inner">
              {profile?.name ? profile.name.charAt(0).toUpperCase() : <Sparkles className="w-3.5 h-3.5" />}
            </div>
            <span className="text-xs font-bold text-slate-700 dark:text-slate-200 max-w-[90px] truncate hidden sm:inline">
              {profile?.name || 'Mi Perfil'}
            </span>
            <UserCog className="w-3.5 h-3.5 text-slate-400" />
          </button>
        </div>
      </div>
    </header>
  );
};
