import { ActivityLevel } from '@/types';

export interface BMICategory {
  label: string;
  color: string;
  textColor: string;
  bgLight: string;
  description: string;
}

/**
 * Calcula el Índice de Masa Corporal (IMC)
 */
export function calculateBMI(weightKg: number, heightCm: number): number {
  if (weightKg <= 0 || heightCm <= 0) return 0;
  const heightM = heightCm / 100;
  const bmi = weightKg / (heightM * heightM);
  return Math.round(bmi * 10) / 10;
}

/**
 * Obtiene la categoría del IMC según estándares de la OMS
 */
export function getBMICategory(bmi: number): BMICategory {
  if (bmi <= 0) {
    return {
      label: 'Sin calcular',
      color: 'bg-slate-400',
      textColor: 'text-slate-600 dark:text-slate-400',
      bgLight: 'bg-slate-100 dark:bg-slate-800',
      description: 'Ingresa tus datos para calcular tu IMC'
    };
  }
  if (bmi < 18.5) {
    return {
      label: 'Bajo peso',
      color: 'bg-amber-500',
      textColor: 'text-amber-600 dark:text-amber-400',
      bgLight: 'bg-amber-50 dark:bg-amber-950/30',
      description: 'Por debajo del rango recomendado. Conviene una alimentación nutritiva para ganar masa magra.'
    };
  }
  if (bmi < 25.0) {
    return {
      label: 'Peso Normal / Saludable',
      color: 'bg-emerald-500',
      textColor: 'text-emerald-600 dark:text-emerald-400',
      bgLight: 'bg-emerald-50 dark:bg-emerald-950/30',
      description: 'Excelente. Tu peso se encuentra dentro del rango metabólico más saludable.'
    };
  }
  if (bmi < 30.0) {
    return {
      label: 'Sobrepeso',
      color: 'bg-orange-500',
      textColor: 'text-orange-600 dark:text-orange-400',
      bgLight: 'bg-orange-50 dark:bg-orange-950/30',
      description: 'Ligero exceso de masa corporal. Un déficit moderado y hábitos constantes te llevarán a tu peso ideal.'
    };
  }
  if (bmi < 35.0) {
    return {
      label: 'Obesidad Grado I',
      color: 'bg-rose-500',
      textColor: 'text-rose-600 dark:text-rose-400',
      bgLight: 'bg-rose-50 dark:bg-rose-950/30',
      description: 'Foco prioritario en hábitos: actividad de bajo impacto y comidas caseras con alto volumen de vegetales.'
    };
  }
  return {
    label: 'Obesidad Grado II/III',
    color: 'bg-red-600',
    textColor: 'text-red-600 dark:text-red-400',
    bgLight: 'bg-red-50 dark:bg-red-950/30',
    description: 'Prioriza caminatas suaves sin impacto articular, hidratación y reducción gradual de ultraprocesados.'
  };
}

/**
 * Tasa Metabólica Basal (TMB) calculada mediante la fórmula de Mifflin-St Jeor
 */
export function calculateBMR(weightKg: number, heightCm: number, age: number): number {
  if (weightKg <= 0 || heightCm <= 0 || age <= 0) return 0;
  // Fórmula promedio segura (10 * peso + 6.25 * estatura - 5 * edad)
  const bmr = (10 * weightKg) + (6.25 * heightCm) - (5 * age) + 5;
  return Math.round(bmr);
}

/**
 * Gasto Energético Total Diario (TDEE) según nivel de actividad
 */
export function calculateTDEE(bmr: number, activityLevel: ActivityLevel): number {
  const multipliers: Record<ActivityLevel, number> = {
    sedentario: 1.2,
    ligero: 1.375,
    moderado: 1.55,
    intenso: 1.725
  };
  const multiplier = multipliers[activityLevel] || 1.2;
  return Math.round(bmr * multiplier);
}

/**
 * Calorías objetivo diarias con déficit moderado para reducción de peso sostenible
 */
export function calculateTargetCalories(tdee: number, bmr: number): number {
  if (tdee <= 0) return 0;
  // Déficit seguro de 400 kcal sin bajar nunca del metabolismo basal de seguridad
  const deficit = 400;
  const target = Math.max(tdee - deficit, Math.max(bmr * 0.95, 1350));
  return Math.round(target);
}

/**
 * Meta de hidratación diaria en mililitros (~35 ml por kg de peso corporal)
 */
export function calculateDailyWaterMl(weightKg: number): number {
  if (weightKg <= 0) return 2000;
  const ml = weightKg * 35;
  // Redondear a múltiplos de 250ml (1 vaso promedio)
  return Math.round(ml / 250) * 250;
}

/**
 * Convierte mililitros a número de vasos de 250ml
 */
export function mlToGlasses(ml: number): number {
  return Math.max(1, Math.round(ml / 250));
}
