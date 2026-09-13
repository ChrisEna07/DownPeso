import React from 'react';
import {
  LayoutDashboard,
  MessageSquareHeart,
  UtensilsCrossed,
  Dumbbell,
  Leaf,
  CheckCheck,
  Database
} from 'lucide-react';
import { t } from '@/lib/i18n';

export type ActiveTab = 'dashboard' | 'chat' | 'recipes' | 'exercises' | 'remedies' | 'streaks' | 'backup';

interface TabNavigationProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
}

interface TabItem {
  id: ActiveTab;
  labelKey: string;
  icon: React.ElementType;
  shortLabelKey: string;
}

const TABS: TabItem[] = [
  { id: 'dashboard', labelKey: 'nav_home', shortLabelKey: 'nav_home', icon: LayoutDashboard },
  { id: 'chat', labelKey: 'nav_coach', shortLabelKey: 'nav_coach_short', icon: MessageSquareHeart },
  { id: 'recipes', labelKey: 'nav_recipes', shortLabelKey: 'nav_recipes_short', icon: UtensilsCrossed },
  { id: 'exercises', labelKey: 'nav_exercises', shortLabelKey: 'nav_exercises_short', icon: Dumbbell },
  { id: 'remedies', labelKey: 'nav_remedies', shortLabelKey: 'nav_remedies_short', icon: Leaf },
  { id: 'streaks', labelKey: 'nav_streaks', shortLabelKey: 'nav_streaks_short', icon: CheckCheck },
  { id: 'backup', labelKey: 'nav_backup', shortLabelKey: 'nav_backup_short', icon: Database },
];

export const TabNavigation: React.FC<TabNavigationProps> = ({ activeTab, onSelectTab }) => {
  return (
    <>
      {/* Navegación superior tipo Pills para tablets y escritorio */}
      <div className="hidden md:flex items-center justify-center p-2 bg-slate-100/90 dark:bg-slate-900/90 rounded-2xl max-w-4xl mx-auto my-4 border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
        <div className="flex items-center gap-1.5 w-full justify-between overflow-x-auto py-0.5 px-1">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onSelectTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20 scale-[1.02]'
                    : 'text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-white/60 dark:hover:bg-slate-800/60'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                {t(tab.labelKey)}
              </button>
            );
          })}
        </div>
      </div>

      {/* Navegación fija inferior para móviles (Mobile-First) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg border-t border-slate-200 dark:border-slate-800 pb-[max(env(safe-area-inset-bottom),8px)] pt-1.5 px-2">
        <div className="grid grid-cols-7 gap-0.5 items-center">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onSelectTab(tab.id)}
                className={`flex flex-col items-center justify-center py-1 rounded-xl transition-all ${
                  isActive
                    ? 'text-emerald-600 dark:text-emerald-400 font-extrabold'
                    : 'text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                <div className={`p-1 rounded-xl transition-all ${isActive ? 'bg-emerald-50 dark:bg-emerald-950/60 scale-110' : ''}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-[9px] mt-0.5 truncate max-w-[48px] text-center">
                  {t(tab.shortLabelKey)}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
};
