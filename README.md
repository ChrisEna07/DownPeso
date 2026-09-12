# DownPeso By ChrizDev 🌿⚖️

**DownPeso By ChrizDev** es una Progressive Web App (PWA) de uso personal enfocada en la creación de hábitos saludables sostenibles, nutrición casera económica, ejercicio progresivo sin equipo y reducción de peso inteligente impulsada por Inteligencia Artificial.

La aplicación está diseñada para ser alojada como un **Frontend 100% Estático (Static Export) en Vercel**, con **cero costos de infraestructura remota**. Toda la base de datos relacional y la memoria del asistente operan íntegramente en el navegador del usuario a través de **IndexedDB (Dexie.js)** y el SDK oficial de **Google Gemini (`@google/genai`)** se ejecuta en el cliente con clave API privada cifrada localmente.

---

## 🚀 Características Principales

### 1. 🛡️ Privacidad Absoluta & Cero Servidores (Local-First)
- **IndexedDB con Dexie.js**: Los datos antropométricos, registros de comidas, historial de chat, notas y hábitos se almacenan en el almacenamiento local del navegador.
- **Sin backend intermediario**: Tu información nunca pasa por servidores de terceros ni bases de datos remotas.
- **API Key Ofuscada**: La clave de Gemini se guarda cifrada mediante ofuscación y sal en almacenamiento local para comunicarse directamente de navegador a Google AI.

### 2. 📋 Onboarding & Perfil Antropométrico con Validación Estricta
- Formulario interactivo con **React Hook Form + Zod**.
- **Bloqueo físico de teclado**: Componente `NumericInput` que impide en tiempo real la digitación de letras (`a-z`, `e`, `+`, `-`) en campos de edad, estatura y peso.
- **Cálculos automáticos instantáneos**:
  - **IMC (Índice de Masa Corporal)** con clasificación según la Organización Mundial de la Salud (OMS).
  - **TMB (Tasa Metabólica Basal)** según la ecuación científica de **Mifflin-St Jeor**.
  - **TDEE (Gasto Energético Diario Total)** según nivel de actividad.
  - **Meta Calórica Segura**: Déficit moderado (~400 kcal) que respeta el metabolismo basal.
  - **Meta de Hidratación Personalizada**: ~35 ml por kg de peso corporal, traducido en vasos de 250 ml.

### 3. 🤖 Consejero IA con Memoria Local Adaptativa
- Saludo personalizado por tu nombre y conocimiento constante de tu meta de peso (kg faltantes para tu objetivo).
- **Sistema de Inyección de Contexto**: Cada consulta a Gemini inyecta automáticamente tus métricas corporales, los hábitos registrados hoy (agua, ejercicio, comidas) y la memoria acumulada.
- **Auto-Compactación de Memoria**: Rutina en segundo plano que analiza conversaciones antiguas para extraer preferencias, antojos y progresos, almacenándolos en la tabla `aiMemorySummary` para ahorrar tokens y mantener memoria a largo plazo.
- **Detección Inteligente de Alimentos**: Cuando le cuentas al asistente lo que comiste, detecta la comida y te ofrece un botón de un clic para registrarla en tu tabla diaria `foodLogs`.

### 4. 🍳 Recetario Casero y Económico + "¿Qué hay en mi refri?"
- Catálogo precargado de preparaciones tradicionales accesibles con ingredientes cotidianos (huevos, avena, lentejas, atún, calabacitas, repollo, verduras de temporada).
- Filtro por categorías (Desayunos, Almuerzos, Cenas Ligeras, Snacks).
- **Motor Inteligente del Refri**: Selecciona o escribe los ingredientes que tienes en tu cocina y Gemini generará una receta sabrosa, baja en calorías y económica, lista para guardarse en tus recetas locales con un clic.

### 5. 🏃 Rutinas de Ejercicio en Casa (Sin Equipo)
- 4 niveles progresivos pensados para reducir peso y proteger articulaciones:
  - **Nivel 1**: Movilidad y despertar articular (15 min).
  - **Nivel 2**: Cardio suave sin saltos (cero impacto para rodillas y espalda) (18 min).
  - **Nivel 3**: Tonificación funcional y calistenia asistida (22 min).
  - **Nivel 4**: Quema grasa por intervalos de bajo impacto (25 min).
- **Temporizador Interactivo**: Cronómetro con intervalos de esfuerzo y descanso, alertas visuales y vibración táctil en móviles.
- Botón para registrar la sesión en la racha activa del día.

### 6. 🍃 Botiquín Natural & Infusiones con Responsabilidad Médica
- Guía de bebidas tradicionales sin calorías clasificadas en:
  - **Digestivas & Antigases**: Manzanilla con anís y menta.
  - **Saciantes & Control de Ansiedad**: Té verde con jengibre y flor de Jamaica con canela.
  - **Desinflamatorias & Diuréticas Suaves**: Cúrcuma con pimienta y cola de caballo.
