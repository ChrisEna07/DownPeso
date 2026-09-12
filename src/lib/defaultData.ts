import { Recipe, WorkoutRoutine, NaturalRemedy } from '@/types';

export const DEFAULT_RECIPES: Recipe[] = [
  {
    id: 1,
    title: 'Sopa Casera de Verduras con Huevo Pochado',
    category: 'almuerzo',
    description: 'Plato reconfortante, de muy bajo costo y alto volumen. Aporta fibra, vitaminas y proteína de alto valor biológico.',
    ingredients: [
      '2 tazas de caldo de pollo desgrasado o agua con hierbas',
      '1 calabacita mediana picada en cubos',
      '1 zanahoria en rodajas finas',
      '1 taza de espinacas frescas troceadas',
      '1/2 taza de chayote o coliflor',
      '1 huevo fresco',
      '1 pizca de orégano seco, sal y pimienta al gusto',
      'Gotas de limón fresco'
    ],
    instructions: [
      'En una olla pequeña, hierve el agua o caldo con la zanahoria y el chayote durante 6 minutos.',
      'Agrega la calabacita y las espinacas; cocina por 3 minutos más hasta que estén tiernas pero crujientes.',
      'Baja el fuego al mínimo, haz un pequeño remolino en el caldo y vierte el huevo con cuidado.',
      'Cocina tapado a fuego suave durante 3 minutos hasta que la clara esté firme y la yema tierna.',
      'Sirve caliente en tazón hondo con orégano y un toque de limón.'
    ],
    prepTimeMinutes: 15,
    estimatedCalories: 190,
    budgetFriendly: true,
    tags: ['Económica', 'Alto Volumen', 'Bajo en Grasa', 'Saciante']
  },
  {
    id: 2,
    title: 'Salteado Rápido de Atún con Calabacita y Jitomate',
    category: 'cena',
    description: 'Cena ligera que aprovecha la lata de atún con verduras de mercado. Lista en menos de 10 minutos.',
    ingredients: [
      '1 lata de atún en agua, bien escurrida',
      '1 calabacita grande picada en cubos pequeños',
      '1 jitomate maduro picado',
      '1/4 de cebolla morada picada',
      '1 cucharadita de aceite de oliva o maíz',
      'Cilantro fresco picado al gusto',
      'Pizca de sal marina y pimienta negra'
    ],
    instructions: [
      'En una sartén antiadherente, calienta la cucharadita de aceite y sofríe la cebolla por 2 minutos.',
      'Añade el jitomate y la calabacita; cocina a fuego medio durante 5 minutos removiendo ocasionalmente.',
      'Agrega el atún desmenuzado, sal y pimienta. Mezcla bien por 2 minutos para integrar sabores.',
      'Finaliza con cilantro fresco y acompaña opcionalmente con 1 tostada horneada de maíz.'
    ],
    prepTimeMinutes: 10,
    estimatedCalories: 230,
    budgetFriendly: true,
    tags: ['Rápida', 'Cena Ligera', 'Proteína Magra']
  },
  {
    id: 3,
    title: 'Avena Trasnochada con Manzana y Canela',
    category: 'desayuno',
    description: 'Desayuno saciante preparado desde la noche anterior. La fibra soluble beta-glucano ayuda a regular la glucosa y prolonga la saciedad.',
    ingredients: [
      '1/2 taza de copos de avena entera',
      '3/4 taza de agua o leche descremada / vegetal sin azúcar',
      '1/2 manzana picada en cubitos con cáscara',
      '1 cucharadita de canela molida',
      '1 cucharada de semillas de chía o linaza',
      'Gotas de extracto de vainilla o canela extra'
    ],
    instructions: [
      'En un frasco o recipiente con tapa, combina la avena, la chía, la canela y el líquido.',
      'Revuelve bien para evitar grumos y tapa herméticamente.',
      'Refrigera durante toda la noche (mínimo 4 horas).',
      'Por la mañana, corona con los cubitos de manzana fresca y canela adicional antes de comer.'
    ],
    prepTimeMinutes: 5,
    estimatedCalories: 260,
    budgetFriendly: true,
    tags: ['Sin Cocción', 'Desayuno', 'Rico en Fibra', 'Energía Estable']
  },
  {
    id: 4,
    title: 'Lentejas Caseras Guisadas con Espinaca y Zanahoria',
    category: 'almuerzo',
    description: 'Plato tradicional de legumbres económicas, ricas en hierro, fibra y proteína vegetal. Gran poder saciante para controlar el apetito de la tarde.',
    ingredients: [
      '1 taza de lentejas cocidas',
      '1 taza de espinacas frescas picadas',
      '1 zanahoria mediana en cubitos',
      '1 diente de ajo y 1/4 cebolla finamente picados',
      '1 jitomate licuado o picado',
      '1 taza de caldo de cocción o agua',
      'Comino molido, sal y laurel al gusto'
    ],
    instructions: [
      'En una olla mediana, sofríe el ajo y la cebolla con unas gotas de aceite.',
      'Añade el jitomate y cocina hasta que cambie a un rojo más intenso.',
      'Incorpora las lentejas cocidas, la zanahoria, la hoja de laurel y la taza de líquido.',
      'Hierve suavemente durante 10 minutos hasta que la zanahoria esté suave.',
      'Agrega las espinacas los últimos 2 minutos, rectifica de sal y comino, y sirve caliente.'
    ],
    prepTimeMinutes: 20,
    estimatedCalories: 280,
    budgetFriendly: true,
    tags: ['Legumbres', 'Proteína Vegetal', 'Almuerzo Completo']
  },
  {
    id: 5,
    title: 'Omelette de Nopales y Queso Fresco Liviano',
    category: 'desayuno',
    description: 'Clásico desayuno mexicano con alto contenido de mucílago de nopal que ralentiza la digestión de carbohidratos.',
    ingredients: [
      '2 huevos enteros',
      '1 taza de nopales cocidos o asados en cubos',
      '30g de queso fresco bajo en grasa (tipo panela o requesón)',
      '1/4 cucharadita de orégano',
      'Pizca de sal y pimienta'
    ],
    instructions: [
      'Bate los huevos en un tazón con la pizca de sal, pimienta y orégano.',
      'En una sartén antiadherente tibia, calienta los nopales ya cocidos durante 1 minuto.',
      'Vierte los huevos batidos cubriendo los nopales uniformemente.',
      'Cocina a fuego medio-bajo por 3 minutos; cuando la superficie esté casi cuajada, espolvorea el queso fresco.',
      'Dobla por la mitad, cocina 1 minuto más y sirve inmediatamente.'
    ],
    prepTimeMinutes: 12,
    estimatedCalories: 220,
    budgetFriendly: true,
    tags: ['Bajo en Carbohidratos', 'Desayuno Proteico', 'Digestivo']
  },
  {
    id: 6,
    title: 'Pechuga a la Plancha con Ensalada Fresca de Repollo y Limón',
    category: 'almuerzo',
    description: 'Proteína pura con una ensalada crujiente muy económica que llena el estómago con mínimo aporte calórico.',
    ingredients: [
      '120g de pechuga de pollo en bistec',
      '2 tazas de col / repollo finamente rallado',
      '1/2 zanahoria rallada',
      'Jugo de 1 limón verde grande',
      '1 cucharadita de aceite de oliva',
      'Ajo en polvo, sal marina y pimienta negra'
    ],
    instructions: [
      'Sazona la pechuga de pollo con ajo en polvo, sal y pimienta.',
      'En un tazón, mezcla el repollo rallado, la zanahoria, el limón, la cucharadita de aceite y sal. Masajea ligeramente para suavizar.',
      'Cocina la pechuga en sartén o plancha bien caliente por 4 minutos por lado hasta dorar.',
      'Sirve la pechuga caliente acompañada de la generosa montaña de ensalada fresca.'
    ],
    prepTimeMinutes: 15,
    estimatedCalories: 270,
    budgetFriendly: true,
    tags: ['Alto en Proteína', 'Keto Friendly', 'Crujiente']
  }
];

