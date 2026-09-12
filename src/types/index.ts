export type ActivityLevel = 'sedentario' | 'ligero' | 'moderado' | 'intenso';

export interface UserProfile {
  id?: number;
  name: string;
  age: number;
  height: number; // en cm
  currentWeight: number; // en kg
  targetWeight: number; // en kg
  activityLevel: ActivityLevel;
  dietPreferences: string;
  geminiApiKey: string; // Ofuscada en almacenamiento
  bmi: number;
  bmr: number;
  tdee: number;
  targetDailyCalories: number;
  dailyWaterGoalMl: number;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  id?: number;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  summarized?: boolean;
}

export interface AIMemorySummary {
  id?: number;
  summaryText: string;
  learnedHabits: string[];
  restrictions: string[];
  weightMilestones: string[];
  lastUpdated: string;
}

export interface DailyStreak {
  id?: number;
  date: string; // YYYY-MM-DD
  waterGlasses: number; // vasos de 250ml
  vegetablesPortions: number;
  calorieGoalMet: boolean;
  exerciseCompleted: boolean;
  exerciseMinutes?: number;
  notes?: string;
  allCompleted: boolean;
}

export type MealType = 'desayuno' | 'almuerzo' | 'cena' | 'snack';
export type HealthyRating = 'excelente' | 'bueno' | 'moderado' | 'a_mejorar';

export interface FoodLog {
  id?: number;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  mealType: MealType;
  description: string;
  estimatedCalories: number;
  healthyRating: HealthyRating;
  aiFeedback?: string;
}

export type RecipeCategory = 'desayuno' | 'almuerzo' | 'cena' | 'snack' | 'bebida';

export interface Recipe {
  id?: number;
  title: string;
  category: RecipeCategory;
  description: string;
  ingredients: string[];
  instructions: string[];
  prepTimeMinutes: number;
  estimatedCalories: number;
  budgetFriendly: boolean;
  isCustom?: boolean;
  tags: string[];
}

export interface WorkoutExercise {
  name: string;
  repsOrDuration: string;
  tip: string;
}

export interface WorkoutRoutine {
  id: string;
  title: string;
  level: 'Nivel 1: Movilidad' | 'Nivel 2: Cardio Suave' | 'Nivel 3: Tonificación' | 'Nivel 4: Quema Grasa';
  durationMinutes: number;
  lowImpact: boolean;
  description: string;
  exercises: WorkoutExercise[];
}

export type RemedyCategory = 'digestiva' | 'saciante' | 'desinflamatoria' | 'calmante';

export interface NaturalRemedy {
  id: string;
  name: string;
  category: RemedyCategory;
  ingredients: string[];
  preparation: string;
  benefits: string[];
  cautions: string[];
}

export interface WeightRecord {
  id?: number;
  date: string;
  weight: number;
  note?: string;
}

export interface AppBackupData {
  version: string;
  exportDate: string;
  app: 'DownPeso By ChrizDev';
  data: {
    userProfile: UserProfile[];
    chatHistory: ChatMessage[];
    aiMemorySummary: AIMemorySummary[];
    dailyStreaks: DailyStreak[];
    foodLogs: FoodLog[];
    recipes: Recipe[];
    weightRecords?: WeightRecord[];
  };
}
