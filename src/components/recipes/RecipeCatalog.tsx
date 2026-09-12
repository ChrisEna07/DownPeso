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
  X
} from 'lucide-react';
import { db } from '@/lib/db';
import { generateSmartFridgeRecipe } from '@/lib/gemini';
import confetti from 'canvas-confetti';

const COMMON_PANTRY_ITEMS = [
  'Huevos', 'Atún en lata', 'Jitomate / Tomate', 'Cebolla',
  'Calabacita / Zucchini', 'Espinacas', 'Avena', 'Lentejas',
  'Zanahoria', 'Pechuga de pollo', 'Nopales', 'Queso panela',
  'Limón', 'Pepino', 'Chayote'
];

export const RecipeCatalog: React.FC = () => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [activeCategory, setActiveCategory] = useState<RecipeCategory | 'todas'>('todas');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);

  // Estado para el modal "¿Qué hay en mi refri?"
  const [showFridgeModal, setShowFridgeModal] = useState(false);
  const [fridgeIngredients, setFridgeIngredients] = useState<string[]>([]);
  const [customIngredientInput, setCustomIngredientInput] = useState('');
  const [isGeneratingRecipe, setIsGeneratingRecipe] = useState(false);
  const [fridgeError, setFridgeError] = useState<string | null>(null);

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

  const handleGenerateFromFridge = async () => {
    if (fridgeIngredients.length === 0) return;
    setIsGeneratingRecipe(true);
    setFridgeError(null);

    try {
      const generated = await generateSmartFridgeRecipe(fridgeIngredients);
      // Guardar directamente en Dexie
      const id = await db.recipes.add(generated);
      const savedRecipe = { ...generated, id };

      try {
        confetti({ particleCount: 70, spread: 60, origin: { y: 0.7 } });
      } catch (_) {}

      await loadRecipes();
      setSelectedRecipe(savedRecipe);
      setShowFridgeModal(false);
      setFridgeIngredients([]);
    } catch (err: any) {
      console.error('Error generando receta:', err);
      setFridgeError(err.message || 'No se pudo generar la receta con esos ingredientes.');
    } finally {
      setIsGeneratingRecipe(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200 pb-20 md:pb-8">
      {/* Cabecera & Botón del Refri */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
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

        <button
          onClick={() => setShowFridgeModal(true)}
          className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-600/20 transition-all hover:scale-105 active:scale-95 shrink-0"
        >
          <Refrigerator className="w-4 h-4" />
          ¿Qué hay en mi refri?
        </button>
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
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
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

      {/* Modal "¿Qué hay en mi refri?" con IA */}
      {showFridgeModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
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
                    El Chef IA está creando tu receta...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Crear Receta con esto
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
