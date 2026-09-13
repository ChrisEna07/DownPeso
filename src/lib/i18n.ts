import { AppLanguage } from '@/types';
import { getAppSettings } from './settings';

export const LANGUAGES: { code: AppLanguage; label: string; flag: string; nativeName: string }[] = [
  { code: 'es', label: 'Español', flag: '🇪🇸', nativeName: 'Español' },
  { code: 'en', label: 'English', flag: '🇬🇧', nativeName: 'English' },
  { code: 'fr', label: 'Français', flag: '🇫🇷', nativeName: 'Français' },
  { code: 'ru', label: 'Русский', flag: '🇷🇺', nativeName: 'Русский' }
];

export const TRANSLATIONS: Record<AppLanguage, Record<string, string>> = {
  es: {
    // Navegación
    nav_home: 'Inicio',
    nav_coach: 'Otto Coach IA',
    nav_coach_short: 'Otto',
    nav_recipes: 'Recetas Caseras',
    nav_recipes_short: 'Recetas',
    nav_exercises: 'Ejercicios',
    nav_exercises_short: 'Rutinas',
    nav_remedies: 'Botiquín Natural',
    nav_remedies_short: 'Infusiones',
    nav_streaks: 'Rachas & Hábitos',
    nav_streaks_short: 'Hábitos',
    nav_backup: 'Centro de Datos',
    nav_backup_short: 'Respaldo',
    nav_settings: 'Configuración',

    // Dashboard & Cabecera
    app_subtitle: 'Salud, Nutrición Casera & Hábitos',
    active_streak: 'días de racha activa',
    profile_btn: 'Mi Perfil',
    settings_btn: 'Configuración',
    backup_btn: 'Respaldo',

    // Configuración
    settings_title: 'Configuración del Sistema',
    settings_subtitle: 'Personaliza notificaciones, tema, fuentes e idioma de Otto y la app.',
    tab_notifications: 'Notificaciones',
    tab_theme: 'Apariencia',
    tab_font: 'Tamaño de Letra',
    tab_language: 'Idioma',
    tab_profile: 'Perfil & IA',

    // Notificaciones
    notif_title: 'Recordatorios Inteligentes de Agua con Otto',
    notif_desc: 'Avisos periódicos con botones de acción directa para registrar agua o aplazar 5 min.',
    notif_status_active: 'Avisos Activos',
    notif_status_paused: 'Avisos Pausados',
    notif_interval_label: 'Frecuencia entre recordatorios:',
    notif_native_perm: 'Activar notificaciones del navegador',
    notif_native_enabled: 'Notificaciones nativas habilitadas',
    notif_test_btn: 'Probar aviso de Otto ahora',

    // Temas
    theme_title: 'Tema Visual',
    theme_desc: 'Selecciona cómo deseas ver la interfaz.',
    theme_light: 'Modo Claro',
    theme_dark: 'Modo Oscuro',
    theme_system: 'Automático (Sistema)',

    // Tamaño de fuente
    font_title: 'Tamaño de Letra',
    font_desc: 'Ajusta el tamaño del texto para mayor comodidad de lectura.',
    font_sm: 'Pequeño (90%)',
    font_base: 'Normal (100%)',
    font_lg: 'Grande (115%)',

    // Idioma
    language_title: 'Idioma de la Aplicación',
    language_desc: 'Otto y toda la interfaz se adaptarán al idioma seleccionado.',

    // Acciones de Otto
    otto_thinking: 'Otto está pensando...',
    otto_input_placeholder: 'Pregúntale a Otto, o cuéntale qué tomaste, comiste o hiciste hoy...',
    food_confirm_btn: 'Confirmar y Registrar Comida',
    food_saved_badge: '¡Comida guardada en tu registro diario!',
    quick_shortcuts: 'Atajos:',

    // Feedback
    toast_success: '¡Éxito!',
    toast_error: 'Error',
    toast_announcement: 'Aviso de Otto'
  },

  en: {
    nav_home: 'Home',
    nav_coach: 'Otto AI Coach',
    nav_coach_short: 'Otto',
    nav_recipes: 'Home Recipes',
    nav_recipes_short: 'Recipes',
    nav_exercises: 'Workouts',
    nav_exercises_short: 'Workouts',
    nav_remedies: 'Natural Remedies',
    nav_remedies_short: 'Remedies',
    nav_streaks: 'Habits & Streaks',
    nav_streaks_short: 'Habits',
    nav_backup: 'Data Center',
    nav_backup_short: 'Backup',
    nav_settings: 'Settings',

    app_subtitle: 'Health, Homemade Nutrition & Habits',
    active_streak: 'days active streak',
    profile_btn: 'My Profile',
    settings_btn: 'Settings',
    backup_btn: 'Backup',

    settings_title: 'System Settings',
    settings_subtitle: 'Customize notifications, theme, fonts, and language for Otto and the app.',
    tab_notifications: 'Notifications',
    tab_theme: 'Appearance',
    tab_font: 'Font Size',
    tab_language: 'Language',
    tab_profile: 'Profile & AI',

    notif_title: 'Smart Hydration Reminders with Otto',
    notif_desc: 'Periodic alerts with action buttons to quickly log water or snooze 5 mins.',
    notif_status_active: 'Alerts Active',
    notif_status_paused: 'Alerts Paused',
    notif_interval_label: 'Interval between reminders:',
    notif_native_perm: 'Enable browser notifications',
    notif_native_enabled: 'Browser notifications enabled',
    notif_test_btn: 'Test Otto alert now',

    theme_title: 'Visual Theme',
    theme_desc: 'Select your preferred visual style.',
    theme_light: 'Light Mode',
    theme_dark: 'Dark Mode',
    theme_system: 'Automatic (System)',

    font_title: 'Font Size',
    font_desc: 'Adjust text size for enhanced readability.',
    font_sm: 'Small (90%)',
    font_base: 'Normal (100%)',
    font_lg: 'Large (115%)',

    language_title: 'App Language',
    language_desc: 'Otto and the entire UI will adapt to your selected language.',

    otto_thinking: 'Otto is thinking...',
    otto_input_placeholder: 'Ask Otto, or tell him what you drank, ate, or did today...',
    food_confirm_btn: 'Confirm & Log Food',
    food_saved_badge: 'Food logged in your daily diary!',
    quick_shortcuts: 'Shortcuts:',

    toast_success: 'Success!',
    toast_error: 'Error',
    toast_announcement: 'Otto Notice'
  },

  fr: {
    nav_home: 'Accueil',
    nav_coach: 'Coach IA Otto',
    nav_coach_short: 'Otto',
    nav_recipes: 'Recettes Maison',
    nav_recipes_short: 'Recettes',
    nav_exercises: 'Exercices',
    nav_exercises_short: 'Séances',
    nav_remedies: 'Remèdes Naturels',
    nav_remedies_short: 'Infusions',
    nav_streaks: 'Habitudes & Séries',
    nav_streaks_short: 'Habitudes',
    nav_backup: 'Sauvegarde',
    nav_backup_short: 'Sauvegarde',
    nav_settings: 'Paramètres',

    app_subtitle: 'Santé, Nutrition Maison & Habitudes',
    active_streak: 'jours de série active',
    profile_btn: 'Mon Profil',
    settings_btn: 'Paramètres',
    backup_btn: 'Sauvegarde',

    settings_title: 'Paramètres du Système',
    settings_subtitle: 'Personnalisez les notifications, le thème, la police et la langue d’Otto.',
    tab_notifications: 'Notifications',
    tab_theme: 'Apparence',
    tab_font: 'Taille Police',
    tab_language: 'Langue',
    tab_profile: 'Profil & IA',

    notif_title: 'Rappels Intelligents d’Hydratation avec Otto',
    notif_desc: 'Alertes régulières avec boutons d’action directe (+1 verre ou reporter de 5 min).',
    notif_status_active: 'Alertes Actives',
    notif_status_paused: 'Alertes en Pause',
    notif_interval_label: 'Intervalle entre rappels :',
    notif_native_perm: 'Activer les notifications du navigateur',
    notif_native_enabled: 'Notifications du navigateur activées',
    notif_test_btn: 'Tester l’alerte d’Otto maintenant',

    theme_title: 'Thème Visuel',
    theme_desc: 'Choisissez votre style d’affichage.',
    theme_light: 'Mode Clair',
    theme_dark: 'Mode Sombre',
    theme_system: 'Automatique (Système)',

    font_title: 'Taille de Police',
    font_desc: 'Ajustez la taille du texte pour un meilleur confort visuel.',
    font_sm: 'Petite (90%)',
    font_base: 'Normale (100%)',
    font_lg: 'Grande (115%)',

    language_title: 'Langue de l’Application',
    language_desc: 'Otto et l’ensemble de l’interface s’adapteront à la langue choisie.',

    otto_thinking: 'Otto réfléchit...',
    otto_input_placeholder: 'Demandez à Otto, ou notez ce que vous avez bu, mangé ou fait aujourd’hui...',
    food_confirm_btn: 'Confirmer et Enregistrer le Repas',
    food_saved_badge: 'Repas enregistré dans votre journal !',
    quick_shortcuts: 'Raccourcis :',

    toast_success: 'Succès !',
    toast_error: 'Erreur',
    toast_announcement: 'Annonce d’Otto'
  },

  ru: {
    nav_home: 'Главная',
    nav_coach: 'Коуч Отто ИИ',
    nav_coach_short: 'Отто',
    nav_recipes: 'Домашние Рецепты',
    nav_recipes_short: 'Рецепты',
    nav_exercises: 'Тренировки',
    nav_exercises_short: 'Упражнения',
    nav_remedies: 'Народная Аптечка',
    nav_remedies_short: 'Настои',
    nav_streaks: 'Привычки и Серии',
    nav_streaks_short: 'Привычки',
    nav_backup: 'Резервные Данные',
    nav_backup_short: 'Бэкап',
    nav_settings: 'Настройки',

    app_subtitle: 'Здоровье, Домашнее Питание и Привычки',
    active_streak: 'дней активной серии',
    profile_btn: 'Мой Профиль',
    settings_btn: 'Настройки',
    backup_btn: 'Бэкап',

    settings_title: 'Настройки Системы',
    settings_subtitle: 'Настройте уведомления, тему, размер шрифта и язык приложения и Отто.',
    tab_notifications: 'Уведомления',
    tab_theme: 'Оформление',
    tab_font: 'Размер Шрифта',
    tab_language: 'Язык',
    tab_profile: 'Профиль и ИИ',

    notif_title: 'Умные Напоминания о Воде с Отто',
    notif_desc: 'Периодические напоминания с кнопками: «Выпил» (+1 стакан) или «Через 5 минут».',
    notif_status_active: 'Напоминания Включены',
    notif_status_paused: 'Напоминания на Паузе',
    notif_interval_label: 'Интервал между напоминаниями:',
    notif_native_perm: 'Включить уведомления браузера',
    notif_native_enabled: 'Уведомления браузера включены',
    notif_test_btn: 'Протестировать напоминание Отто',

    theme_title: 'Тема Оформления',
    theme_desc: 'Выберите предпочтительный стиль интерфейса.',
    theme_light: 'Светлая Тема',
    theme_dark: 'Тёмная Тема',
    theme_system: 'Как в Системе',

    font_title: 'Размер Шрифта',
    font_desc: 'Настройте размер текста для комфортного чтения.',
    font_sm: 'Мелкий (90%)',
    font_base: 'Обычный (100%)',
    font_lg: 'Крупный (115%)',

    language_title: 'Язык Приложения',
    language_desc: 'Отто и весь интерфейс переключатся на выбранный язык.',

    otto_thinking: 'Отто думает...',
    otto_input_placeholder: 'Спросите Отто или расскажите, что вы ели, пили или делали сегодня...',
    food_confirm_btn: 'Подтвердить и Сохранить Еду',
    food_saved_badge: 'Приём пищи сохранён в дневнике!',
    quick_shortcuts: 'Быстрые команды:',

    toast_success: 'Успешно!',
    toast_error: 'Ошибка',
    toast_announcement: 'Сообщение от Отто'
  }
};

/**
 * Traduce una clave en base al idioma actual o especificado
 */
export function t(key: string, lang?: AppLanguage): string {
  const currentLang = lang || getAppSettings().language || 'es';
  const dict = TRANSLATIONS[currentLang] || TRANSLATIONS['es'];
  return dict[key] || TRANSLATIONS['es'][key] || key;
}

/**
 * Obtiene el nombre formal del idioma para instruir a la IA
 */
export function getLanguagePromptInstruction(lang: AppLanguage): string {
  const instructions: Record<AppLanguage, string> = {
    es: 'IDIOMA: Debes responder y comunicarte SIEMPRE en Español.',
    en: 'LANGUAGE: You must ALWAYS answer and communicate in English.',
    fr: 'LANGUE : Tu dois TOUJOURS répondre et communiquer en Français.',
    ru: 'ЯЗЫК: Ты ДОЛЖЕН ВСЕГДА отвечать и общаться на Русском языке.'
  };
  return instructions[lang] || instructions['es'];
}