export const DEFAULT_WORKOUTS: WorkoutRoutine[] = [
  {
    id: 'w-1',
    title: 'Nivel 1: Movilidad y Despertar Metabólico',
    level: 'Nivel 1: Movilidad',
    durationMinutes: 15,
    lowImpact: true,
    description: 'Ideal para personas sedentarias, con sobrepeso o molestias articulares. Activa la circulación sin fatigar los tendones.',
    exercises: [
      { name: 'Rotación articular suave (cuello, hombros, muñecas y tobillos)', repsOrDuration: '2 minutos', tip: 'Movimientos circulares amplios y lentos, sin rebotes bruscos.' },
      { name: 'Caminata en el sitio a ritmo conversacional', repsOrDuration: '4 minutos', tip: 'Levanta las rodillas suavemente al nivel de la cadera mientras braceas.' },
      { name: 'Aperturas de brazos en cruz con respiración profunda', repsOrDuration: '2 minutos (30 seg descanso)', tip: 'Expande el pecho al inhalar y junta palmas al exhalar.' },
      { name: 'Elevación de talones parado (activación de pantorrillas)', repsOrDuration: '3 series de 12 repeticiones', tip: 'Apóyate en una pared o silla si requieres mayor balance.' },
      { name: 'Estiramiento final suave de piernas y espalda baja', repsOrDuration: '3 minutos', tip: 'Mantén cada postura 20 segundos sin aguantar la respiración.' }
    ]
  },
  {
    id: 'w-2',
    title: 'Nivel 2: Cardio Suave sin Saltos (Cero Impacto)',
    level: 'Nivel 2: Cardio Suave',
    durationMinutes: 18,
    lowImpact: true,
    description: 'Diseñado específicamente para proteger rodillas y espalda. Eleva el ritmo cardíaco para oxidar grasas sin un solo salto.',
    exercises: [
      { name: 'Paso lateral con extensión de brazos al frente (Side Step)', repsOrDuration: '3 minutos continuos', tip: 'Mantén una ligera semiflexión de rodillas y el abdomen firme.' },
      { name: 'Elevación de rodilla al pecho alternada con toque de manos', repsOrDuration: '3 minutos (30 seg descanso)', tip: 'No encorves la espalda; eleva la pierna hacia las manos.' },
      { name: 'Marcha rápida en el sitio con braceo activo', repsOrDuration: '4 minutos', tip: 'Acelera el ritmo sin perder el control de la respiración.' },
      { name: 'Boxeo al aire con pasos laterales (Jab-Cross suaves)', repsOrDuration: '4 minutos', tip: 'Extiende los brazos con energía controlada imaginando un objetivo a la altura de la vista.' },
      { name: 'Caminata de desaceleración y vuelta a la calma', repsOrDuration: '3 minutos', tip: 'Inhala profundamente por la nariz y exhala largo por la boca.' }
    ]
  },
  {
    id: 'w-3',
    title: 'Nivel 3: Tonificación Funcional y Fuerza en Casa',
    level: 'Nivel 3: Tonificación',
    durationMinutes: 22,
    lowImpact: true,
    description: 'Construir masa muscular es la clave para elevar el gasto calórico basal diario. Ejercicios con el propio peso corporal.',
    exercises: [
      { name: 'Sentadilla asistida a la silla (Sit-to-Stand)', repsOrDuration: '3 series de 10 a 12 repeticiones', tip: 'Siéntate controlando la bajada y levántate empujando con los talones.' },
      { name: 'Flexiones en pared o mostrador (Wall Push-ups)', repsOrDuration: '3 series de 10 a 12 repeticiones', tip: 'Mantén el cuerpo recto como una tabla desde la cabeza a los tobillos.' },
      { name: 'Puente de glúteos en el suelo o colchoneta', repsOrDuration: '3 series de 12 repeticiones', tip: 'Aprieta glúteos 2 segundos en la parte alta antes de descender lentamente.' },
      { name: 'Remo imaginario con toalla o resistencia isométrica', repsOrDuration: '3 series de 15 repeticiones', tip: 'Junta los omóplatos con fuerza sintiendo la musculatura de la espalda alta.' },
      { name: 'Plancha isométrica inclinada en pared o mesa firme', repsOrDuration: '3 series de 20 a 30 segundos', tip: 'Activa el core sin permitir que la cadera se hunda.' }
    ]
  },
  {
    id: 'w-4',
    title: 'Nivel 4: Quema Grasa por Intervalos (HIIT Bajo Impacto)',
    level: 'Nivel 4: Quema Grasa',
    durationMinutes: 25,
    lowImpact: true,
    description: 'Intervalos progresivos que maximizan el consumo de oxígeno post-ejercicio (efecto EPOC) para acelerar la pérdida de grasa.',
    exercises: [
      { name: 'Calentamiento articular dinámico', repsOrDuration: '3 minutos', tip: 'Prepara articulaciones de cadera, tobillos y hombros.' },
      { name: 'Intervalo 1: Sentadilla suave + elevación de rodilla cruzada', repsOrDuration: '40 seg activo / 20 seg descanso (3 rondas)', tip: 'Lleva el codo hacia la rodilla contraria activando oblicuos.' },
      { name: 'Intervalo 2: Patinadores laterales deslizantes (sin saltar)', repsOrDuration: '40 seg activo / 20 seg descanso (3 rondas)', tip: 'Desliza el pie trasero cruzado tocando con la punta de los dedos.' },
      { name: 'Intervalo 3: Mountain climbers lentos en mesa o pared', repsOrDuration: '40 seg activo / 20 seg descanso (3 rondas)', tip: 'Lleva las rodillas hacia el pecho manteniendo la espalda neutra.' },
      { name: 'Enfriamiento y estiramiento muscular integral', repsOrDuration: '4 minutos', tip: 'Relaja la musculatura y normaliza las pulsaciones.' }
    ]
  }
];

