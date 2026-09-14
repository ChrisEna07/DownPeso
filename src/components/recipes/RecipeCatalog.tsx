import React, { useState, useEffect } from 'react';
import { Recipe, RecipeCategory } from '@/types';
import {
  UtensilsCrossed,
  Search,
  Sparkles,
  Clock,
  Flame,
  BadgeDollarSign,
  Plus,
  Check,
  Refrigerator,
  ChefHat,
  Loader2,
  X,
  Sunrise,
  Sun,
  Moon,
  BookOpen
} from 'lucide-react';
import { db } from '@/lib/db';
import { generateSmartFridgeRecipe } from '@/lib/gemini';
import { showFeedback } from '@/lib/feedback';
import confetti from 'canvas-confetti';

const COMMON_PANTRY_ITEMS = [
  'Huevos', 'Atún en lata', 'Jitomate / Tomate', 'Cebolla',
  'Calabacita / Zucchini', 'Espinacas', 'Avena', 'Lentejas',
  'Zanahoria', 'Pechuga de pollo', 'Nopales', 'Queso panela',
  'Limón', 'Pepino', 'Chayote'
];

interface MealTimeRecommendation {
  category: RecipeCategory;
  label: string;
  period: string;
  badge: string;
  icon: React.ReactNode;
  description: string;
  basics: string[];
}

function getTimeOfDayMeal(): MealTimeRecommendation {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) {
    return {
      category: 'desayuno',
      label: 'Desayuno Energético',
      period: 'Mañana (5:00 - 12:00)',
      badge: 'Desayuno Recomendado',
      icon: <Sunrise className="w-5 h-5 text-amber-500" />,
      description: 'Opciones ricas en proteína y fibra que estabilizan la glucosa y despiertan tu metabolismo con saciedad prolongada.',
      basics: ['Huevos', 'Avena integral', 'Espinacas', 'Manzana / Fruta', 'Café / Té sin azúcar']
    };
  } else if (hour >= 12 && hour < 18) {
    return {
      category: 'almuerzo',
      label: 'Almuerzo Saciante & Económico',
      period: 'Mediodía (12:00 - 18:00)',
      badge: 'Almuerzo Recomendado',
      icon: <Sun className="w-5 h-5 text-orange-500" />,
      description: 'Platos completos con vegetales, legumbres y proteína magra para mantenerte saciado sin pesadez vespertina.',
      basics: ['Pechuga de pollo', 'Lentejas / Frijoles', 'Verduras salteadas', 'Ensalada fresca', 'Atún']
    };
  } else {
    return {
      category: 'cena',
      label: 'Cena Ligera & Digestiva',
      period: 'Tarde / Noche (18:00 - 5:00)',
      badge: 'Cena Ligera Recomendada',
      icon: <Moon className="w-5 h-5 text-indigo-400" />,
      description: 'Cenas bajas en carbohidratos simples para favorecer un descanso reparador y quema lipídica nocturna.',
      basics: ['Atún en agua', 'Nopales con queso panela', 'Calabacitas salteadas', 'Consomé de verduras']
    };
  }
}

