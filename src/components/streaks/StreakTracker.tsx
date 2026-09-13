import React, { useState, useEffect } from 'react';
import { UserProfile, DailyStreak } from '@/types';
import {
  Flame,
  Droplets,
  Leaf,
  Dumbbell,
  CheckCircle2,
  Calendar,
  Sparkles,
  Trophy,
  Plus,
  Minus,
  Edit3,
  Bell,
  Clock
} from 'lucide-react';
import { db, getTodayDateString, calculateActiveStreakDays, getOrCreateTodayStreak } from '@/lib/db';
import { mlToGlasses } from '@/lib/calculations';
import {
  triggerSmartHydrationReminder,
  requestNotificationPermission,
  getNotificationSettings,
  saveNotificationSettings,
  NotificationSettings
} from '@/lib/notifications';
import confetti from 'canvas-confetti';

interface StreakTrackerProps {
  profile: UserProfile;
  todayStreak: DailyStreak | null;
  onRefreshData: () => void;
}

export const StreakTracker: React.FC<StreakTrackerProps> = ({
  profile,
  todayStreak,
  onRefreshData
}) => {
  const [streakStats, setStreakStats] = useState<{ currentStreak: number; bestStreak: number }>({
    currentStreak: 0,
    bestStreak: 0
  });
  const [pastStreaks, setPastStreaks] = useState<DailyStreak[]>([]);
  const [notesInput, setNotesInput] = useState(todayStreak?.notes || '');
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState(false);
  const [notifSettings, setNotifSettings] = useState<NotificationSettings>(getNotificationSettings());
  const [permStatus, setPermStatus] = useState<string>(
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'denied'
  );

  const targetGlasses = mlToGlasses(profile.dailyWaterGoalMl);
  const currentGlasses = todayStreak?.waterGlasses || 0;
  const currentVeggies = todayStreak?.vegetablesPortions || 0;

  const loadStreakData = async () => {
    const stats = await calculateActiveStreakDays();
    setStreakStats(stats);

    const history = await db.dailyStreaks
      .orderBy('date')
      .reverse()
      .limit(14)
      .toArray();
    setPastStreaks(history);
  };

  useEffect(() => {
    loadStreakData();
    if (todayStreak?.notes !== undefined) {
      setNotesInput(todayStreak.notes || '');
    }
  }, [todayStreak]);

  const updateTodayHabit = async (updates: Partial<DailyStreak>) => {
    const streak = await getOrCreateTodayStreak();
    const nextState = { ...streak, ...updates };

    // Comprobar si cumple todos los hábitos clave
    const allDone = (
      nextState.waterGlasses >= targetGlasses &&
      nextState.vegetablesPortions >= 2 &&
      nextState.exerciseCompleted &&
      nextState.calorieGoalMet
    );

    await db.dailyStreaks.update(streak.id!, {
      ...updates,
      allCompleted: allDone
    });

    if (allDone && !streak.allCompleted) {
      try {
        confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
      } catch (_) {}
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('downpeso:data-updated'));
    }
    onRefreshData();
    await loadStreakData();
  };

  const handleSaveNotes = async () => {
    setIsSavingNotes(true);
    try {
      const streak = await getOrCreateTodayStreak();
      await db.dailyStreaks.update(streak.id!, { notes: notesInput });
      setSaveSuccessMsg(true);
      setTimeout(() => setSaveSuccessMsg(false), 3500);

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('downpeso:data-updated'));
      }
      onRefreshData();
      await loadStreakData();
    } catch (err) {
      console.error('Error al guardar nota:', err);
    } finally {
      setIsSavingNotes(false);
    }
  };

  const handleToggleNotifications = (enabled: boolean) => {
    const updated = { ...notifSettings, enabled };
    setNotifSettings(updated);
    saveNotificationSettings(updated);
  };

  const handleIntervalChange = (intervalMinutes: number) => {
    const updated = { ...notifSettings, intervalMinutes };
    setNotifSettings(updated);
    saveNotificationSettings(updated);
  };

  const handleRequestPermission = async () => {
    const res = await requestNotificationPermission();
    setPermStatus(res);
  };

  const handleTestNotification = async () => {
    await triggerSmartHydrationReminder(true);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200 pb-20 md:pb-8">
      {/* Cabecera de Rachas & Logro */}
      <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-orange-500/15 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-lg">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-amber-100 text-xs font-bold uppercase tracking-wider">
            <Trophy className="w-3.5 h-3.5 text-amber-200" />
            Consistencia & Hábitos Diarios
          </div>
          <h2 className="text-2xl sm:text-3xl font-black">
            Tu Camino Hacia el Hábito Automático
          </h2>
          <p className="text-amber-100 text-xs sm:text-sm leading-relaxed">
            La constancia vence a la intensidad. Mantener pequeños hábitos diarios genera el cambio metabólico que buscas.
          </p>
        </div>

        {/* Display Doble de Racha */}
        <div className="flex items-center gap-3">
          <div className="bg-white/15 backdrop-blur-md border border-white/20 rounded-2xl p-4 text-center min-w-[120px]">
            <div className="text-3xl sm:text-4xl font-black text-white flex items-center justify-center gap-1">
              <Flame className="w-7 h-7 fill-white animate-pulse" />
              {streakStats.currentStreak}
            </div>
            <div className="text-[11px] text-amber-100 font-bold uppercase tracking-wider mt-1">
              Días Racha Actual
            </div>
          </div>

          <div className="bg-white/15 backdrop-blur-md border border-white/20 rounded-2xl p-4 text-center min-w-[120px]">
            <div className="text-3xl sm:text-4xl font-black text-white flex items-center justify-center gap-1">
              <Sparkles className="w-7 h-7" />
              {streakStats.bestStreak}
            </div>
            <div className="text-[11px] text-amber-100 font-bold uppercase tracking-wider mt-1">
              Mejor Racha
            </div>
          </div>
        </div>
      </div>

      {/* Control Interactivo de los 4 Hábitos Diarios */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Hábito 1: Hidratación */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-cyan-100 dark:bg-cyan-950 text-cyan-600 rounded-2xl">
                <Droplets className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Hidratación Vital
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Meta calculada: {profile.dailyWaterGoalMl} ml ({targetGlasses} vasos de 250ml)
                </p>
              </div>
            </div>
            <span className="text-lg font-black text-cyan-600 dark:text-cyan-400">
              {currentGlasses} / {targetGlasses}
            </span>
          </div>

          {/* Visualizador de vasos */}
          <div className="grid grid-cols-6 sm:grid-cols-8 gap-2 py-2">
            {Array.from({ length: targetGlasses }).map((_, i) => {
              const isFilled = i < currentGlasses;
              return (
                <div
                  key={i}
                  onClick={() => updateTodayHabit({ waterGlasses: isFilled ? i : i + 1 })}
                  className={`cursor-pointer h-12 rounded-xl border flex items-center justify-center transition-all ${
                    isFilled
                      ? 'bg-cyan-500 text-white border-cyan-500 shadow-sm shadow-cyan-500/30 scale-105'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700 hover:border-cyan-400'
                  }`}
                  title={`Vaso ${i + 1} de 250ml`}
                >
                  <Droplets className={`w-4 h-4 ${isFilled ? 'fill-current' : ''}`} />
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={() => updateTodayHabit({ waterGlasses: Math.max(0, currentGlasses - 1) })}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 text-xs font-bold flex items-center gap-1"
            >
              <Minus className="w-4 h-4" /> Restar
            </button>
            <span className="text-xs font-bold text-slate-500">
              {currentGlasses * 250} ml tomados hoy
            </span>
            <button
              onClick={() => updateTodayHabit({ waterGlasses: currentGlasses + 1 })}
              className="p-2 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold flex items-center gap-1 shadow-sm"
            >
              <Plus className="w-4 h-4" /> +1 Vaso
            </button>
          </div>
        </div>

        {/* Hábito 2: Porciones de Vegetales & Fibra */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-emerald-100 dark:bg-emerald-950 text-emerald-600 rounded-2xl">
                <Leaf className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Vegetales & Fibra
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Mínimo recomendado: 3 porciones al día
                </p>
              </div>
            </div>
            <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">
              {currentVeggies} porciones
            </span>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed bg-emerald-50/50 dark:bg-emerald-950/20 p-3 rounded-xl border border-emerald-200/40">
            Los vegetales aportan volumen al estómago, alimentan tu microbiota y reducen el pico de glucosa de tus comidas.
          </p>

          <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={() => updateTodayHabit({ vegetablesPortions: Math.max(0, currentVeggies - 1) })}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 text-xs font-bold flex items-center gap-1"
            >
              <Minus className="w-4 h-4" /> Restar
            </button>
            <span className="text-xs font-bold text-slate-500">
              {currentVeggies >= 3 ? '¡Excelente volumen de fibra!' : 'Añade una ensalada o sopa'}
            </span>
            <button
              onClick={() => updateTodayHabit({ vegetablesPortions: currentVeggies + 1 })}
              className="p-2 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1 shadow-sm"
            >
              <Plus className="w-4 h-4" /> +1 Porción
            </button>
          </div>
        </div>

        {/* Hábito 3: Ejercicio / Actividad Física */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-orange-100 dark:bg-orange-950 text-orange-600 rounded-2xl">
                <Dumbbell className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Movimiento o Rutina
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Caminata, movilidad o rutina casera
                </p>
              </div>
            </div>
            <span className={`text-xs font-bold px-3 py-1 rounded-full ${
              todayStreak?.exerciseCompleted
                ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
            }`}>
              {todayStreak?.exerciseCompleted ? 'Completado' : 'Pendiente'}
            </span>
          </div>

          <button
            onClick={() => updateTodayHabit({ exerciseCompleted: !todayStreak?.exerciseCompleted })}
            className={`w-full py-3 rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all ${
              todayStreak?.exerciseCompleted
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                : 'bg-slate-100 dark:bg-slate-800 hover:bg-orange-500 hover:text-white text-slate-700 dark:text-slate-300'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            {todayStreak?.exerciseCompleted ? '¡Actividad Registrada Hoy!' : 'Marcar Ejercicio de Hoy Realizado'}
          </button>
        </div>

        {/* Hábito 4: Cumplimiento Calórico / Consciencia */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-100 dark:bg-purple-950 text-purple-600 rounded-2xl">
                <Flame className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Alimentación Consciente
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Dentro del objetivo de ~{profile.targetDailyCalories} kcal
                </p>
              </div>
            </div>
            <span className={`text-xs font-bold px-3 py-1 rounded-full ${
              todayStreak?.calorieGoalMet
                ? 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
            }`}>
              {todayStreak?.calorieGoalMet ? 'En Déficit' : 'Pendiente'}
            </span>
          </div>

          <button
            onClick={() => updateTodayHabit({ calorieGoalMet: !todayStreak?.calorieGoalMet })}
            className={`w-full py-3 rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all ${
              todayStreak?.calorieGoalMet
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                : 'bg-slate-100 dark:bg-slate-800 hover:bg-purple-600 hover:text-white text-slate-700 dark:text-slate-300'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            {todayStreak?.calorieGoalMet ? '¡Alimentación de Hoy en Meta!' : 'Marcar Objetivo Calórico Cumplido'}
          </button>
        </div>
      </div>

      {/* Notas Diarias & Reflexión para Otto */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 text-sm font-bold">
            <Edit3 className="w-4 h-4 text-emerald-600" />
            <span>Reflexión o Notas del Día</span>
          </div>
          <div className="flex items-center gap-3">
            {saveSuccessMsg && (
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 animate-in fade-in flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
                <CheckCircle2 className="w-3.5 h-3.5" />
                ¡Guardada para Otto!
              </span>
            )}
            <button
              onClick={handleSaveNotes}
              disabled={isSavingNotes}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md shadow-emerald-600/20 active:scale-95 disabled:opacity-50"
            >
              {isSavingNotes ? 'Guardando...' : 'Guardar Nota'}
            </button>
          </div>
        </div>
        <textarea
          rows={3}
          placeholder="¿Cómo te sentiste hoy? (Ej. Mucha energía en la mañana, un poco de hambre a las 4pm pero tomé infusión de Jamaica... Otto leerá estas notas para adaptar sus consejos)"
          value={notesInput}
          onChange={(e) => setNotesInput(e.target.value)}
          className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 p-3.5 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-900 transition-all leading-relaxed"
        />
        <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
          <span>Otto aprende de tus emociones, digestión y reflexiones para ofrecerte consejos y sugerencias a tu medida.</span>
        </p>
      </div>

      {/* Recordatorios Inteligentes de Hidratación con Otto */}
      <div className="bg-gradient-to-br from-cyan-50/70 via-white to-blue-50/50 dark:from-slate-900 dark:via-slate-900 dark:to-cyan-950/20 rounded-3xl p-6 border border-cyan-200/80 dark:border-cyan-800/60 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="p-3 bg-cyan-600 text-white rounded-2xl shadow-md shadow-cyan-600/20 shrink-0">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Recordatorios Inteligentes de Agua con Otto
                </h3>
                <span className="text-[10px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-full bg-cyan-100 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-300">
                  Acciones Rápidas
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                Avisos con botones de <strong>"¡Ya tomé!" (+1 vaso)</strong> y <strong>"En 5 minutos"</strong> para no perder tu racha.
              </p>
            </div>
          </div>

          {/* Switch de activación */}
          <label className="relative inline-flex items-center cursor-pointer select-none">
            <input
              type="checkbox"
              checked={notifSettings.enabled}
              onChange={(e) => handleToggleNotifications(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:width-5 after:w-5 after:transition-all peer-checked:bg-cyan-600"></div>
            <span className="ml-2.5 text-xs font-bold text-slate-700 dark:text-slate-300">
              {notifSettings.enabled ? 'Activos' : 'Pausados'}
            </span>
          </label>
        </div>

        {notifSettings.enabled && (
          <div className="pt-2 border-t border-cyan-100 dark:border-cyan-900/40 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-semibold">
                <Clock className="w-4 h-4 text-cyan-600" />
                <span>Intervalo entre avisos:</span>
              </div>
              <div className="flex items-center gap-1.5">
                {[45, 60, 90, 120].map((mins) => (
                  <button
                    key={mins}
                    onClick={() => handleIntervalChange(mins)}
                    className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                      notifSettings.intervalMinutes === mins
                        ? 'bg-cyan-600 text-white shadow-sm scale-105'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-cyan-400'
                    }`}
                  >
                    {mins} min
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              {/* Botón de permiso nativo si no está granted */}
              {permStatus !== 'granted' ? (
                <button
                  onClick={handleRequestPermission}
                  className="text-xs font-bold text-cyan-700 dark:text-cyan-300 hover:underline flex items-center gap-1"
                >
                  <Bell className="w-3.5 h-3.5" />
                  Activar también notificaciones del navegador
                </button>
              ) : (
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Notificaciones nativas habilitadas
                </span>
              )}

              {/* Botón para probar aviso ahora */}
              <button
                onClick={handleTestNotification}
                className="px-3.5 py-1.5 rounded-xl bg-cyan-100 dark:bg-cyan-950/60 hover:bg-cyan-200 dark:hover:bg-cyan-900 text-cyan-800 dark:text-cyan-200 text-xs font-bold transition-colors flex items-center gap-1.5"
              >
                <Droplets className="w-3.5 h-3.5 text-cyan-600" />
                Probar aviso de Otto ahora
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Historial Reciente de Hábitos */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 text-sm font-bold">
          <Calendar className="w-4 h-4 text-emerald-600" />
          Historial de los Últimos 14 Días
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
                <th className="py-2.5 px-3">Fecha</th>
                <th className="py-2.5 px-3">Agua</th>
                <th className="py-2.5 px-3">Vegetales</th>
                <th className="py-2.5 px-3">Ejercicio</th>
                <th className="py-2.5 px-3">Calorías</th>
                <th className="py-2.5 px-3">Notas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-600 dark:text-slate-300">
              {pastStreaks.map((item) => (
                <tr key={item.date} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="py-2.5 px-3 font-semibold text-slate-800 dark:text-slate-200">
                    {item.date === getTodayDateString() ? 'Hoy' : item.date}
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="font-bold text-cyan-600">{item.waterGlasses}</span> vasos
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="font-bold text-emerald-600">{item.vegetablesPortions}</span> porc.
                  </td>
                  <td className="py-2.5 px-3">
                    {item.exerciseCompleted ? (
                      <span className="text-emerald-600 font-bold">✓ Sí</span>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </td>
                  <td className="py-2.5 px-3">
                    {item.calorieGoalMet ? (
                      <span className="text-purple-600 font-bold">✓ Sí</span>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 truncate max-w-[150px] text-slate-400">
                    {item.notes || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
