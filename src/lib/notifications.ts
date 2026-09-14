import { db, getTodayDateString, getOrCreateTodayStreak } from './db';
import confetti from 'canvas-confetti';

export interface NotificationSettings {
  enabled: boolean;
  intervalMinutes: number;
}

const SETTINGS_KEY = 'downpeso_notification_settings';

export function getNotificationSettings(): NotificationSettings {
  try {
    const saved = localStorage.getItem(SETTINGS_KEY);
    if (saved) return JSON.parse(saved);
  } catch (_) {}
  return { enabled: true, intervalMinutes: 90 };
}

export function saveNotificationSettings(settings: NotificationSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    scheduleNextReminder();
  } catch (_) {}
}

let reminderTimeoutId: any = null;

export interface InAppNotification {
  id: string;
  title: string;
  message: string;
  type: 'water' | 'habit' | 'coach';
}

/**
 * Envía una notificación Push nativa al sistema operativo utilizando el Service Worker (necesario en Android y PWA)
 */
export async function sendNativePushNotification(title: string, options?: Record<string, any>): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false;
  }
  if (Notification.permission !== 'granted') {
    return false;
  }

  const defaultOptions: Record<string, any> = {
    icon: '/pwa-192x192.svg',
    badge: '/favicon.svg',
    tag: 'downpeso-notification',
    vibrate: [200, 100, 200],
    ...options
  };

  // 1. Intentar a través de ServiceWorkerRegistration (estándar moderno en Android y PWAs instaladas)
  if ('serviceWorker' in navigator) {
    try {
      const reg = await navigator.serviceWorker.ready;
      if (reg && typeof reg.showNotification === 'function') {
        await reg.showNotification(title, defaultOptions);
        return true;
      }
    } catch (swErr) {
      console.warn('Fallo al disparar notificación por ServiceWorker, probando constructor nativo:', swErr);
    }
  }

  // 2. Fallback a constructor estándar de Notification (Desktop / Safari)
  try {
    const notif = new Notification(title, defaultOptions);
    notif.onclick = () => {
      window.focus();
      notif.close();
    };
    return true;
  } catch (notifErr) {
    console.error('No se pudo instanciar la notificación nativa del navegador:', notifErr);
    return false;
  }
}

/**
 * Solicita permisos de notificación nativa del navegador / sistema operativo
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'denied';
  }
  if (Notification.permission === 'granted') {
    return 'granted';
  }
  return await Notification.requestPermission();
}

/**
 * Prueba la notificación Push con un retraso para permitir minimizar o bloquear la pantalla
 */
export async function testPushNotificationWithDelay(delaySeconds: number = 3): Promise<void> {
  const perm = await requestNotificationPermission();
  if (perm !== 'granted') {
    throw new Error('Permiso de notificaciones denegado por el navegador o sistema.');
  }

  setTimeout(async () => {
    await sendNativePushNotification('💧 Otto: ¡Prueba de Notificación Push Real!', {
      body: '¡Excelente! Esta es una notificación real del sistema operativo. Otto te avisará de tus hábitos aun con la app minimizada.',
      tag: 'downpeso-test-push',
      renotify: true
    });
  }, delaySeconds * 1000);
}

/**
 * Dispara una notificación interactiva (nativa del sistema y banner en app)
 * @param force Si es true, dispara el aviso incluso si ya se alcanzó la meta (útil para pruebas)
 */
export async function triggerSmartHydrationReminder(force: boolean = false): Promise<void> {
  const profile = await db.userProfile.toCollection().first();
  const today = getTodayDateString();
  const streak = await db.dailyStreaks.where('date').equals(today).first();

  const currentGlasses = streak?.waterGlasses || 0;
  const targetGlasses = profile?.dailyWaterGoalMl ? Math.round(profile.dailyWaterGoalMl / 250) : 8;

  // Si ya cumplió la meta de agua de hoy y no es forzado, no interrumpir con avisos insistentes
  if (!force && currentGlasses >= targetGlasses) {
    return;
  }

  const title = '💧 Otto: ¡Momento de hidratarte!';
  const message = `Llevas ${currentGlasses} de ${targetGlasses} vasos hoy. Toma un vaso para mantener tu digestión y metabolismo activo.`;

  // 1. Disparar notificación nativa al sistema operativo
  await sendNativePushNotification(title, {
    body: message,
    tag: 'downpeso-water-reminder',
    renotify: true
  });

  // 2. Disparar banner interactivo interno en la app
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('downpeso:smart-notification', {
        detail: {
          id: `water-${Date.now()}`,
          title,
          message,
          type: 'water'
        }
      })
    );
  }
}

/**
 * Acción rápida: "Ya tomé" (+1 vaso directo en IndexedDB)
 */
export async function recordWaterFromNotification(): Promise<number> {
  const streak = await getOrCreateTodayStreak();
  const updatedGlasses = (streak.waterGlasses || 0) + 1;
  await db.dailyStreaks.update(streak.id!, {
    waterGlasses: updatedGlasses
  });

  try {
    confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
  } catch (_) {}

  // Notificar al resto de la app
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('downpeso:data-updated'));
  }

  // Programar siguiente recordatorio según intervalo configurado
  scheduleNextReminder();
  return updatedGlasses;
}

/**
 * Acción rápida: "Recuérdame en 5 minutos"
 */
export function snoozeReminder(minutes: number = 5): void {
  if (reminderTimeoutId) clearTimeout(reminderTimeoutId);
  reminderTimeoutId = setTimeout(() => {
    triggerSmartHydrationReminder();
  }, minutes * 60 * 1000);
}

/**
 * Programa el siguiente recordatorio inteligente
 */
export function scheduleNextReminder(): void {
  const settings = getNotificationSettings();
  if (!settings.enabled) return;

  if (reminderTimeoutId) clearTimeout(reminderTimeoutId);
  reminderTimeoutId = setTimeout(() => {
    triggerSmartHydrationReminder();
  }, settings.intervalMinutes * 60 * 1000);
}

/**
 * Inicializa el motor de notificaciones inteligentes
 */
export function initSmartNotifications(): void {
  scheduleNextReminder();
}
