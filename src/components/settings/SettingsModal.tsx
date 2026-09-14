import React, { useState, useEffect } from 'react';
import {
  X,
  Bell,
  Sun,
  Moon,
  Laptop,
  Type,
  Languages,
  UserCog,
  CheckCircle2,
  Clock,
  Droplets,
  Sliders
} from 'lucide-react';
import {
  getAppSettings,
  saveAppSettings
} from '@/lib/settings';
import { AppSettings, ThemeMode, FontSize } from '@/types';
import { LANGUAGES, t } from '@/lib/i18n';
import { triggerSmartHydrationReminder, requestNotificationPermission, testPushNotificationWithDelay } from '@/lib/notifications';
import { showFeedback } from '@/lib/feedback';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenProfile: () => void;
}

type SettingsTab = 'notifications' | 'theme' | 'font' | 'language';

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  onOpenProfile
}) => {
  const [settings, setSettings] = useState<AppSettings>(getAppSettings());
  const [activeTab, setActiveTab] = useState<SettingsTab>('notifications');
  const [permStatus, setPermStatus] = useState<string>(
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'denied'
  );

  useEffect(() => {
    if (isOpen) {
      setSettings(getAppSettings());
      if (typeof window !== 'undefined' && 'Notification' in window) {
        setPermStatus(Notification.permission);
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleUpdate = (partial: Partial<AppSettings>) => {
    const updated = saveAppSettings(partial);
    setSettings(updated);
  };

  const handleRequestPerm = async () => {
    const perm = await requestNotificationPermission();
    setPermStatus(perm);
    if (perm === 'granted') {
      showFeedback({
        type: 'success',
        title: 'Notificaciones Habilitadas',
        message: 'Ahora recibirás avisos del sistema incluso con la app en segundo plano.'
      });
    } else {
      showFeedback({
        type: 'error',
        title: 'Permiso Denegado',
        message: 'No pudimos activar las notificaciones nativas en tu navegador.'
      });
    }
  };

  const handleTestNotice = async () => {
    await triggerSmartHydrationReminder(true);
    showFeedback({
      type: 'announcement',
      title: 'Prueba de Aviso de Otto',
      message: 'Se ha enviado un recordatorio de hidratación interactivo con botones rápidos.'
    });
  };

  const handleTestDelayedPush = async () => {
    try {
      showFeedback({
        type: 'announcement',
        title: 'Notificación Push en 3s',
        message: '¡Minimiza la app o bloquea tu pantalla ahora para verla en la bandeja del sistema!'
      });
      await testPushNotificationWithDelay(3);
      setPermStatus(Notification.permission);
    } catch (err: any) {
      showFeedback({
        type: 'error',
        title: 'Permiso Denegado',
        message: err.message || 'Por favor otorga permisos de notificación en tu navegador.'
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Cabecera del Modal */}
        <div className="p-4 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-tr from-emerald-600 to-teal-500 text-white rounded-2xl shadow-sm">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                {t('settings_title', settings.language)}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {t('settings_subtitle', settings.language)}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Cerrar configuración"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Barra de pestañas internas */}
        <div className="flex border-b border-slate-100 dark:border-slate-800 px-4 pt-2 bg-slate-50/30 dark:bg-slate-800/20 overflow-x-auto gap-1">
          <button
            onClick={() => setActiveTab('notifications')}
            className={`flex items-center gap-2 px-3 py-2 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'notifications'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <Bell className="w-3.5 h-3.5" />
            {t('tab_notifications', settings.language)}
          </button>

          <button
            onClick={() => setActiveTab('theme')}
            className={`flex items-center gap-2 px-3 py-2 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'theme'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <Sun className="w-3.5 h-3.5" />
            {t('tab_theme', settings.language)}
          </button>

          <button
            onClick={() => setActiveTab('font')}
            className={`flex items-center gap-2 px-3 py-2 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'font'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <Type className="w-3.5 h-3.5" />
            {t('tab_font', settings.language)}
          </button>

          <button
            onClick={() => setActiveTab('language')}
            className={`flex items-center gap-2 px-3 py-2 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'language'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <Languages className="w-3.5 h-3.5" />
            {t('tab_language', settings.language)}
          </button>
        </div>

        {/* Contenido de la pestaña activa */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1">
          {/* Pestaña: Notificaciones */}
          {activeTab === 'notifications' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80">
                <div className="space-y-0.5">
                  <span className="text-sm font-bold block text-slate-900 dark:text-white">
                    {t('notif_title', settings.language)}
                  </span>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {t('notif_desc', settings.language)}
                  </p>
                </div>

                <label className="relative inline-flex items-center cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={settings.notificationsEnabled}
                    onChange={(e) => handleUpdate({ notificationsEnabled: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:width-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>

              {settings.notificationsEnabled && (
                <div className="space-y-4 pt-2">
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-emerald-600" />
                      {t('notif_interval_label', settings.language)}
                    </span>
                    <div className="grid grid-cols-4 gap-2">
                      {[45, 60, 90, 120].map((mins) => (
                        <button
                          key={mins}
                          onClick={() => handleUpdate({ notificationIntervalMinutes: mins })}
                          className={`py-2.5 px-2 rounded-2xl text-xs font-bold transition-all ${
                            settings.notificationIntervalMinutes === mins
                              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20 scale-[1.02]'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                          }`}
                        >
                          {mins} min
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2.5 pt-2">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                      {permStatus !== 'granted' ? (
                        <button
                          type="button"
                          onClick={handleRequestPerm}
                          className="text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:underline flex items-center gap-1.5"
                        >
                          <Bell className="w-4 h-4" />
                          {t('notif_native_perm', settings.language)}
                        </button>
                      ) : (
                        <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4" />
                          {t('notif_native_enabled', settings.language)}
                        </span>
                      )}

                      <button
                        type="button"
                        onClick={handleTestNotice}
                        className="w-full sm:w-auto px-4 py-2 rounded-2xl bg-cyan-100 dark:bg-cyan-950 text-cyan-800 dark:text-cyan-200 text-xs font-bold hover:bg-cyan-200 dark:hover:bg-cyan-900 transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                      >
                        <Droplets className="w-4 h-4 text-cyan-600" />
                        {t('notif_test_btn', settings.language)}
                      </button>
                    </div>

                    {/* Botón de prueba Push Nativa Real */}
                    <div className="p-3 bg-emerald-50/60 dark:bg-emerald-950/30 rounded-2xl border border-emerald-200/50 dark:border-emerald-800/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
                      <div className="space-y-0.5">
                        <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 block">
                          🔔 Notificación Push del Sistema (Real)
                        </span>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          Pruébala con 3 segundos de retardo para minimizar la app y verla en la bandeja de tu móvil o PC.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleTestDelayedPush}
                        className="w-full sm:w-auto px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-sm shrink-0 whitespace-nowrap"
                      >
                        Probar en 3 seg
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Pestaña: Tema Visual */}
          {activeTab === 'theme' && (
            <div className="space-y-4">
              <div className="space-y-1">
                <h4 className="text-sm font-black text-slate-900 dark:text-white">
                  {t('theme_title', settings.language)}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {t('theme_desc', settings.language)}
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {[
                  { mode: 'light' as ThemeMode, label: t('theme_light', settings.language), icon: Sun },
                  { mode: 'dark' as ThemeMode, label: t('theme_dark', settings.language), icon: Moon },
                  { mode: 'system' as ThemeMode, label: t('theme_system', settings.language), icon: Laptop }
                ].map(({ mode, label, icon: Icon }) => (
                  <button
                    key={mode}
                    onClick={() => handleUpdate({ theme: mode })}
                    className={`p-4 rounded-3xl border flex flex-col items-center gap-3 transition-all ${
                      settings.theme === mode
                        ? 'border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 shadow-sm scale-105'
                        : 'border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600'
                    }`}
                  >
                    <div
                      className={`p-3 rounded-2xl ${
                        settings.theme === mode
                          ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                          : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-bold text-center">{label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Pestaña: Tamaño de Fuente */}
          {activeTab === 'font' && (
            <div className="space-y-4">
              <div className="space-y-1">
                <h4 className="text-sm font-black text-slate-900 dark:text-white">
                  {t('font_title', settings.language)}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {t('font_desc', settings.language)}
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {[
                  { size: 'sm' as FontSize, label: t('font_sm', settings.language), preview: 'Aa' },
                  { size: 'base' as FontSize, label: t('font_base', settings.language), preview: 'Aa' },
                  { size: 'lg' as FontSize, label: t('font_lg', settings.language), preview: 'Aa' }
                ].map(({ size, label, preview }) => (
                  <button
                    key={size}
                    onClick={() => handleUpdate({ fontSize: size })}
                    className={`p-4 rounded-3xl border flex flex-col items-center gap-2 transition-all ${
                      settings.fontSize === size
                        ? 'border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 shadow-sm scale-105'
                        : 'border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600'
                    }`}
                  >
                    <span
                      className={`font-black ${
                        size === 'sm' ? 'text-lg' : size === 'base' ? 'text-2xl' : 'text-3xl'
                      }`}
                    >
                      {preview}
                    </span>
                    <span className="text-xs font-bold text-center">{label}</span>
                  </button>
                ))}
              </div>

              <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800/70 text-slate-700 dark:text-slate-300 text-xs leading-relaxed">
                Vista previa: DownPeso By ChrizDev adapta la tipografía completa de botones, tarjetas de hábitos, recetas y conversaciones con Otto.
              </div>
            </div>
          )}

          {/* Pestaña: Idioma */}
          {activeTab === 'language' && (
            <div className="space-y-4">
              <div className="space-y-1">
                <h4 className="text-sm font-black text-slate-900 dark:text-white">
                  {t('language_title', settings.language)}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {t('language_desc', settings.language)}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {LANGUAGES.map(({ code, label, flag, nativeName }) => (
                  <button
                    key={code}
                    onClick={() => {
                      handleUpdate({ language: code });
                      showFeedback({
                        type: 'success',
                        title: 'Idioma Actualizado',
                        message: `Ahora la interfaz y Otto hablarán en ${label}.`
                      });
                    }}
                    className={`p-4 rounded-3xl border flex items-center gap-3 transition-all ${
                      settings.language === code
                        ? 'border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 shadow-sm scale-[1.02]'
                        : 'border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600'
                    }`}
                  >
                    <span className="text-2xl">{flag}</span>
                    <div className="text-left">
                      <span className="text-xs font-extrabold block">{label}</span>
                      <span className="text-[10px] text-slate-400">{nativeName}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Pie del modal con botón de acceso a perfil antropométrico & Gemini API */}
        <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <button
            onClick={() => {
              onClose();
              onOpenProfile();
            }}
            className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
          >
            <UserCog className="w-4 h-4 text-emerald-600" />
            <span>Editar Perfil & Clave Gemini API</span>
          </button>

          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md shadow-emerald-600/20 active:scale-95"
          >
            Listo / Guardar
          </button>
        </div>
      </div>
    </div>
  );
};
