import React, { useState, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Sparkles, Scale, HeartPulse, Activity, Key, CheckCircle2, ShieldCheck, Flame, Droplets } from 'lucide-react';
import confetti from 'canvas-confetti';
import { NumericInput } from './NumericInput';
import {
  calculateBMI,
  getBMICategory,
  calculateBMR,
  calculateTDEE,
  calculateTargetCalories,
  calculateDailyWaterMl,
  mlToGlasses
} from '@/lib/calculations';
import { db } from '@/lib/db';
import { obfuscateKey, deobfuscateKey } from '@/lib/crypto';
import { UserProfile, ActivityLevel } from '@/types';

const onboardingSchema = z.object({
  name: z.string().min(2, 'Por favor ingresa tu nombre (mínimo 2 letras)'),
  age: z.string().refine((val) => {
    const num = parseInt(val, 10);
    return !isNaN(num) && num >= 10 && num <= 120;
  }, 'La edad debe ser un número entero válido entre 10 y 120 años'),
  height: z.string().refine((val) => {
    const num = parseFloat(val);
    return !isNaN(num) && num >= 100 && num <= 250;
  }, 'La estatura debe estar entre 100 y 250 cm'),
  currentWeight: z.string().refine((val) => {
    const num = parseFloat(val);
    return !isNaN(num) && num >= 30 && num <= 300;
  }, 'El peso actual debe estar entre 30 y 300 kg'),
  targetWeight: z.string().refine((val) => {
    const num = parseFloat(val);
    return !isNaN(num) && num >= 30 && num <= 300;
  }, 'El peso objetivo debe estar entre 30 y 300 kg'),
  activityLevel: z.enum(['sedentario', 'ligero', 'moderado', 'intenso'] as const),
  dietPreferences: z.string().optional().default(''),
  geminiApiKey: z.string().min(10, 'Ingresa una Gemini API Key válida para activar el asistente de IA')
});

