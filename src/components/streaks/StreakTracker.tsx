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
  Edit3
} from 'lucide-react';
import { db, getTodayDateString, calculateActiveStreakDays } from '@/lib/db';
import { mlToGlasses } from '@/lib/calculations';
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
    if (!todayStreak?.id) return;
    const nextState = { ...todayStreak, ...updates };

    // Comprobar si cumple todos los hábitos clave
    const allDone = (
      nextState.waterGlasses >= targetGlasses &&
      nextState.vegetablesPortions >= 2 &&
      nextState.exerciseCompleted &&
      nextState.calorieGoalMet
    );

    await db.dailyStreaks.update(todayStreak.id, {
      ...updates,
      allCompleted: allDone
    });

    if (allDone && !todayStreak.allCompleted) {
      try {
        confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
      } catch (_) {}
    }

    onRefreshData();
    await loadStreakData();
  };

  const handleSaveNotes = async () => {
    if (!todayStreak?.id) return;
    setIsSavingNotes(true);
    await db.dailyStreaks.update(todayStreak.id, { notes: notesInput });
    setIsSavingNotes(false);
    onRefreshData();
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

      {/* Notas Diarias & Reflexión */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 text-sm font-bold">
            <Edit3 className="w-4 h-4 text-emerald-600" />
            Reflexión o Notas del Día
          </div>
          <button
            onClick={handleSaveNotes}
            disabled={isSavingNotes}
            className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors"
          >
            {isSavingNotes ? 'Guardando...' : 'Guardar Nota'}
          </button>
        </div>
        <textarea
          rows={2}
          placeholder="¿Cómo te sentiste hoy? (Ej. Mucha energía en la mañana, un poco de hambre a las 4pm pero tomé infusión de Jamaica...)"
          value={notesInput}
          onChange={(e) => setNotesInput(e.target.value)}
          className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 p-3 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
        />
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
