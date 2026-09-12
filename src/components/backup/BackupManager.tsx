import React, { useState } from 'react';
import {
  Download,
  Upload,
  Database,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  FileJson,
  Loader2
} from 'lucide-react';
import { exportDatabaseBackup, importDatabaseBackup, resetDatabaseToFactory } from '@/lib/backup';
import confetti from 'canvas-confetti';

interface BackupManagerProps {
  onDataRestored: () => void;
}

export const BackupManager: React.FC<BackupManagerProps> = ({ onDataRestored }) => {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importStatus, setImportStatus] = useState<{ success: boolean; message: string; counts?: any } | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [lastExportedName, setLastExportedName] = useState<string | null>(null);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const filename = await exportDatabaseBackup();
      setLastExportedName(filename);
      try {
        confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
      } catch (_) {}
    } catch (err) {
      console.error('Error exportando:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setImportStatus(null);

    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      if (content) {
        const result = await importDatabaseBackup(content);
        setImportStatus(result);
        if (result.success) {
          try {
            confetti({ particleCount: 80, spread: 70 });
          } catch (_) {}
          onDataRestored();
        }
      }
      setIsImporting(false);
    };
    reader.onerror = () => {
      setImportStatus({
        success: false,
        message: 'Error al leer el archivo desde tu disco local.'
      });
      setIsImporting(false);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleReset = async () => {
    await resetDatabaseToFactory();
    setShowResetConfirm(false);
    onDataRestored();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-200 pb-20 md:pb-8">
      {/* Cabecera Principal */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
            <Database className="w-5 h-5" />
            <span className="text-xs font-bold uppercase tracking-wider">IndexedDB Local & Privado</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            Centro de Respaldo & Restauración
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Tus datos, historial y memoria del asistente te pertenecen 100% a ti. Exporta o transfiere tu progreso a cualquier equipo sin servidores.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 px-3.5 py-2 rounded-2xl text-xs font-bold shrink-0">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          Cero Costos de Infraestructura
        </div>
      </div>

      {/* Tarjetas de Exportación e Importación */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Exportar Respaldo */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-5">
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center">
              <Download className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                Exportar Respaldo Completo
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mt-1">
                Genera un archivo único <strong>JSON</strong> que contiene tu perfil, pesajes, memoria del consejero, comidas registradas, recetas caseras y rachas de hábitos.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-xs text-slate-600 dark:text-slate-300 space-y-1">
              <div className="font-bold text-slate-800 dark:text-slate-200">
                Formato del archivo:
              </div>
              <div className="font-mono text-[11px] text-emerald-700 dark:text-emerald-400">
                DownPeso_Backup_AAAA-MM-DD_HHMM.json
              </div>
            </div>

            {lastExportedName && (
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 p-2.5 rounded-xl border border-emerald-200/60">
                <CheckCircle2 className="w-4 h-4" />
                Descargado: {lastExportedName}
              </div>
            )}
          </div>

          <button
            onClick={handleExport}
            disabled={isExporting}
            className="w-full py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
          >
            {isExporting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generando archivo de respaldo...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                Descargar Respaldo JSON
              </>
            )}
          </button>
        </div>

        {/* Importar Respaldo */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-5">
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-teal-100 dark:bg-teal-950 text-teal-600 flex items-center justify-center">
              <Upload className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                Restaurar desde Respaldo
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mt-1">
                Selecciona un archivo JSON generado previamente para transferir tus datos a este dispositivo o restaurar tu progreso.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-xs text-slate-600 dark:text-slate-300">
              <span className="font-bold block text-slate-800 dark:text-slate-200 mb-1">
                Validación de Seguridad:
              </span>
              El archivo se valida automáticamente con esquema <strong>Zod</strong> antes de ser insertado en tu base de datos local.
            </div>

            {importStatus && (
              <div
                className={`p-3 rounded-2xl text-xs font-semibold flex items-start gap-2 ${
                  importStatus.success
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200'
                    : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border border-rose-200'
                }`}
              >
                {importStatus.success ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                )}
                <div>
                  <p>{importStatus.message}</p>
                  {importStatus.counts && (
                    <div className="text-[11px] mt-1 space-x-2 text-slate-600 dark:text-slate-400">
                      <span>Perfil: {importStatus.counts.perfil}</span>
                      <span>• Racha: {importStatus.counts.rachas}</span>
                      <span>• Comidas: {importStatus.counts.comidasRegistradas}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <label className="w-full py-3.5 px-4 rounded-2xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-teal-600/20 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer text-center">
            {isImporting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Validando y restaurando...
              </>
            ) : (
              <>
                <FileJson className="w-4 h-4" />
                Cargar Archivo JSON
              </>
            )}
            <input
              type="file"
              accept=".json,application/json"
              onChange={handleFileChange}
              disabled={isImporting}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Zona de Peligro / Restablecimiento */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-rose-200/80 dark:border-rose-900/40 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h3 className="text-base font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
            <RotateCcw className="w-4 h-4" />
            Restablecer Base de Datos Local
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Borra todos los datos de IndexedDB en este navegador y reinicia la aplicación como si fuera la primera apertura.
          </p>
        </div>

        <button
          onClick={() => setShowResetConfirm(true)}
          className="px-4 py-2 rounded-xl border border-rose-300 dark:border-rose-800 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950 font-bold text-xs shrink-0 transition-colors"
        >
          Restablecer Todo
        </button>
      </div>

      {/* Modal de Confirmación de Restablecimiento */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-sm w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h4 className="text-base font-black text-slate-900 dark:text-white">
                ¿Estás completamente seguro?
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Esta acción eliminará tu perfil antropométrico, historial conversacional y registros de hábitos de este navegador. Asegúrate de haber descargado un respaldo si deseas conservarlos.
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md shadow-rose-600/20"
              >
                Sí, Restablecer Todo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