- **Avisos Médicos Claros**: Información sobre contraindicaciones (hipertensión, gastritis, embarazo, interacciones con anticoagulantes) recordando siempre que no sustituyen tratamientos médicos.

### 7. 🔥 Rachas & Hábitos Diarios (Streak Tracker)
- Registro interactivo de los 4 pilares:
  - Contador de vasos de agua (250 ml).
  - Porciones de vegetales y fibra consumidas.
  - Actividad física y movimiento realizado.
  - Cumplimiento de déficit calórico.
- Cálculo de **Racha Activa Consecutiva** y **Mejor Racha Histórica**.
- Historial de los últimos 14 días y bloc de notas reflexivas.
- Celebración visual con confeti al alcanzar las metas.

### 8. 💾 Centro de Respaldo Local (Backup & Restore)
- **Exportación en un Clic**: Descarga un archivo con marca de tiempo `DownPeso_Backup_AAAA-MM-DD_HHMM.json` con todo tu progreso (perfil, chat, memoria IA, alimentos, recetas y rachas).
- **Importador Seguro con Zod**: Valida la estructura del JSON y restaura la base de datos de manera atómica para transferir tu progreso entre dispositivos.
- **Restablecimiento Seguro**: Opción para reiniciar la app a estado de fábrica.

### 9. 📱 Progressive Web App (PWA) Offline
- Soporte offline completo mediante Service Worker generado con **Workbox**.
- Manifest interactivo con tema personalizado (`#059669`).
- Instalable en Android, iOS ("Añadir a pantalla de inicio") y Windows/macOS.

---

## 🛠️ Stack Tecnológico

