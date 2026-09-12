import { z } from 'zod';
import { db, seedInitialDataIfNeeded } from './db';
import { AppBackupData } from '@/types';

// Esquema Zod para validar la integridad del archivo JSON de respaldo
const BackupSchema = z.object({
  version: z.string(),
  exportDate: z.string(),
  app: z.literal('DownPeso By ChrizDev'),
  data: z.object({
    userProfile: z.array(z.any()),
    chatHistory: z.array(z.any()),
    aiMemorySummary: z.array(z.any()),
    dailyStreaks: z.array(z.any()),
    foodLogs: z.array(z.any()),
    recipes: z.array(z.any()),
    weightRecords: z.array(z.any()).optional()
  })
});

/**
 * Exporta toda la base de datos a un archivo JSON estructurado y dispara su descarga directa en el navegador
 */
export async function exportDatabaseBackup(): Promise<string> {
  const [
    userProfile,
    chatHistory,
    aiMemorySummary,
    dailyStreaks,
    foodLogs,
    recipes,
    weightRecords
  ] = await Promise.all([
    db.userProfile.toArray(),
    db.chatHistory.toArray(),
    db.aiMemorySummary.toArray(),
    db.dailyStreaks.toArray(),
    db.foodLogs.toArray(),
    db.recipes.toArray(),
    db.weightRecords.toArray()
  ]);

  const backupData: AppBackupData = {
    version: '1.0.0',
    exportDate: new Date().toISOString(),
    app: 'DownPeso By ChrizDev',
    data: {
      userProfile,
      chatHistory,
      aiMemorySummary,
      dailyStreaks,
      foodLogs,
      recipes,
      weightRecords
    }
  };

  const jsonString = JSON.stringify(backupData, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10);
  const timeStr = `${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
  const filename = `DownPeso_Backup_${dateStr}_${timeStr}.json`;

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  return filename;
}

/**
 * Valida e importa un archivo JSON restaurando todas las tablas en Dexie.js
 */
export async function importDatabaseBackup(jsonString: string): Promise<{ success: boolean; message: string; recordCounts?: Record<string, number> }> {
  try {
    const rawData = JSON.parse(jsonString);
    const parsed = BackupSchema.safeParse(rawData);

    if (!parsed.success) {
      return {
        success: false,
        message: 'El archivo seleccionado no cumple con el formato oficial de respaldo de DownPeso.'
      };
    }

    const { data } = parsed.data;

    // Restauración atómica en una transacción
    await db.transaction('rw', [
      db.userProfile,
      db.chatHistory,
      db.aiMemorySummary,
      db.dailyStreaks,
      db.foodLogs,
      db.recipes,
      db.weightRecords
    ], async () => {
      await db.userProfile.clear();
      await db.chatHistory.clear();
      await db.aiMemorySummary.clear();
      await db.dailyStreaks.clear();
      await db.foodLogs.clear();
      await db.recipes.clear();
      await db.weightRecords.clear();

      if (data.userProfile.length) await db.userProfile.bulkAdd(data.userProfile);
      if (data.chatHistory.length) await db.chatHistory.bulkAdd(data.chatHistory);
      if (data.aiMemorySummary.length) await db.aiMemorySummary.bulkAdd(data.aiMemorySummary);
      if (data.dailyStreaks.length) await db.dailyStreaks.bulkAdd(data.dailyStreaks);
      if (data.foodLogs.length) await db.foodLogs.bulkAdd(data.foodLogs);
      if (data.recipes.length) await db.recipes.bulkAdd(data.recipes);
      if (data.weightRecords && data.weightRecords.length) await db.weightRecords.bulkAdd(data.weightRecords);
    });

    return {
      success: true,
      message: 'Base de datos restaurada con éxito.',
      recordCounts: {
        perfil: data.userProfile.length,
        mensajesChat: data.chatHistory.length,
        rachas: data.dailyStreaks.length,
        comidasRegistradas: data.foodLogs.length,
        recetas: data.recipes.length
      }
    };
  } catch (error: any) {
    console.error('Error al importar respaldo:', error);
    return {
      success: false,
      message: `Error al procesar el archivo: ${error?.message || 'Archivo corrupto o inválido'}`
    };
  }
}

/**
 * Restablece la base de datos por completo y recarga recetas base
 */
export async function resetDatabaseToFactory(): Promise<void> {
  await db.transaction('rw', [
    db.userProfile,
    db.chatHistory,
    db.aiMemorySummary,
    db.dailyStreaks,
    db.foodLogs,
    db.recipes,
    db.weightRecords
  ], async () => {
    await db.userProfile.clear();
    await db.chatHistory.clear();
    await db.aiMemorySummary.clear();
    await db.dailyStreaks.clear();
    await db.foodLogs.clear();
    await db.recipes.clear();
    await db.weightRecords.clear();
  });
  await seedInitialDataIfNeeded();
}
