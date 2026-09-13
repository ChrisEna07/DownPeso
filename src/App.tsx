import React, { useState, useEffect, useCallback } from 'react';
import { UserProfile, DailyStreak, FoodLog } from '@/types';
import { db, seedInitialDataIfNeeded, getOrCreateTodayStreak, calculateActiveStreakDays, getTodayDateString } from '@/lib/db';
import { Navbar } from '@/components/layout/Navbar';
import { TabNavigation, ActiveTab } from '@/components/layout/TabNavigation';
import { InstallPrompt } from '@/components/layout/InstallPrompt';
import { OnboardingModal } from '@/components/onboarding/OnboardingModal';
import { Dashboard } from '@/components/dashboard/Dashboard';
import { ChatInterface } from '@/components/chat/ChatInterface';
import { RecipeCatalog } from '@/components/recipes/RecipeCatalog';
import { ExerciseGuide } from '@/components/exercises/ExerciseGuide';
import { RemediesGuide } from '@/components/natural-remedies/RemediesGuide';
import { StreakTracker } from '@/components/streaks/StreakTracker';
import { BackupManager } from '@/components/backup/BackupManager';
import { FloatingCoach } from '@/components/chat/FloatingCoach';
import { NotificationBanner } from '@/components/notifications/NotificationBanner';
import { initSmartNotifications } from '@/lib/notifications';
import { Loader2 } from 'lucide-react';

export const App: React.FC = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [todayStreak, setTodayStreak] = useState<DailyStreak | null>(null);
  const [todayFoodLogs, setTodayFoodLogs] = useState<FoodLog[]>([]);
  const [activeStreakCount, setActiveStreakCount] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [isLoadingApp, setIsLoadingApp] = useState<boolean>(true);
  const [showProfileModal, setShowProfileModal] = useState<boolean>(false);

  // Inicialización y carga de datos de IndexedDB
  const refreshAppData = useCallback(async () => {
    try {
      await seedInitialDataIfNeeded();

      // Cargar perfil
      const user = await db.userProfile.toCollection().first();
      setProfile(user || null);

      // Cargar racha del día de hoy
      const streak = await getOrCreateTodayStreak();
      setTodayStreak(streak);

      // Cargar comidas de hoy
      const today = getTodayDateString();
      const foods = await db.foodLogs.where('date').equals(today).toArray();
      setTodayFoodLogs(foods);

      // Calcular racha activa
      const { currentStreak } = await calculateActiveStreakDays();
      setActiveStreakCount(currentStreak);

      // Si no hay perfil, abrir onboarding automáticamente
      if (!user) {
        setShowProfileModal(true);
      }
    } catch (err) {
      console.error('Error cargando base de datos:', err);
    } finally {
      setIsLoadingApp(false);
    }
  }, []);

  useEffect(() => {
    refreshAppData();
    initSmartNotifications();
    const handleDataUpdated = () => refreshAppData();
    window.addEventListener('downpeso:data-updated', handleDataUpdated);
    return () => window.removeEventListener('downpeso:data-updated', handleDataUpdated);
  }, [refreshAppData]);

  if (isLoadingApp) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 p-4 space-y-3">
        <div className="w-14 h-14 rounded-3xl bg-emerald-600 flex items-center justify-center text-white shadow-xl shadow-emerald-600/30 animate-pulse">
          <Loader2 className="w-7 h-7 animate-spin" />
        </div>
        <div className="text-center space-y-1">
          <h1 className="text-base font-black text-slate-900 dark:text-white">
            DownPeso By ChrizDev
          </h1>
          <p className="text-xs text-slate-500">Cargando base de datos privada en cliente...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      {/* Banner de Notificaciones Inteligentes de Hidratación */}
      <NotificationBanner />

      {/* Banner de Instalación PWA */}
      <InstallPrompt />

      {/* Barra de Navegación Superior */}
      <Navbar
        profile={profile}
        onOpenProfile={() => setShowProfileModal(true)}
        onOpenBackup={() => setActiveTab('backup')}
        activeStreak={activeStreakCount}
      />

      {/* Contenido Principal */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 pt-2 pb-6">
        {/* Selector de Pestañas */}
        <TabNavigation
          activeTab={activeTab}
          onSelectTab={(tab) => setActiveTab(tab)}
        />

        {/* Renderizado de Módulos según Pestaña Activa */}
        <div className="mt-2">
          {activeTab === 'dashboard' && profile && (
            <Dashboard
              profile={profile}
              todayStreak={todayStreak}
              todayFoodLogs={todayFoodLogs}
              activeStreak={activeStreakCount}
              onNavigateTab={(tab) => setActiveTab(tab)}
              onOpenProfile={() => setShowProfileModal(true)}
              onRefreshData={refreshAppData}
            />
          )}

          {activeTab === 'chat' && profile && (
            <ChatInterface
              profile={profile}
              onFoodLogged={refreshAppData}
            />
          )}

          {activeTab === 'recipes' && (
            <RecipeCatalog />
          )}

          {activeTab === 'exercises' && (
            <ExerciseGuide
              onExerciseCompleted={refreshAppData}
            />
          )}

          {activeTab === 'remedies' && (
            <RemediesGuide />
          )}

          {activeTab === 'streaks' && profile && (
            <StreakTracker
              profile={profile}
              todayStreak={todayStreak}
              onRefreshData={refreshAppData}
            />
          )}

          {activeTab === 'backup' && (
            <BackupManager
              onDataRestored={refreshAppData}
            />
          )}
        </div>
      </main>

      {/* Botón Flotante del Coach accesible en cualquier pantalla */}
      {profile && (
        <FloatingCoach
          profile={profile}
          currentTab={activeTab}
          onOpenFullChat={() => setActiveTab('chat')}
          onDataUpdated={refreshAppData}
        />
      )}

      {/* Modal de Onboarding / Perfil Antropométrico */}
      <OnboardingModal
        isOpen={showProfileModal}
        onClose={() => {
          if (profile) setShowProfileModal(false);
        }}
        existingProfile={profile}
        onProfileSaved={refreshAppData}
      />
    </div>
  );
};

export default App;