export const DEFAULT_REMEDIES: NaturalRemedy[] = [
  {
    id: 'rem-1',
    name: 'Infusión Digestiva de Manzanilla con Anís y Toque de Menta',
    category: 'digestiva',
    ingredients: [
      '1 cucharada de flores secas de manzanilla (o 1 saquito)',
      '1/2 cucharadita de semillas de anís verde o 1 anís estrella',
      '3-4 hojas de menta fresca lavadas',
      '1 taza (250ml) de agua recién hervida'
    ],
    preparation: 'Coloca la manzanilla, el anís y la menta en una taza. Vierte el agua recién hervida, tapa de inmediato para atrapar los aceites esenciales volátiles y deja reposar de 7 a 10 minutos. Cuela y bebe tibio.',
    benefits: [
      'Alivia la distensión abdominal y la acumulación de gases tras las comidas.',
      'Efecto antiespasmódico sobre el tracto gastrointestinal.',
      'Sensación reconfortante de ligereza estomacal.'
    ],
    cautions: [
      'Consumo moderado durante el embarazo (consultar a su médico respecto al anís).',
      'No endulzar con azúcar refinada para no generar fermentación intestinal.'
    ]
  },
  {
    id: 'rem-2',
    name: 'Agua de Flor de Jamaica (Hibisco) con Canela',
    category: 'saciante',
    ingredients: [
      '2 cucharadas de cálices secos de flor de Jamaica',
      '1 rama de canela entera',
      '1 litro de agua pura',
      'Gotas de jugo de limón (opcional)'
    ],
    preparation: 'Hierve el litro de agua con la rama de canela por 5 minutos. Apaga el fuego, agrega la flor de Jamaica, tapa y deja infusionar 15 minutos. Cuela y deja enfriar. Se puede refrigerar y beber fría o templada a lo largo del día sin azúcar.',
    benefits: [
      'La canela ayuda a estabilizar picos de glucosa y reduce el antojo de azúcar por las tardes.',
      'Efecto diurético suave que favorece la eliminación de líquidos retenidos.',
      'Sabor ácido refrescante con cero calorías.'
    ],
    cautions: [
      'Puede reducir ligeramente la presión arterial: personas con hipotensión deben consumirla con moderación.',
      'Evitar en personas con gastritis erosiva activa por su acidez natural.'
    ]
  },
  {
    id: 'rem-3',
    name: 'Té Verde con Cáscara de Limón y Jengibre Fresco',
    category: 'saciante',
    ingredients: [
      '1 cucharadita de hojas de té verde de buena calidad (o 1 saquito)',
      '1 rodajita fina de jengibre fresco pelado (1-2 cm)',
      '1 tira de piel o cáscara de limón (sin la parte blanca amarga)',
      '1 taza de agua a unos 80°C (antes de hervir a borbotones)'
    ],
    preparation: 'Coloca el jengibre y la cáscara de limón en la taza. Agrega el agua caliente y el té verde. Infusiona por solo 3 a 4 minutos (si se deja más tiempo puede amargar). Retira el saquito o cuela y bebe a media mañana.',
    benefits: [
      'Las catequinas (EGCG) del té verde tienen acción antioxidante y termogénica moderada.',
      'Excelente sustituto de bebidas azucaradas entre comidas para calmar el apetito psicológico.',
      'El jengibre mejora el confort digestivo y aporta calor interno.'
    ],
    cautions: [
      'Contiene cafeína: no tomar después de las 5:00 PM para no interferir con el sueño reparador.',
      'Precaución en personas con arritmias o hipertensión no controlada.'
    ]
  },
  {
    id: 'rem-4',
    name: 'Infusión Dorada de Cúrcuma con Pizca de Pimienta Negra y Limón',
    category: 'desinflamatoria',
    ingredients: [
      '1/2 cucharadita de cúrcuma pura en polvo',
      '1 pizca muy pequeña de pimienta negra recién molida (la piperina multiplica la absorción de la curcumina)',
      'Jugo de 1/2 limón exprimido al momento',
      '250ml de agua caliente'
    ],
    preparation: 'Disuelve la cúrcuma y la pizca de pimienta en el agua caliente. Revuelve con una cuchara, deja entibiar 3 minutos y añade el jugo de limón antes de beber.',
    benefits: [
      'Potente acción antiinflamatoria sistémica natural.',
      'Favorece la recuperación articular tras los días de caminata o ejercicio.',
      'Apoyo a la función hepática y antioxidante celular.'
    ],
    cautions: [
      'No recomendada en personas con cálculos biliares u obstrucción de vías biliares.',
      'Consultar con un médico si se toman anticoagulantes orales.'
    ]
  },
  {
    id: 'rem-5',
    name: 'Infusión Suave de Cola de Caballo',
    category: 'desinflamatoria',
    ingredients: [
      '1 cucharadita de cola de caballo seca',
      '1 taza (250ml) de agua hirviendo',
      'Opcional: 1 rodaja de pepino'
    ],
    preparation: 'Vierte el agua hirviendo sobre la hierba seca, tapa y reposa 10 minutos. Cuela y toma 1 taza durante la mañana.',
    benefits: [
      'Diurético natural tradicional para días de pesadez en piernas o retención de líquidos por sodio excesivo.',
      'Rica en silicio orgánico que fortalece uñas y cabello.'
    ],
    cautions: [
      'Uso puntual: no tomar por más de 7 días continuos.',
      'Contraindicada en insuficiencia renal o cardíaca severa sin supervisión médica.'
    ]
  }
];
