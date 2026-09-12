import React, { useState } from 'react';
import { DEFAULT_WORKOUTS } from '@/lib/defaultData';
import { WorkoutRoutine } from '@/types';
import {
  Dumbbell,
  ShieldCheck,
  Clock,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  Activity
} from 'lucide-react';
import { db, getTodayDateString } from '@/lib/db';
import confetti from 'canvas-confetti';

interface ExerciseGuideProps {
  onExerciseCompleted?: () => void;
}

export const ExerciseGuide: React.FC<ExerciseGuideProps> = ({ onExerciseCompleted }) => {
  const [selectedWorkout, setSelectedWorkout] = useState<WorkoutRoutine>(DEFAULT_WORKOUTS[0]);
  const [timerSeconds, setTimerSeconds] = useState(30);
  const [initialSeconds, setInitialSeconds] = useState(30);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [activeInterval, setActiveInterval] = useState<any>(null);
  const [completedToday, setCompletedToday] = useState(false);

  // Control del temporizador interactivo
  const startTimer = (seconds?: number) => {
    if (seconds) {
      setInitialSeconds(seconds);
      setTimerSeconds(seconds);
    }
    if (activeInterval) clearInterval(activeInterval);

    setIsTimerRunning(true);
    const interval = setInterval(() => {
      setTimerSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setIsTimerRunning(false);
          try {
            // Vibración en dispositivos móviles si está soportada
            if ('vibrate' in navigator) navigator.vibrate([200, 100, 200]);
          } catch (_) {}
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    setActiveInterval(interval);
  };

  const pauseTimer = () => {
    if (activeInterval) clearInterval(activeInterval);
    setIsTimerRunning(false);
  };

  const resetTimer = () => {
    if (activeInterval) clearInterval(activeInterval);
    setIsTimerRunning(false);
    setTimerSeconds(initialSeconds);
  };

  const handleMarkCompleted = async () => {
    const today = getTodayDateString();
    const existing = await db.dailyStreaks.where('date').equals(today).first();
    if (existing && existing.id) {
      await db.dailyStreaks.update(existing.id, {
        exerciseCompleted: true,
        exerciseMinutes: selectedWorkout.durationMinutes
      });
    } else {
      await db.dailyStreaks.add({
        date: today,
        waterGlasses: 0,
        vegetablesPortions: 0,
        calorieGoalMet: false,
        exerciseCompleted: true,
        exerciseMinutes: selectedWorkout.durationMinutes,
        notes: `Rutina completada: ${selectedWorkout.title}`,
        allCompleted: false
      });
    }

    setCompletedToday(true);
    try {
      confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
    } catch (_) {}
    onExerciseCompleted?.();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200 pb-20 md:pb-8">
      {/* Cabecera Informativa */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400">
            <Dumbbell className="w-5 h-5" />
            <span className="text-xs font-bold uppercase tracking-wider">Sin Equipamiento & En Casa</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            Rutinas Progresivas de Bajo Impacto
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Protege tus articulaciones y acelera el consumo de energía basal sin poner un pie en el gimnasio
          </p>
        </div>

        <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 px-3.5 py-2 rounded-2xl text-xs font-bold shrink-0">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          Seguro para Rodillas y Espalda
        </div>
      </div>

      {/* Selector de Niveles de Rutina */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {DEFAULT_WORKOUTS.map((routine) => {
          const isSelected = selectedWorkout.id === routine.id;
          return (
            <button
              key={routine.id}
              onClick={() => setSelectedWorkout(routine)}
              className={`text-left p-5 rounded-3xl border transition-all flex flex-col justify-between ${
                isSelected
                  ? 'bg-gradient-to-br from-orange-500 to-amber-600 text-white border-transparent shadow-lg shadow-orange-500/20 scale-[1.02]'
                  : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 border-slate-200 dark:border-slate-800 hover:border-orange-400'
              }`}
            >
              <div>
                <div className={`text-[10px] font-extrabold uppercase tracking-wider mb-1 ${
                  isSelected ? 'text-orange-100' : 'text-orange-600 dark:text-orange-400'
                }`}>
                  {routine.level}
                </div>
                <h3 className="font-bold text-sm leading-tight mb-2">
                  {routine.title}
                </h3>
              </div>

              <div className={`flex items-center justify-between text-xs pt-3 border-t ${
                isSelected ? 'border-white/20 text-white/90' : 'border-slate-100 dark:border-slate-800 text-slate-500'
              }`}>
                <span className="flex items-center gap-1 font-semibold">
                  <Clock className="w-3.5 h-3.5" />
                  {routine.durationMinutes} min
                </span>
                <span className="font-bold text-[11px] uppercase">
                  Bajo Impacto
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Detalle de Rutina Activa y Temporizador de Series */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lista de Ejercicios */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-orange-600 dark:text-orange-400 uppercase tracking-wider">
                Plan de la sesión
              </span>
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                {selectedWorkout.title}
              </h3>
            </div>
            <span className="px-3 py-1 rounded-full bg-orange-50 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300 font-bold text-xs border border-orange-200/40">
              {selectedWorkout.exercises.length} Ejercicios
            </span>
          </div>

          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-200/60 dark:border-slate-700/60">
            {selectedWorkout.description}
          </p>

          <div className="space-y-3 pt-2">
            {selectedWorkout.exercises.map((ex, index) => (
              <div
                key={index}
                className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 hover:border-orange-300 transition-all space-y-1.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-orange-100 dark:bg-orange-950 text-orange-600 dark:text-orange-400 text-xs font-black flex items-center justify-center">
                      {index + 1}
                    </span>
                    <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                      {ex.name}
                    </h4>
                  </div>
                  <span className="text-xs font-extrabold text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/60 px-2.5 py-0.5 rounded-lg shrink-0">
                    {ex.repsOrDuration}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 pl-8 leading-relaxed">
                  💡 <strong>Tip técnico:</strong> {ex.tip}
                </p>
              </div>
            ))}
          </div>

          {/* Botón de marcar completado */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
            <button
              onClick={handleMarkCompleted}
              className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-xs sm:text-sm shadow-md transition-all ${
                completedToday
                  ? 'bg-emerald-600 text-white'
                  : 'bg-orange-600 hover:bg-orange-500 text-white shadow-orange-600/20 hover:scale-105 active:scale-95'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              {completedToday ? '¡Rutina Registrada en tu Racha de Hoy!' : 'Marcar Rutina como Hecha Hoy'}
            </button>
          </div>
        </div>

        {/* Temporizador Interactivo */}
        <div className="bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-white rounded-3xl p-6 border border-slate-800 shadow-xl flex flex-col justify-between space-y-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-orange-400 text-xs font-bold uppercase tracking-wider">
              <Activity className="w-4 h-4" />
              Cronómetro de Intervalos
            </div>
            <h4 className="text-base font-black">Control de Series & Descansos</h4>
            <p className="text-xs text-slate-400">Úsalo para medir tus tiempos de esfuerzo o pausas</p>
          </div>

          {/* Reloj Display */}
          <div className="flex flex-col items-center justify-center my-auto py-6">
            <div className="w-44 h-44 rounded-full border-4 border-orange-500/30 flex flex-col items-center justify-center relative shadow-2xl">
              <span className="text-5xl font-black tracking-tighter text-orange-400">
                {String(Math.floor(timerSeconds / 60)).padStart(2, '0')}:
                {String(timerSeconds % 60).padStart(2, '0')}
              </span>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                {isTimerRunning ? 'En marcha' : timerSeconds === 0 ? '¡Tiempo cumplido!' : 'En pausa'}
              </span>
            </div>
          </div>

          {/* Atajos de tiempo */}
          <div className="grid grid-cols-4 gap-1.5">
            {[20, 30, 45, 60].map((sec) => (
              <button
                key={sec}
                onClick={() => startTimer(sec)}
                className="py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 transition-colors"
              >
                {sec}s
              </button>
            ))}
          </div>

          {/* Controles Play/Pause/Reset */}
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={resetTimer}
              className="p-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              title="Reiniciar"
            >
              <RotateCcw className="w-5 h-5" />
            </button>

            {isTimerRunning ? (
              <button
                onClick={pauseTimer}
                className="flex-1 py-3 px-4 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm flex items-center justify-center gap-2 transition-transform active:scale-95"
              >
                <Pause className="w-4 h-4 fill-current" /> Pausar
              </button>
            ) : (
              <button
                onClick={() => startTimer()}
                className="flex-1 py-3 px-4 rounded-2xl bg-orange-500 hover:bg-orange-400 text-white font-black text-sm flex items-center justify-center gap-2 transition-transform active:scale-95 shadow-lg shadow-orange-500/25"
              >
                <Play className="w-4 h-4 fill-current" /> Iniciar
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
