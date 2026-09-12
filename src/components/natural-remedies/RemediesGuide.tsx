import React, { useState } from 'react';
import { DEFAULT_REMEDIES } from '@/lib/defaultData';
import { RemedyCategory } from '@/types';
import {
  Leaf,
  ShieldAlert,
  AlertTriangle,
  Sparkles,
  CheckCircle2,
  Coffee,
  HeartPulse
} from 'lucide-react';

export const RemediesGuide: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<RemedyCategory | 'todas'>('todas');

  const filteredRemedies = DEFAULT_REMEDIES.filter(
    r => selectedCategory === 'todas' || r.category === selectedCategory
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-200 pb-20 md:pb-8">
      {/* Cabecera Informativa */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-teal-600 dark:text-teal-400">
            <Leaf className="w-5 h-5" />
            <span className="text-xs font-bold uppercase tracking-wider">Fitoterapia & Apoyo Digestivo</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            Botiquín Natural & Infusiones
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Bebidas tradicionales sin calorías para calmar la ansiedad por azúcar, aliviar gases y desinflamar
          </p>
        </div>

        <div className="flex items-center gap-2 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 px-3.5 py-2 rounded-2xl text-xs font-bold shrink-0">
          <HeartPulse className="w-4 h-4 text-amber-600 shrink-0" />
          Uso Responsable & Cero Azúcar
        </div>
      </div>

      {/* Aviso Médico Responsable Destacado */}
      <div className="p-4 sm:p-5 rounded-3xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3.5 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
        <div className="p-2 bg-amber-500 text-slate-950 rounded-xl shrink-0 mt-0.5 shadow-sm">
          <ShieldAlert className="w-4 h-4" />
        </div>
        <div className="space-y-1">
          <h4 className="font-black text-slate-900 dark:text-white">
            Aviso de Salud & Responsabilidad Médica:
          </h4>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Las infusiones son un complemento natural a una alimentación balanceada y buena hidratación; <strong>no reemplazan tratamientos médicos ni fármacos prescritos</strong>. Si estás embarazada, en lactancia, padeces hipertensión o tomas medicamentos crónicos (anticoagulantes, diuréticos), revisa las advertencias específicas y consulta a tu médico.
          </p>
        </div>
      </div>

      {/* Filtros de Categoría */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        {[
          { id: 'todas', label: 'Todas las infusiones' },
          { id: 'digestiva', label: '🍃 Digestivas & Antigases' },
          { id: 'saciante', label: '🍵 Saciantes & Control de Ansiedad' },
          { id: 'desinflamatoria', label: '✨ Desinflamatorias & Diuréticas' },
        ].map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id as any)}
            className={`px-4 py-2 rounded-xl font-bold whitespace-nowrap transition-all ${
              selectedCategory === cat.id
                ? 'bg-teal-600 text-white shadow-sm'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:border-teal-400'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Grid de Remedios e Infusiones */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredRemedies.map((remedy) => (
          <div
            key={remedy.id}
            className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:border-teal-400 transition-all flex flex-col justify-between space-y-4"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-extrabold tracking-wider bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300 px-3 py-1 rounded-full">
                  {remedy.category}
                </span>
                <Coffee className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              </div>

              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {remedy.name}
                </h3>
              </div>

              {/* Ingredientes */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-1">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                  Ingredientes:
                </span>
                <ul className="text-xs text-slate-700 dark:text-slate-300 space-y-0.5">
                  {remedy.ingredients.map((ing, i) => (
                    <li key={i} className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-teal-500 shrink-0" />
                      {ing}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Modo de Preparación */}
              <div>
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
                  Preparación Óptima:
                </span>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {remedy.preparation}
                </p>
              </div>

              {/* Beneficios */}
              <div>
                <span className="text-[11px] font-bold text-teal-700 dark:text-teal-400 uppercase tracking-wider block mb-1 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" /> Beneficios Clave:
                </span>
                <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-1">
                  {remedy.benefits.map((b, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-teal-500 shrink-0 mt-0.5" />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Advertencias de Uso Responsable */}
              <div className="p-3 rounded-2xl bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200/60 dark:border-rose-900/40 space-y-1">
                <span className="text-[10px] font-extrabold text-rose-700 dark:text-rose-400 uppercase tracking-wider flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> Precauciones y Contraindicaciones:
                </span>
                <ul className="text-[11px] text-rose-800 dark:text-rose-300 space-y-0.5 pl-3 list-disc">
                  {remedy.cautions.map((c, i) => (
                    <li key={i}>{c}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
