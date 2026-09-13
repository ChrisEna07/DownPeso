import React, { useState } from 'react';
import { UserProfile, DailyStreak, FoodLog } from '@/types';
import {
  Flame,
  Scale,
  Droplets,
  HeartPulse,
  Sparkles,
  UtensilsCrossed,
  Dumbbell,
  Leaf,
  Plus,
  ArrowRight,
  TrendingDown,
  Calendar
} from 'lucide-react';
import { getBMICategory, mlToGlasses } from '@/lib/calculations';
import { db, getTodayDateString } from '@/lib/db';
import confetti from 'canvas-confetti';

interface DashboardProps {
  profile: UserProfile;
  todayStreak: DailyStreak | null;
  todayFoodLogs: FoodLog[];
  activeStreak: number;
  onNavigateTab: (tab: any) => void;
  onOpenProfile: () => void;
  onRefreshData: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  profile,
  todayStreak,
  todayFoodLogs,
  activeStreak,
  onNavigateTab,
  onOpenProfile,
  onRefreshData
}) => {
  const [showWeightModal, setShowWeightModal] = useState(false);
  const [newWeightInput, setNewWeightInput] = useState(String(profile.currentWeight));

  const bmiCat = getBMICategory(profile.bmi);
  const targetGlasses = mlToGlasses(profile.dailyWaterGoalMl);
  const currentGlasses = todayStreak?.waterGlasses || 0;

  // Cálculo de progreso hacia el peso meta
  const totalToLose = Math.max(0, profile.currentWeight - profile.targetWeight);
  const initialWeightRef = profile.currentWeight + 2.5; // Estimación de partida
  const progressPercent = Math.min(100, Math.max(0, Math.round(((initialWeightRef - profile.currentWeight) / (initialWeightRef - profile.targetWeight)) * 100)));

  // Acciones rápidas de racha
  const handleAddWater = async () => {
    if (!todayStreak?.id) return;
    const updatedGlasses = currentGlasses + 1;
    await db.dailyStreaks.update(todayStreak.id, {
      waterGlasses: updatedGlasses,
      allCompleted: (
        updatedGlasses >= targetGlasses &&
        (todayStreak.vegetablesPortions >= 2) &&
        todayStreak.exerciseCompleted
      )
    });
    if (updatedGlasses === targetGlasses) {
      try {
        confetti({ particleCount: 50, spread: 50, origin: { y: 0.7 } });
      } catch (_) {}
    }
    onRefreshData();
  };

  const handleToggleExercise = async () => {
    if (!todayStreak?.id) return;
    const newState = !todayStreak.exerciseCompleted;
    await db.dailyStreaks.update(todayStreak.id, {
      exerciseCompleted: newState,
      allCompleted: (
        currentGlasses >= targetGlasses &&
        (todayStreak.vegetablesPortions >= 2) &&
        newState
      )
    });
    if (newState) {
      try {
        confetti({ particleCount: 60, spread: 60, origin: { y: 0.6 } });
      } catch (_) {}
    }
    onRefreshData();
  };

  const handleAddVeggie = async () => {
    if (!todayStreak?.id) return;
    const current = todayStreak.vegetablesPortions || 0;
    await db.dailyStreaks.update(todayStreak.id, {
      vegetablesPortions: current + 1
    });
    onRefreshData();
  };

  const handleUpdateWeight = async (e: React.FormEvent) => {
    e.preventDefault();
    const w = parseFloat(newWeightInput);
    if (isNaN(w) || w < 30 || w > 300) return;

    const today = getTodayDateString();
    await db.userProfile.update(profile.id!, {
      currentWeight: w,
      bmi: Math.round((w / ((profile.height / 100) ** 2)) * 10) / 10,
      updatedAt: new Date().toISOString()
    });

    await db.weightRecords.add({
      date: today,
      weight: w,
      note: 'Actualización rápida desde Dashboard'
    });

    try {
      confetti({ particleCount: 70, spread: 70 });
    } catch (_) {}

    setShowWeightModal(false);
    onRefreshData();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-20 md:pb-8">
      {/* Saludo Personalizado y Tarjeta Principal */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-800 p-6 sm:p-8 text-white shadow-xl shadow-emerald-700/15">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-48 h-48 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-emerald-100 text-xs font-bold uppercase tracking-wider border border-white/20">
              <Sparkles className="w-3.5 h-3.5 text-emerald-200" />
              Plan Activo & Saludable
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight">
              ¡Hola, {profile.name}!
            </h1>
            <p className="text-emerald-100 text-sm sm:text-base leading-relaxed">
              ¿Listo para avanzar hoy? Recuerda que cada vaso de agua, porción de verdura y paso que das suma a tu bienestar continuo.
            </p>
            <div className="pt-1">
              <button
                type="button"
                onClick={onOpenProfile}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-bold transition-all border border-white/25"
              >
                Ajustar métricas o meta
              </button>
            </div>
          </div>

          {/* Tarjeta de Racha Flotante */}
          <div className="bg-white/15 backdrop-blur-md border border-white/20 rounded-2xl p-4 flex items-center gap-4 shrink-0 shadow-inner">
            <div className="p-3 bg-amber-400 text-slate-900 rounded-2xl shadow-md">
              <Flame className="w-7 h-7 fill-current" />
            </div>
            <div>
              <div className="text-2xl font-black">{activeStreak} Días</div>
              <div className="text-xs text-emerald-100 font-semibold">Racha Activa Consecutiva</div>
            </div>
          </div>
        </div>
      </div>

      {/* Métricas Antropométricas Clave */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Peso y Meta */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm relative group hover:border-emerald-300 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Peso Actual
            </span>
            <button
              onClick={() => setShowWeightModal(true)}
              className="p-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 text-xs font-bold flex items-center gap-1 transition-colors"
              title="Registrar nuevo pesaje"
            >
              <Plus className="w-3 h-3" /> Pesar
            </button>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 dark:text-white">
              {profile.currentWeight}
            </span>
            <span className="text-xs font-bold text-slate-500">kg</span>
          </div>
          <div className="mt-2 text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between">
            <span>Objetivo: <strong className="text-slate-700 dark:text-slate-200">{profile.targetWeight} kg</strong></span>
            {totalToLose > 0 ? (
              <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-0.5">
                <TrendingDown className="w-3.5 h-3.5" /> Faltan {totalToLose.toFixed(1)} kg
              </span>
            ) : (
              <span className="text-emerald-600 font-bold">¡Meta alcanzada!</span>
            )}
          </div>
          {/* Barra de progreso visual */}
          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 mt-3 overflow-hidden">
            <div
              className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${Math.max(10, progressPercent)}%` }}
            />
          </div>
        </div>

        {/* IMC (Índice de Masa Corporal) */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm relative hover:border-emerald-300 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Índice Corporal (IMC)
            </span>
            <HeartPulse className="w-4 h-4 text-rose-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 dark:text-white">
              {profile.bmi}
            </span>
            <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold text-white ${bmiCat.color}`}>
              {bmiCat.label}
            </span>
          </div>
          <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">
            {bmiCat.description}
          </p>
        </div>

        {/* Meta Calórica Diaria */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm relative hover:border-emerald-300 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Calorías Recomendadas
            </span>
            <Flame className="w-4 h-4 text-amber-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-emerald-600 dark:text-emerald-400">
              ~{profile.targetDailyCalories}
            </span>
            <span className="text-xs font-bold text-slate-500">kcal/día</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
            <span>TMB: <strong>{profile.bmr} kcal</strong></span>
            <span>Gasto: <strong>{profile.tdee} kcal</strong></span>
          </div>
        </div>

        {/* Hidratación del Día */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm relative hover:border-emerald-300 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Agua de Hoy
            </span>
            <button
              onClick={handleAddWater}
              className="p-1 rounded-lg bg-cyan-50 dark:bg-cyan-950/40 text-cyan-600 dark:text-cyan-400 hover:bg-cyan-100 text-xs font-bold flex items-center gap-1 transition-colors"
              title="Sumar 1 vaso de 250ml"
            >
              <Plus className="w-3 h-3" /> +1 Vaso
            </button>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-cyan-600 dark:text-cyan-400">
              {currentGlasses}
            </span>
            <span className="text-xs font-bold text-slate-500">/ {targetGlasses} vasos</span>
          </div>
          <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            {currentGlasses * 250} ml consumidos de {profile.dailyWaterGoalMl} ml
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 mt-3 overflow-hidden">
            <div
              className="bg-cyan-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(100, (currentGlasses / targetGlasses) * 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Checklist Rápido del Día */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 rounded-xl">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Check-in de Hábitos de Hoy
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Puntúa los 4 pilares fundamentales para mantener tu metabolismo encendido
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigateTab('streaks')}
            className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 flex items-center gap-1"
          >
            Ver historial completo <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
          {/* Hábito 1: Agua */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-cyan-100 dark:bg-cyan-950 text-cyan-600 rounded-xl">
                <Droplets className="w-5 h-5" />
              </div>
              <div>
                <span className="text-sm font-bold block text-slate-800 dark:text-slate-200">
                  Agua ({currentGlasses}/{targetGlasses})
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {currentGlasses >= targetGlasses ? '¡Meta cumplida!' : 'Vasos de 250ml'}
                </span>
              </div>
            </div>
            <button
              onClick={handleAddWater}
              className="p-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-white font-bold transition-transform active:scale-95"
              aria-label="Agregar vaso de agua"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Hábito 2: Vegetales */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-600 rounded-xl">
                <Leaf className="w-5 h-5" />
              </div>
              <div>
                <span className="text-sm font-bold block text-slate-800 dark:text-slate-200">
                  Vegetales ({todayStreak?.vegetablesPortions || 0})
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Fibra y saciedad
                </span>
              </div>
            </div>
            <button
              onClick={handleAddVeggie}
              className="p-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-bold transition-transform active:scale-95"
              aria-label="Agregar porción de verduras"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Hábito 3: Ejercicio / Movimiento */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-orange-100 dark:bg-orange-950 text-orange-600 rounded-xl">
                <Dumbbell className="w-5 h-5" />
              </div>
              <div>
                <span className="text-sm font-bold block text-slate-800 dark:text-slate-200">
                  Movimiento
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {todayStreak?.exerciseCompleted ? '¡Completado hoy!' : 'Caminata o rutina'}
                </span>
              </div>
            </div>
            <button
              onClick={handleToggleExercise}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                todayStreak?.exerciseCompleted
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-orange-500 hover:text-white'
              }`}
            >
              {todayStreak?.exerciseCompleted ? 'Hecho ✓' : 'Marcar'}
            </button>
          </div>

          {/* Hábito 4: Otto Coach IA */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-purple-100 dark:bg-purple-950 text-purple-600 rounded-xl">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <span className="text-sm font-bold block text-slate-800 dark:text-slate-200">
                  Coach Otto IA
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {todayFoodLogs.length > 0 ? `${todayFoodLogs.length} comidas anotadas` : 'Habla o anota con Otto'}
                </span>
              </div>
            </div>
            <button
              onClick={() => onNavigateTab('chat')}
              className="p-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold transition-transform active:scale-95"
              aria-label="Abrir chat con Otto"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Módulos de Acceso Directo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card Recetario & Refri */}
        <div
          onClick={() => onNavigateTab('recipes')}
          className="cursor-pointer group p-6 rounded-3xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/20 border border-emerald-200/60 dark:border-emerald-800/40 hover:border-emerald-400 transition-all hover:shadow-md"
        >
          <div className="p-3 bg-emerald-600 text-white w-fit rounded-2xl shadow-md shadow-emerald-600/20 mb-4 group-hover:scale-110 transition-transform">
            <UtensilsCrossed className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1 flex items-center justify-between">
            Recetario Casero & Refri
            <ArrowRight className="w-4 h-4 text-emerald-600 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            Platos tradicionales nutritivos y económicos. Usa la IA para crear recetas con lo que tengas ahora mismo en tu refrigerador.
          </p>
        </div>

        {/* Card Ejercicios en Casa */}
        <div
          onClick={() => onNavigateTab('exercises')}
          className="cursor-pointer group p-6 rounded-3xl bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/20 border border-orange-200/60 dark:border-orange-800/40 hover:border-orange-400 transition-all hover:shadow-md"
        >
          <div className="p-3 bg-orange-600 text-white w-fit rounded-2xl shadow-md shadow-orange-600/20 mb-4 group-hover:scale-110 transition-transform">
            <Dumbbell className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1 flex items-center justify-between">
            Ejercicios Sin Equipo
            <ArrowRight className="w-4 h-4 text-orange-600 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            4 niveles progresivos con temporizador integrado. Rutinas de bajo impacto para proteger rodillas y elevar tu gasto metabólico.
          </p>
        </div>

        {/* Card Botiquín Natural */}
        <div
          onClick={() => onNavigateTab('remedies')}
          className="cursor-pointer group p-6 rounded-3xl bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-teal-950/30 dark:to-cyan-950/20 border border-teal-200/60 dark:border-teal-800/40 hover:border-teal-400 transition-all hover:shadow-md"
        >
          <div className="p-3 bg-teal-600 text-white w-fit rounded-2xl shadow-md shadow-teal-600/20 mb-4 group-hover:scale-110 transition-transform">
            <Leaf className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1 flex items-center justify-between">
            Botiquín Natural
            <ArrowRight className="w-4 h-4 text-teal-600 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            Infusiones digestivas, saciantes para frenar la ansiedad por dulce y desinflamatorias con advertencias médicas responsables.
          </p>
        </div>
      </div>

      {/* Modal Rápido de Pesaje */}
      {showWeightModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-sm w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-600 rounded-2xl">
                <Scale className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Registrar Nuevo Peso
                </h3>
                <p className="text-xs text-slate-500">Actualiza tu progreso de hoy</p>
              </div>
            </div>

            <form onSubmit={handleUpdateWeight} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                  Peso en kilogramos (kg)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="decimal"
                    value={newWeightInput}
                    onChange={(e) => {
                      const sanitized = e.target.value.replace(/[^0-9.]/g, '');
                      setNewWeightInput(sanitized);
                    }}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 py-2.5 px-3 text-lg font-black text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                    placeholder="Ej. 82.3"
                    autoFocus
                  />
                  <span className="absolute right-3.5 top-3 text-xs font-bold text-slate-400">
                    kg
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowWeightModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/20"
                >
                  Actualizar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
