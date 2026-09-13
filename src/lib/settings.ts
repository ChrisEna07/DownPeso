import { AppSettings, ThemeMode, FontSize } from '@/types';
import { getNotificationSettings, saveNotificationSettings } from './notifications';

const SETTINGS_KEY = 'downpeso_app_settings';

export const DEFAULT_SETTINGS: AppSettings = {
  theme: 'system',
  fontSize: 'base',
  language: 'es',
  notificationsEnabled: true,
  notificationIntervalMinutes: 90
};

/**
 * Obtiene la configuración actual guardada en localStorage
 */
export function getAppSettings(): AppSettings {
  try {
    const saved = localStorage.getItem(SETTINGS_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Sincronizar con notificaciones
      const notif = getNotificationSettings();
      return {
        ...DEFAULT_SETTINGS,
        ...parsed,
        notificationsEnabled: notif.enabled,
        notificationIntervalMinutes: notif.intervalMinutes
      };
    }
  } catch (_) {}

  const notif = getNotificationSettings();
  return {
    ...DEFAULT_SETTINGS,
    notificationsEnabled: notif.enabled,
    notificationIntervalMinutes: notif.intervalMinutes
  };
}

/**
 * Aplica el tema visual al elemento raíz <html>
 */
export function applyTheme(theme: ThemeMode): void {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;
  let isDark = false;

  if (theme === 'dark') {
    isDark = true;
  } else if (theme === 'light') {
    isDark = false;
  } else {
    // Sistema
    if (typeof window !== 'undefined' && window.matchMedia) {
      isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
  }

  if (isDark) {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
}

/**
 * Aplica el tamaño de fuente base a la raíz para escalar la UI
 */
export function applyFontSize(size: FontSize): void {
  if (typeof document === 'undefined') return;

  const fontSizes: Record<FontSize, string> = {
    sm: '14px',
    base: '16px',
    lg: '18px'
  };

  document.documentElement.style.fontSize = fontSizes[size] || '16px';
}

/**
 * Guarda y aplica las nuevas configuraciones
 */
export function saveAppSettings(updates: Partial<AppSettings>): AppSettings {
  const current = getAppSettings();
  const next: AppSettings = { ...current, ...updates };

  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
  } catch (_) {}

  // Aplicar tema
  if (updates.theme !== undefined) {
    applyTheme(next.theme);
  }

  // Aplicar tamaño de letra
  if (updates.fontSize !== undefined) {
    applyFontSize(next.fontSize);
  }

  // Sincronizar notificaciones
  if (updates.notificationsEnabled !== undefined || updates.notificationIntervalMinutes !== undefined) {
    saveNotificationSettings({
      enabled: next.notificationsEnabled,
      intervalMinutes: next.notificationIntervalMinutes
    });
  }

  // Emitir evento global de actualización
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('downpeso:settings-updated', { detail: next }));
  }

  return next;
}

let mediaQueryListenerAttached = false;

/**
 * Inicializa los ajustes en el arranque de la aplicación
 */
export function initSettings(): AppSettings {
  const settings = getAppSettings();
  applyTheme(settings.theme);
  applyFontSize(settings.fontSize);

  // Escuchar cambios en la preferencia de color del sistema si está en modo 'system'
  if (typeof window !== 'undefined' && window.matchMedia && !mediaQueryListenerAttached) {
    mediaQueryListenerAttached = true;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      const current = getAppSettings();
      if (current.theme === 'system') {
        applyTheme('system');
      }
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
    } else {
      mediaQuery.addListener(handleChange);
    }
  }

  return settings;
}