| Capa | Tecnología | Propósito |
| :--- | :--- | :--- |
| **Framework** | [React 18](https://react.dev/) + [Vite 6](https://vitejs.dev/) | SPA moderna con recarga ultra rápida y soporte ESM |
| **PWA & Offline** | [`vite-plugin-pwa`](https://vite-pwa-org.netlify.app/) | Service Worker automatizado, precaching y manifiesto |
| **Estilos & UI** | [Tailwind CSS](https://tailwindcss.com/) + [Lucide Icons](https://lucide.dev/) | Diseño Mobile-First responsivo y accesible |
| **Base de Datos** | [Dexie.js](https://dexie.org/) | Wrapper reactivo y tipado sobre IndexedDB |
| **Motor de IA** | [`@google/genai`](https://www.npmjs.com/package/@google/genai) | SDK oficial de Google para modelos Gemini en cliente |
| **Formularios & Validación**| [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/) | Validación tipada en tiempo real y bloqueo de caracteres |
| **Efectos** | [canvas-confetti](https://www.npmjs.com/package/canvas-confetti) | Animaciones de celebración de metas y logros |

---

## 📁 Estructura del Código

```
DownPeso/
├── public/
│   ├── favicon.svg               # Icono favicon de la app
│   ├── pwa-192x192.svg           # Icono PWA para dispositivos móviles
│   └── pwa-512x512.svg           # Icono PWA de alta resolución
├── src/
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Navbar.tsx        # Cabecera con racha, acceso a perfil y datos
│   │   │   ├── TabNavigation.tsx # Navegación inferior (móvil) y superior (desktop)
│   │   │   └── InstallPrompt.tsx # Banner de instalación PWA
│   │   ├── onboarding/
│   │   │   ├── OnboardingModal.tsx # Formulario guiado antropométrico
│   │   │   └── NumericInput.tsx  # Input con bloqueo estricto de letras
│   │   ├── dashboard/
│   │   │   └── Dashboard.tsx     # Pantalla principal con métricas en vivo
│   │   ├── chat/
│   │   │   └── ChatInterface.tsx # Consejero IA con memoria adaptativa
│   │   ├── recipes/
│   │   │   └── RecipeCatalog.tsx # Catálogo y creador "¿Qué hay en mi refri?"
│   │   ├── exercises/
│   │   │   └── ExerciseGuide.tsx # 4 niveles sin equipo con cronómetro
│   │   ├── natural-remedies/
│   │   │   └── RemediesGuide.tsx # Infusiones con advertencias médicas
│   │   ├── streaks/
│   │   │   └── StreakTracker.tsx # Gestor de agua, hábitos y racha
│   │   └── backup/
│   │       └── BackupManager.tsx # Exportador/importador JSON
│   ├── lib/
│   │   ├── calculations.ts       # Fórmulas IMC, Mifflin-St Jeor, TDEE, agua
│   │   ├── crypto.ts             # Ofuscación segura de API Key en navegador
│   │   ├── db.ts                 # Esquema Dexie.js (IndexedDB)
│   │   ├── defaultData.ts        # Recetas iniciales, rutinas y remedios
│   │   ├── gemini.ts             # SDK @google/genai, contexto y auto-resumen
│   │   └── backup.ts             # Exportación e importación validada con Zod
│   ├── types/
│   │   └── index.ts              # Tipos TypeScript unificados
│   ├── App.tsx                   # Coordinador de estado y enrutamiento
│   ├── main.tsx                  # Punto de entrada y registro de Service Worker
│   ├── index.css                 # Directivas Tailwind CSS
│   └── vite-env.d.ts             # Tipos de entorno
├── index.html                    # Plantilla HTML con viewport PWA
├── package.json                  # Dependencias y scripts
├── tailwind.config.js            # Configuración de paleta esmeralda
├── tsconfig.json                 # Configuración estricta de TypeScript
├── vercel.json                   # Enrutamiento estático SPA para Vercel
├── vite.config.ts                # Configuración Vite + Plugin PWA
└── README.md                     # Documentación completa
```

---

## 💻 Instalación y Ejecución Local

### Prerrequisitos
- **Node.js**: v18.0 o superior (recomendado Node 20 LTS o 24 LTS).
- **npm** o **pnpm** o **yarn**.

### Pasos

1. **Clonar o ingresar a la carpeta del proyecto**:
   ```bash
   cd c:\Users\gamve\Desktop\DownPeso
   ```

2. **Instalar dependencias**:
   ```bash
   npm install
   ```

3. **Iniciar el servidor de desarrollo local**:
   ```bash
   npm run dev
   ```
   Abre tu navegador en la URL indicada (habitualmente `http://localhost:5173`).

4. **Compilar para producción**:
   ```bash
   npm run build
   ```
   Esto generará la carpeta `dist/` con todos los archivos estáticos, el Service Worker (`sw.js`) y el manifiesto PWA.

5. **Previsualizar la compilación de producción**:
   ```bash
   npm run preview
   ```

---

## ☁️ Despliegue en Vercel (Static Export Gratuito)

Dado que DownPeso funciona como una SPA estática sin backend, puedes alojarla en Vercel con **costo $0**:

### Opción A: Despliegue mediante Vercel CLI
1. Instala la herramienta de Vercel (si no la tienes):
   ```bash
   npm install -g vercel
   ```
2. Ejecuta en la raíz del proyecto:
   ```bash
   vercel
   ```
3. Acepta los valores predeterminados (Vercel detectará Vite automáticamente, con Output Directory en `dist`).
4. Para desplegar en producción:
   ```bash
   vercel --prod
   ```

### Opción B: Despliegue mediante GitHub
1. Sube este repositorio a tu cuenta de GitHub (`git init`, `git add .`, `git commit -m "DownPeso Initial Commit"`, `git push`).
2. Entra en [vercel.com](https://vercel.com) e inicia sesión.
3. Haz clic en **"Add New Project"** e importa tu repositorio de GitHub.
4. Vercel detectará el framework como **Vite**:
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`
5. Haz clic en **Deploy**. ¡En menos de un minuto tu PWA estará disponible en un dominio HTTPS global con soporte offline!

---

## 🔐 Privacidad y Gestión de la Gemini API Key

1. **¿Dónde se guarda mi API Key?**
   - Se almacena exclusivamente en tu propio navegador en la base de datos `DownPesoDB` (IndexedDB) tras pasar por una función de ofuscación (`src/lib/crypto.ts`).
2. **¿Pasa mi API Key por algún servidor intermedio?**
   - **No.** Las peticiones conversacionales van directamente desde tu navegador a `https://generativelanguage.googleapis.com` mediante el SDK `@google/genai`.
3. **¿Cómo obtener una Gemini API Key gratuita?**
   - Entra en [Google AI Studio](https://aistudio.google.com/app/apikey).
   - Inicia sesión con tu cuenta de Google y haz clic en **"Create API Key"**.
   - Pégala en el asistente de inicio o en la sección de Perfil de DownPeso.

---

## 📦 Sistema de Copias de Seguridad (Backup)

- **Para crear un respaldo**: Ve a la pestaña **"Centro de Datos"** (o presiona el icono de base de datos en la cabecera) y haz clic en **"Descargar Respaldo JSON"**. Guardarás un archivo con fecha y hora.
- **Para restaurar en otro celular o computadora**: Abre DownPeso en el nuevo dispositivo, ve al Centro de Datos, pulsa **"Cargar Archivo JSON"** y selecciona tu copia. Todos tus registros, hábitos y memoria del asistente se sincronizarán al instante.

---

## 👨‍💻 Autor y Créditos
- **Creador:** ChrizDev
- **Proyecto:** DownPeso By ChrizDev
- **Licencia:** MIT - Software libre para uso personal y comunitario.