type FormData = z.infer<typeof onboardingSchema>;

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingProfile?: UserProfile | null;
  onProfileSaved?: () => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  onClose,
  existingProfile,
  onProfileSaved
}) => {
  const [showApiKey, setShowApiKey] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const defaultValues: FormData = useMemo(() => {
    if (existingProfile) {
      return {
        name: existingProfile.name,
        age: String(existingProfile.age),
        height: String(existingProfile.height),
        currentWeight: String(existingProfile.currentWeight),
        targetWeight: String(existingProfile.targetWeight),
        activityLevel: existingProfile.activityLevel,
        dietPreferences: existingProfile.dietPreferences || '',
        geminiApiKey: deobfuscateKey(existingProfile.geminiApiKey)
      };
    }
    return {
      name: '',
      age: '',
      height: '',
      currentWeight: '',
      targetWeight: '',
      activityLevel: 'sedentario',
      dietPreferences: '',
      geminiApiKey: ''
    };
  }, [existingProfile]);

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors }
  } = useForm<FormData>({
    resolver: zodResolver(onboardingSchema),
    defaultValues
  });

  const watchedHeight = watch('height');
  const watchedCurrentWeight = watch('currentWeight');
  const watchedTargetWeight = watch('targetWeight');
  const watchedAge = watch('age');
  const watchedActivity = watch('activityLevel');

  // Cálculos en vivo para visualización inmediata
  const liveStats = useMemo(() => {
    const h = parseFloat(watchedHeight) || 0;
    const cw = parseFloat(watchedCurrentWeight) || 0;
    const tw = parseFloat(watchedTargetWeight) || 0;
    const a = parseInt(watchedAge, 10) || 0;

    const currentBMI = calculateBMI(cw, h);
    const targetBMI = calculateBMI(tw, h);
    const bmiCat = getBMICategory(currentBMI);
    const bmr = calculateBMR(cw, h, a);
    const tdee = calculateTDEE(bmr, watchedActivity as ActivityLevel || 'sedentario');
    const targetCalories = calculateTargetCalories(tdee, bmr);
    const waterMl = calculateDailyWaterMl(cw);
    const waterGlasses = mlToGlasses(waterMl);

    return {
      currentBMI,
      targetBMI,
      bmiCat,
      bmr,
      tdee,
      targetCalories,
      waterMl,
      waterGlasses,
      diffKg: cw > 0 && tw > 0 ? Math.round((cw - tw) * 10) / 10 : 0
    };
  }, [watchedHeight, watchedCurrentWeight, watchedTargetWeight, watchedAge, watchedActivity]);

  if (!isOpen) return null;

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      const h = parseFloat(data.height);
      const cw = parseFloat(data.currentWeight);
      const tw = parseFloat(data.targetWeight);
      const age = parseInt(data.age, 10);

      const bmi = calculateBMI(cw, h);
      const bmr = calculateBMR(cw, h, age);
      const tdee = calculateTDEE(bmr, data.activityLevel);
      const targetDailyCalories = calculateTargetCalories(tdee, bmr);
      const dailyWaterGoalMl = calculateDailyWaterMl(cw);
      const obfuscatedKey = obfuscateKey(data.geminiApiKey.trim());

      const now = new Date().toISOString();

      if (existingProfile?.id) {
        await db.userProfile.update(existingProfile.id, {
          name: data.name.trim(),
          age,
          height: h,
          currentWeight: cw,
          targetWeight: tw,
          activityLevel: data.activityLevel,
          dietPreferences: data.dietPreferences?.trim() || '',
          geminiApiKey: obfuscatedKey,
          bmi,
          bmr,
          tdee,
          targetDailyCalories,
          dailyWaterGoalMl,
          updatedAt: now
        });
      } else {
        await db.userProfile.add({
          name: data.name.trim(),
          age,
          height: h,
          currentWeight: cw,
          targetWeight: tw,
          activityLevel: data.activityLevel,
          dietPreferences: data.dietPreferences?.trim() || '',
          geminiApiKey: obfuscatedKey,
          bmi,
          bmr,
          tdee,
          targetDailyCalories,
          dailyWaterGoalMl,
          createdAt: now,
          updatedAt: now
        });

        // Registrar peso inicial en historial
        await db.weightRecords.add({
          date: now.slice(0, 10),
          weight: cw,
          note: 'Registro inicial de perfil'
        });

        // Disparar confetti festivo en el onboarding inicial
        try {
          confetti({
            particleCount: 80,
            spread: 60,
            origin: { y: 0.6 }
          });
        } catch (_) {}
      }

      onProfileSaved?.();
      onClose();
    } catch (err) {
      console.error('Error al guardar el perfil:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-4 max-h-[92vh] flex flex-col">
        {/* Cabecera estilizada */}
        <div className="bg-gradient-to-r from-emerald-700 via-emerald-600 to-teal-700 p-6 text-white relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20">
                <Scale className="w-6 h-6 text-emerald-200" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-black tracking-tight">
                  {existingProfile ? 'Modificar Perfil Antropométrico' : '¡Bienvenido a DownPeso!'}
                </h2>
                <p className="text-emerald-100 text-xs sm:text-sm">
                  {existingProfile
                    ? 'Actualiza tus métricas para recalcular tus objetivos'
                    : 'Personaliza tu experiencia de reducción de peso y hábitos saludables'}
                </p>
              </div>
            </div>
            {existingProfile && (
              <button
                type="button"
                onClick={onClose}
                className="text-white/80 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors"
                aria-label="Cerrar modal"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Cuerpo del formulario con scroll suave */}
        <form onSubmit={handleSubmit(onSubmit)} className="overflow-y-auto p-5 sm:p-6 space-y-6 flex-1">
          {/* Sección 1: Datos Personales */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" /> 1. Datos Personales
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Controller
                name="name"
                control={control}
                render={({ field }) => (
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
                      ¿Cómo te llamas?
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. Christian"
                      value={field.value}
                      onChange={field.onChange}
                      className="block w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 py-2.5 px-3.5 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-base"
                    />
                    {errors.name && (
                      <p className="mt-1 text-xs text-rose-500 font-medium">{errors.name.message}</p>
                    )}
                  </div>
                )}
              />

              <Controller
                name="age"
                control={control}
                render={({ field }) => (
                  <NumericInput
                    label="Edad"
                    unit="años"
                    placeholder="Ej. 32"
                    allowDecimal={false}
                    value={field.value}
                    onChange={field.onChange}
                    error={errors.age?.message}
                  />
                )}
              />
            </div>
          </div>

          {/* Sección 2: Antropometría con bloqueo estricto */}
          <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800">
            <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
              <HeartPulse className="w-4 h-4" /> 2. Medidas Corporales & Objetivos
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Controller
                name="height"
                control={control}
                render={({ field }) => (
                  <NumericInput
                    label="Estatura"
                    unit="cm"
                    placeholder="Ej. 172"
                    allowDecimal={false}
                    value={field.value}
                    onChange={field.onChange}
                    error={errors.height?.message}
                    hint="100 - 250 cm"
                  />
                )}
              />

              <Controller
                name="currentWeight"
                control={control}
                render={({ field }) => (
                  <NumericInput
                    label="Peso Actual"
                    unit="kg"
                    placeholder="Ej. 84.5"
                    allowDecimal={true}
                    value={field.value}
                    onChange={field.onChange}
                    error={errors.currentWeight?.message}
                    hint="Números y 1 decimal"
                  />
                )}
              />

              <Controller
                name="targetWeight"
                control={control}
                render={({ field }) => (
                  <NumericInput
                    label="Peso Objetivo"
                    unit="kg"
                    placeholder="Ej. 72.0"
                    allowDecimal={true}
                    value={field.value}
                    onChange={field.onChange}
                    error={errors.targetWeight?.message}
                    hint="Meta saludable"
                  />
                )}
              />
            </div>

            {/* Vista previa en vivo de cálculos de IMC y Déficit */}
            {liveStats.currentBMI > 0 && (
              <div className="rounded-2xl p-4 bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-800/40 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                      IMC Actual:
                    </span>
                    <span className="text-lg font-black text-slate-900 dark:text-white">
                      {liveStats.currentBMI}
                    </span>
                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold text-white ${liveStats.bmiCat.color}`}>
                      {liveStats.bmiCat.label}
                    </span>
                  </div>

                  {liveStats.diffKg > 0 && (
                    <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/60 px-3 py-1 rounded-full">
                      Meta: Reducir {liveStats.diffKg} kg
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-emerald-200/40 dark:border-emerald-800/30 text-xs">
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block">Metabolismo Basal</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                      <Flame className="w-3.5 h-3.5 text-amber-500" /> {liveStats.bmr} kcal
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block">Gasto Total (TDEE)</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      ~{liveStats.tdee} kcal
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block">Calorías Diarias Meta</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      ~{liveStats.targetCalories} kcal
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block">Agua Recomendada</span>
                    <span className="font-bold text-cyan-600 dark:text-cyan-400 flex items-center gap-1">
                      <Droplets className="w-3.5 h-3.5" /> {liveStats.waterMl} ml ({liveStats.waterGlasses} vasos)
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sección 3: Nivel de Actividad y Hábitos */}
          <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800">
            <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
              <Activity className="w-4 h-4" /> 3. Nivel de Actividad & Preferencias
            </h3>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">
                Nivel de Actividad Física Habitual
              </label>
              <Controller
                name="activityLevel"
                control={control}
                render={({ field }) => (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { id: 'sedentario', label: 'Sedentario', sub: 'Poco o ningún ejercicio' },
                      { id: 'ligero', label: 'Ligero', sub: 'Caminatas 1-3 días/sem' },
                      { id: 'moderado', label: 'Moderado', sub: 'Actividad 3-5 días/sem' },
                      { id: 'intenso', label: 'Intenso', sub: 'Ejercicio diario o trabajo físico' }
                    ].map((item) => (
                      <button
                        type="button"
                        key={item.id}
                        onClick={() => field.onChange(item.id)}
                        className={`p-3 rounded-2xl border text-left transition-all ${
                          field.value === item.id
                            ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 ring-2 ring-emerald-500/20'
                            : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-900'
                        }`}
                      >
                        <div className="font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-100">
                          {item.label}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight mt-0.5">
                          {item.sub}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              />
            </div>

            <Controller
              name="dietPreferences"
              control={control}
              render={({ field }) => (
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
                    Preferencias dietéticas o alergias (Opcional)
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. Sin lácteos, no me gusta el picante, intolerancia al gluten, prefiero comidas fáciles..."
                    value={field.value}
                    onChange={field.onChange}
                    className="block w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 py-2.5 px-3.5 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-sm"
                  />
                </div>
              )}
            />
          </div>

          {/* Sección 4: Configuración de Gemini API Key */}
          <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                <Key className="w-4 h-4" /> 4. Motor de IA Inteligente (Google Gemini)
              </h3>
              <span className="text-[11px] bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> 100% Privado en Cliente
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                DownPeso se ejecuta directamente en tu navegador sin servidores intermedios. Tu API Key se almacena localmente de forma ofuscada en tu propio dispositivo para comunicarse con Google AI.
              </p>

              <Controller
                name="geminiApiKey"
                control={control}
                render={({ field }) => (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                      Gemini API Key
                    </label>
                    <div className="relative">
                      <input
                        type={showApiKey ? 'text' : 'password'}
                        placeholder="AIzaSy..."
                        value={field.value}
                        onChange={field.onChange}
                        className="block w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 py-2.5 px-3.5 pr-11 text-slate-900 dark:text-white font-mono text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                      />
                      <button
                        type="button"
                        onClick={() => setShowApiKey(!showApiKey)}
                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                      >
                        {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {errors.geminiApiKey && (
                      <p className="mt-1 text-xs text-rose-500 font-medium">{errors.geminiApiKey.message}</p>
                    )}
                  </div>
                )}
              />

              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                ¿No tienes tu clave gratuita? Puedes generarla en un clic en{' '}
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-600 dark:text-emerald-400 font-semibold underline hover:text-emerald-500"
                >
                  Google AI Studio
                </a>.
              </div>
            </div>
          </div>

          {/* Botón de acción */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
            {existingProfile && (
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold text-sm transition-colors"
              >
                Cancelar
              </button>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-7 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm shadow-lg shadow-emerald-600/25 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              {isSubmitting ? 'Guardando...' : existingProfile ? 'Guardar Cambios' : 'Comenzar Mi Plan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