export const RecipeCatalog: React.FC = () => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [activeCategory, setActiveCategory] = useState<RecipeCategory | 'todas'>('todas');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);

  // Modal "¿Qué hay en mi refri?"
  const [showFridgeModal, setShowFridgeModal] = useState(false);
  const [fridgeIngredients, setFridgeIngredients] = useState<string[]>([]);
  const [customIngredientInput, setCustomIngredientInput] = useState('');
  const [targetCategory, setTargetCategory] = useState<RecipeCategory>('almuerzo');
  const [isGeneratingRecipe, setIsGeneratingRecipe] = useState(false);
  const [fridgeError, setFridgeError] = useState<string | null>(null);

  // Modal "Agregar Receta Casera Manual"
  const [showAddModal, setShowAddModal] = useState(false);
  const [manualTitle, setManualTitle] = useState('');
  const [manualCategory, setManualCategory] = useState<RecipeCategory>('almuerzo');
  const [manualDescription, setManualDescription] = useState('');
  const [manualCalories, setManualCalories] = useState('320');
  const [manualTime, setManualTime] = useState('20');
  const [manualIngredients, setManualIngredients] = useState('');
  const [manualInstructions, setManualInstructions] = useState('');

  const timeOfDayMeal = getTimeOfDayMeal();

  const loadRecipes = async () => {
    const list = await db.recipes.toArray();
    setRecipes(list);
  };

  useEffect(() => {
    loadRecipes();
  }, []);

  const filteredRecipes = recipes.filter(r => {
    const matchesCategory = activeCategory === 'todas' || r.category === activeCategory;
    const matchesSearch = searchTerm === '' ||
      r.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.ingredients.some(i => i.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  // Sugerencia destacada según el horario actual
  const timeSuggestedRecipe = recipes.find(r => r.category === timeOfDayMeal.category) || recipes[0];

  const handleToggleFridgeIngredient = (item: string) => {
    if (fridgeIngredients.includes(item)) {
      setFridgeIngredients(fridgeIngredients.filter(i => i !== item));
    } else {
      setFridgeIngredients([...fridgeIngredients, item]);
    }
  };

  const handleAddCustomIngredient = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = customIngredientInput.trim();
    if (clean && !fridgeIngredients.includes(clean)) {
      setFridgeIngredients([...fridgeIngredients, clean]);
      setCustomIngredientInput('');
    }
  };

  const handleOpenFridgeModal = (forcedCategory?: RecipeCategory) => {
    const cat = forcedCategory || (activeCategory !== 'todas' ? (activeCategory as RecipeCategory) : timeOfDayMeal.category);
    setTargetCategory(cat);
    setShowFridgeModal(true);
  };

  const handleOpenAddModal = () => {
    const cat = activeCategory !== 'todas' ? (activeCategory as RecipeCategory) : timeOfDayMeal.category;
    setManualCategory(cat);
    setManualTitle('');
    setManualDescription('');
    setManualIngredients('');
    setManualInstructions('');
    setShowAddModal(true);
  };

  const handleGenerateFromFridge = async () => {
    if (fridgeIngredients.length === 0) return;
    setIsGeneratingRecipe(true);
    setFridgeError(null);

    try {
      const generated = await generateSmartFridgeRecipe(fridgeIngredients);
      // Asignar explícitamente la categoría deseada y marcar como creada por el usuario
      const customRecipe: Recipe = {
        ...generated,
        category: targetCategory,
        isCustom: true
      };

      const id = await db.recipes.add(customRecipe);
      const savedRecipe = { ...customRecipe, id };

      try {
        confetti({ particleCount: 70, spread: 60, origin: { y: 0.7 } });
      } catch (_) {}

      await loadRecipes();
      setSelectedRecipe(savedRecipe);
      setShowFridgeModal(false);
      setFridgeIngredients([]);

      // Feedback explícito sobre la categoría
      showFeedback({
        type: 'success',
        title: '¡Receta Creada con tu Refri!',
        message: `"${savedRecipe.title}" fue asignada y guardada en la categoría de ${targetCategory.toUpperCase()}.`
      });

      // Si el usuario no estaba en esa categoría, cambiar para que la vea de inmediato
      if (activeCategory !== 'todas' && activeCategory !== targetCategory) {
        setActiveCategory(targetCategory);
      }
    } catch (err: any) {
      console.error('Error generando receta:', err);
      setFridgeError(err.message || 'No se pudo generar la receta con esos ingredientes.');
    } finally {
      setIsGeneratingRecipe(false);
    }
  };

  const handleSaveManualRecipe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualTitle.trim()) return;

    const ingredientsList = manualIngredients
      .split('\n')
      .map(i => i.trim())
      .filter(i => i.length > 0);

    const instructionsList = manualInstructions
      .split('\n')
      .map(i => i.trim())
      .filter(i => i.length > 0);

    const newRecipe: Recipe = {
      title: manualTitle.trim(),
      category: manualCategory,
      description: manualDescription.trim() || 'Receta casera añadida personalmente.',
      prepTimeMinutes: parseInt(manualTime) || 20,
      estimatedCalories: parseInt(manualCalories) || 320,
      budgetFriendly: true,
      isCustom: true,
      ingredients: ingredientsList.length > 0 ? ingredientsList : ['Ingredientes caseros al gusto'],
      instructions: instructionsList.length > 0 ? instructionsList : ['Preparar y cocinar al gusto con sal moderada.'],
      tags: ['Casera', manualCategory, 'Saludable']
    };

    const id = await db.recipes.add(newRecipe);
    await loadRecipes();
    setShowAddModal(false);

    showFeedback({
      type: 'success',
      title: '¡Receta Guardada!',
      message: `"${newRecipe.title}" se agregó a la sección de ${manualCategory.toUpperCase()}.`
    });

    if (activeCategory !== 'todas' && activeCategory !== manualCategory) {
      setActiveCategory(manualCategory);
    }
    setSelectedRecipe({ ...newRecipe, id });

    try {
      confetti({ particleCount: 60, spread: 60 });
    } catch (_) {}
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200 pb-20 md:pb-8">
      {/* Cabecera & Botones de Acción */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
            <UtensilsCrossed className="w-5 h-5" />
            <span className="text-xs font-bold uppercase tracking-wider">Nutrición Casera Económica</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            Recetario Tradicional & Saciante
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Comidas altas en fibra y proteína con ingredientes cotidianos que no golpean tu bolsillo
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleOpenAddModal}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 font-bold text-xs sm:text-sm border border-slate-200 dark:border-slate-700 transition-all hover:scale-105 active:scale-95"
          >
            <Plus className="w-4 h-4 text-emerald-600" />
            Nueva Receta
          </button>

          <button
            onClick={() => handleOpenFridgeModal()}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-600/20 transition-all hover:scale-105 active:scale-95"
          >
            <Refrigerator className="w-4 h-4" />
            ¿Qué hay en mi refri?
          </button>
        </div>
      </div>

      {/* Widget de Sugerencia Inteligente según Horario del Día */}
      <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-emerald-50 via-teal-50/50 to-white dark:from-emerald-950/40 dark:via-teal-950/20 dark:to-slate-900 border border-emerald-200/80 dark:border-emerald-800/50 shadow-sm relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-600/10 dark:bg-emerald-400/15 text-emerald-800 dark:text-emerald-300 text-xs font-black uppercase tracking-wider border border-emerald-300/40 dark:border-emerald-700/40">
                {timeOfDayMeal.icon}
                {timeOfDayMeal.badge} • {timeOfDayMeal.period}
              </span>
            </div>

            <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
              Sugerencia de {timeOfDayMeal.label} para esta hora
            </h3>

            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              {timeOfDayMeal.description}
            </p>

            {/* Ingredientes básicos clave para esta hora */}
            <div className="pt-1 flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mr-1">
                Básicos recomendados:
              </span>
              {timeOfDayMeal.basics.map((b, i) => (
                <span
                  key={i}
                  className="text-[11px] font-semibold bg-white dark:bg-slate-800 text-emerald-800 dark:text-emerald-300 px-2.5 py-0.5 rounded-lg border border-emerald-200/60 dark:border-emerald-800/50 shadow-xs"
                >
                  {b}
                </span>
              ))}
            </div>
          </div>

          {/* Tarjeta de Receta Recomendada para el horario */}
          {timeSuggestedRecipe && (
            <div className="bg-white dark:bg-slate-900/90 rounded-2xl p-4 border border-emerald-200 dark:border-emerald-800 shadow-sm sm:w-80 shrink-0 flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center justify-between text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-300 mb-1">
                  <span>Recomendada de hoy</span>
                  <span className="flex items-center gap-1 font-extrabold text-amber-600 dark:text-amber-400">
                    <Flame className="w-3 h-3" /> ~{timeSuggestedRecipe.estimatedCalories} kcal
                  </span>
                </div>
                <h4 className="text-sm font-black text-slate-900 dark:text-white line-clamp-1">
                  {timeSuggestedRecipe.title}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-1">
                  {timeSuggestedRecipe.description}
                </p>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={() => setSelectedRecipe(timeSuggestedRecipe)}
                  className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs text-center transition-colors flex items-center justify-center gap-1"
                >
                  <BookOpen className="w-3.5 h-3.5" /> Ver Receta
                </button>
                <button
                  onClick={() => handleOpenFridgeModal(timeOfDayMeal.category)}
                  className="py-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 font-bold text-xs transition-colors"
                  title="Crear variante con IA para esta comida"
                >
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Barra de Búsqueda y Filtros de Categoría */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por ingrediente (huevo, avena, atún) o nombre..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 shadow-sm"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          {[
            { id: 'todas', label: 'Todas las recetas' },
            { id: 'desayuno', label: 'Desayunos' },
            { id: 'almuerzo', label: 'Almuerzos' },
            { id: 'cena', label: 'Cenas Ligeras' },
            { id: 'snack', label: 'Snacks & Bebidas' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id as any)}
              className={`px-4 py-2 rounded-xl font-bold whitespace-nowrap transition-all ${
                activeCategory === cat.id
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:border-emerald-400'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid de Recetas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredRecipes.map((recipe) => (
          <div
            key={recipe.id}
            onClick={() => setSelectedRecipe(recipe)}
            className="group cursor-pointer bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:border-emerald-400 dark:hover:border-emerald-600 transition-all hover:shadow-md flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] uppercase font-extrabold tracking-wider bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 px-2.5 py-1 rounded-full">
                  {recipe.category}
                </span>
                {recipe.budgetFriendly && (
                  <span className="text-[10px] font-bold text-teal-700 dark:text-teal-300 flex items-center gap-1 bg-teal-50 dark:bg-teal-950/60 px-2 py-0.5 rounded-md border border-teal-200/40">
                    <BadgeDollarSign className="w-3 h-3" /> Económica
                  </span>
                )}
                {recipe.isCustom && (
                  <span className="text-[10px] font-bold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/60 px-2 py-0.5 rounded-md">
                    Tu refri ✨
                  </span>
                )}
              </div>

              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 transition-colors">
                  {recipe.title}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                  {recipe.description}
                </p>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-1">
                {recipe.tags?.slice(0, 3).map((tag, idx) => (
                  <span
                    key={idx}
                    className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded-md"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1 font-semibold">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                {recipe.prepTimeMinutes} min
              </span>
              <span className="flex items-center gap-1 font-bold text-emerald-600 dark:text-emerald-400">
                <Flame className="w-3.5 h-3.5 text-amber-500" />
                ~{recipe.estimatedCalories} kcal
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Detalle de Receta */}
      {selectedRecipe && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full max-h-[90vh] overflow-hidden border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col">
            <div className="p-5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase tracking-wider font-extrabold bg-white/20 px-2 py-0.5 rounded-full">
                  {selectedRecipe.category}
                </span>
                <h3 className="text-lg font-black mt-1">{selectedRecipe.title}</h3>
              </div>
              <button
                onClick={() => setSelectedRecipe(null)}
                className="p-1.5 text-white/80 hover:text-white rounded-full hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5 text-xs sm:text-sm">
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed italic bg-emerald-50/50 dark:bg-emerald-950/20 p-3 rounded-xl border border-emerald-200/40">
                "{selectedRecipe.description}"
              </p>

              <div className="flex items-center justify-around p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 text-xs">
                <div className="text-center">
                  <span className="text-slate-400 block">Tiempo</span>
                  <strong className="text-slate-800 dark:text-slate-200 text-sm">
                    {selectedRecipe.prepTimeMinutes} min
                  </strong>
                </div>
                <div className="h-6 w-px bg-slate-200 dark:bg-slate-700" />
                <div className="text-center">
                  <span className="text-slate-400 block">Calorías Aprox.</span>
                  <strong className="text-emerald-600 dark:text-emerald-400 text-sm">
                    ~{selectedRecipe.estimatedCalories} kcal
                  </strong>
                </div>
              </div>

              {/* Ingredientes */}
              <div>
                <h4 className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-[11px] mb-2 flex items-center gap-1.5">
                  <UtensilsCrossed className="w-4 h-4 text-emerald-600" />
                  Ingredientes Requeridos:
                </h4>
                <ul className="space-y-1.5 pl-1">
                  {selectedRecipe.ingredients.map((ing, i) => (
                    <li key={i} className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      {ing}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Paso a paso */}
              <div>
                <h4 className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-[11px] mb-2 flex items-center gap-1.5">
                  <ChefHat className="w-4 h-4 text-emerald-600" />
                  Instrucciones de Preparación:
                </h4>
                <ol className="space-y-2 pl-1">
                  {selectedRecipe.instructions.map((step, i) => (
                    <li key={i} className="flex gap-2.5 text-slate-600 dark:text-slate-300">
                      <span className="font-bold text-emerald-600 shrink-0">{i + 1}.</span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setSelectedRecipe(null)}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
              >
                Cerrar Receta
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal "¿Qué hay en mi refri?" con IA y Selección Explícita de Categoría */}
      {showFridgeModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-600 rounded-2xl">
                  <Refrigerator className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    ¿Qué hay en mi refri hoy?
                  </h3>
                  <p className="text-xs text-slate-500">
                    Crea una receta casera económica con los ingredientes que ya tienes
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowFridgeModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {/* Selector de Categoría Destino */}
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 space-y-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 block">
                ¿Para qué momento deseas preparar esta receta?
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-xs font-bold">
                {[
                  { id: 'desayuno', label: '🍳 Desayuno' },
                  { id: 'almuerzo', label: '🍲 Almuerzo' },
                  { id: 'cena', label: '🌙 Cena Ligera' },
                  { id: 'snack', label: '🍏 Snack' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setTargetCategory(item.id as RecipeCategory)}
                    className={`py-2 px-2.5 rounded-xl transition-all text-center text-xs ${
                      targetCategory === item.id
                        ? 'bg-emerald-600 text-white shadow-sm scale-102'
                        : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-emerald-400'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Selector de ingredientes comunes */}
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                Selecciona lo que tengas a la mano:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {COMMON_PANTRY_ITEMS.map((item) => {
                  const isSelected = fridgeIngredients.includes(item);
                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => handleToggleFridgeIngredient(item)}
                      className={`text-xs px-3 py-1.5 rounded-full font-semibold transition-all flex items-center gap-1 ${
                        isSelected
                          ? 'bg-emerald-600 text-white shadow-sm scale-105'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                      }`}
                    >
                      {isSelected ? <Check className="w-3 h-3" /> : <Plus className="w-3 h-3 text-slate-400" />}
                      {item}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Input para agregar ingrediente libre */}
            <form onSubmit={handleAddCustomIngredient} className="flex gap-2">
              <input
                type="text"
                placeholder="Otro ingrediente (ej. pimiento, brócoli, frijoles)..."
                value={customIngredientInput}
                onChange={(e) => setCustomIngredientInput(e.target.value)}
                className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
              />
              <button
                type="submit"
                className="px-3 py-2 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold hover:bg-slate-300"
              >
                Añadir
              </button>
            </form>

            {/* Ingredientes seleccionados */}
            {fridgeIngredients.length > 0 && (
              <div className="p-3 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-xl border border-emerald-200/50">
                <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 block mb-1.5">
                  Ingredientes seleccionados ({fridgeIngredients.length}):
                </span>
                <div className="flex flex-wrap gap-1">
                  {fridgeIngredients.map((item) => (
                    <span
                      key={item}
                      className="text-xs bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center gap-1 font-medium"
                    >
                      {item}
                      <button
                        type="button"
                        onClick={() => handleToggleFridgeIngredient(item)}
                        className="text-slate-400 hover:text-rose-500 font-bold ml-1"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {fridgeError && (
              <p className="text-xs text-rose-500 font-medium">{fridgeError}</p>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowFridgeModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleGenerateFromFridge}
                disabled={fridgeIngredients.length === 0 || isGeneratingRecipe}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/20 disabled:opacity-40"
              >
                {isGeneratingRecipe ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creando receta de {targetCategory}...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Crear en {targetCategory.toUpperCase()}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para "Añadir Receta Casera Manual" */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-600 rounded-2xl">
                  <ChefHat className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Añadir Receta Casera
                  </h3>
                  <p className="text-xs text-slate-500">
                    Guarda tus platillos caseros favoritos organizados por categoría
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveManualRecipe} className="space-y-4">
              {/* Título de la receta */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nombre del platillo
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Omelette de espinacas con panela"
                  value={manualTitle}
                  onChange={(e) => setManualTitle(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Categoría */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  ¿En qué categoría deseas agregar esta receta?
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-xs font-bold">
                  {[
                    { id: 'desayuno', label: '🍳 Desayuno' },
                    { id: 'almuerzo', label: '🍲 Almuerzo' },
                    { id: 'cena', label: '🌙 Cena Ligera' },
                    { id: 'snack', label: '🍏 Snack' },
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setManualCategory(cat.id as RecipeCategory)}
                      className={`py-2 px-2 rounded-xl transition-all text-center text-xs ${
                        manualCategory === cat.id
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tiempo y Calorías aproximadas */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Tiempo de prep. (min)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="180"
                    value={manualTime}
                    onChange={(e) => setManualTime(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Calorías aprox. (kcal)
                  </label>
                  <input
                    type="number"
                    min="50"
                    max="2000"
                    value={manualCalories}
                    onChange={(e) => setManualCalories(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Descripción breve */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Descripción breve
                </label>
                <input
                  type="text"
                  placeholder="Ej. Desayuno alto en proteína y fibra que se prepara en 10 minutos."
                  value={manualDescription}
                  onChange={(e) => setManualDescription(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Ingredientes (uno por línea) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Ingredientes (uno por línea)
                </label>
                <textarea
                  rows={3}
                  placeholder={"2 huevos enteros\n1 taza de espinacas frescas\n50g de queso panela"}
                  value={manualIngredients}
                  onChange={(e) => setManualIngredients(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Instrucciones paso a paso */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Instrucciones de preparación (un paso por línea)
                </label>
                <textarea
                  rows={3}
                  placeholder={"Batir los huevos en un plato hondo.\nSaltear las espinacas en sartén con unas gotas de aceite.\nVerter los huevos y añadir el queso panela al doblar."}
                  value={manualInstructions}
                  onChange={(e) => setManualInstructions(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/20"
                >
                  Guardar en {manualCategory.toUpperCase()}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
