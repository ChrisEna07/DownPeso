import Dexie, { Table } from 'dexie';
import {
  UserProfile,
  ChatMessage,
  AIMemorySummary,
  DailyStreak,
  FoodLog,
  Recipe,
  WeightRecord
} from '@/types';
import { DEFAULT_RECIPES } from './defaultData';

export class DownPesoDatabase extends Dexie {
  userProfile!: Table<UserProfile, number>;
  chatHistory!: Table<ChatMessage, number>;
  aiMemorySummary!: Table<AIMemorySummary, number>;
  dailyStreaks!: Table<DailyStreak, number>;
  foodLogs!: Table<FoodLog, number>;
  recipes!: Table<Recipe, number>;
  weightRecords!: Table<WeightRecord, number>;

  constructor() {
    super('DownPesoDB');
    this.version(1).stores({
      userProfile: '++id, name, createdAt',
      chatHistory: '++id, role, timestamp, summarized',
      aiMemorySummary: '++id, lastUpdated',
      dailyStreaks: '++id, date, allCompleted',
      foodLogs: '++id, date, mealType, time',
      recipes: '++id, title, category, budgetFriendly, isCustom',
      weightRecords: '++id, date, weight'
    });
  }
}

export const db = new DownPesoDatabase();

/**
 * Inicializa la base de datos con las recetas iniciales si está vacía
 */
export async function seedInitialDataIfNeeded(): Promise<void> {
  const recipeCount = await db.recipes.count();
  if (recipeCount === 0) {
    await db.recipes.bulkAdd(DEFAULT_RECIPES);
  }
}

/**
 * Obtiene el formato de fecha local estándar YYYY-MM-DD
 */
export function getTodayDateString(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Obtiene o crea el registro de racha del día de hoy
 */
export async function getOrCreateTodayStreak(): Promise<DailyStreak> {
  const today = getTodayDateString();
  const existing = await db.dailyStreaks.where('date').equals(today).first();
  if (existing) {
    return existing;
  }
  const newStreak: DailyStreak = {
    date: today,
    waterGlasses: 0,
    vegetablesPortions: 0,
    calorieGoalMet: false,
    exerciseCompleted: false,
    notes: '',
    allCompleted: false
  };
  const id = await db.dailyStreaks.add(newStreak);
  return { ...newStreak, id };
}

/**
 * Calcula el número de días consecutivos de racha activa
 */
export async function calculateActiveStreakDays(): Promise<{ currentStreak: number; bestStreak: number }> {
  const allStreaks = await db.dailyStreaks.orderBy('date').reverse().toArray();
  if (!allStreaks.length) return { currentStreak: 0, bestStreak: 0 };

  const today = getTodayDateString();
  let currentStreak = 0;
  let bestStreak = 0;
  let tempStreak = 0;

  // Un día se considera "activo" si cumplió al menos 2 hábitos clave (ej. agua + vegetales o ejercicio)
  const isDayActive = (s: DailyStreak) => (s.waterGlasses >= 4 || s.exerciseCompleted || s.allCompleted);

  // Comprobar días consecutivos hacia atrás
  const todayStreak = allStreaks.find(s => s.date === today);
  const startOffset = (todayStreak && isDayActive(todayStreak)) ? 0 : 1;

  let checkDate = new Date();
  if (startOffset === 1) {
    checkDate.setDate(checkDate.getDate() - 1);
  }

  // Iterar días para racha actual
  for (let i = 0; i < 60; i++) {
    const year = checkDate.getFullYear();
    const month = String(checkDate.getMonth() + 1).padStart(2, '0');
    const day = String(checkDate.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;

    const match = allStreaks.find(s => s.date === dateStr);
    if (match && isDayActive(match)) {
      currentStreak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  // Calcular mejor racha histórica
  const sortedChronological = [...allStreaks].sort((a, b) => a.date.localeCompare(b.date));
  for (const item of sortedChronological) {
    if (isDayActive(item)) {
      tempStreak++;
      if (tempStreak > bestStreak) bestStreak = tempStreak;
    } else {
      tempStreak = 0;
    }
  }

  return {
    currentStreak,
    bestStreak: Math.max(bestStreak, currentStreak)
  };
}
