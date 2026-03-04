/* ───  SEED CATALOGS  ─── */

export const zonasHogar = [
    { id: 'dormitorio', label: 'Dormitorio' },
    { id: 'bano', label: 'Baño' },
    { id: 'cocina', label: 'Cocina' },
    { id: 'estar', label: 'Estar / Living' },
    { id: 'pasillos', label: 'Pasillos' },
    { id: 'entrada-escaleras', label: 'Entrada / Escaleras' },
    { id: 'exterior', label: 'Exterior inmediato' },
    { id: 'otros', label: 'Otros' },
];

export const barrerasFacilitadoresPorZona: Record<string, string[]> = {
    dormitorio: ['Iluminación insuficiente', 'Altura de cama inadecuada', 'Alfombras sueltas', 'Obstáculos/desorden', 'Espacio reducido para transferencias', 'Timbre/llamado accesible'],
    bano: ['Superficie resbaladiza', 'Sin barras de apoyo', 'Alza WC ausente', 'Ducha sin silla', 'Espacio insuficiente', 'Iluminación insuficiente', 'Desnivel en acceso'],
    cocina: ['Altura mesón inadecuada', 'Acceso a alacenas difícil', 'Superficie resbaladiza', 'Obstáculos/desorden', 'Iluminación insuficiente'],
    estar: ['Sillón inadecuado (altura/firmeza)', 'Alfombras sueltas', 'Cables en el suelo', 'Iluminación insuficiente', 'Espacio para movilidad reducido'],
    pasillos: ['Ancho insuficiente', 'Obstáculos/desorden', 'Iluminación insuficiente', 'Pasamanos ausente', 'Desniveles'],
    'entrada-escaleras': ['Escalones sin pasamanos', 'Desniveles', 'Rampa ausente', 'Iluminación insuficiente', 'Superficie irregular'],
    exterior: ['Terreno irregular', 'Desniveles/escalones', 'Distancia a transporte público', 'Iluminación insuficiente', 'Superficie resbaladiza'],
    otros: ['Otro (especificar)'],
};

export const ayudasTecnicas = [
    'Bastón', 'Andador', 'Silla de ruedas', 'Barras de baño', 'Alza WC',
    'Cama clínica', 'Cojines posturales', 'Férulas', 'AFO (órtesis tobillo-pie)',
    'Tabla de transferencia', 'Silla de ducha/baño', 'Adaptadores de cubiertos',
    'Pinza de largo alcance', 'Calzador largo', 'Otro',
];

export const modificacionesHogar = [
    'Instalación de barras', 'Retiro de alfombras', 'Reorganización de muebles',
    'Instalación de rampa', 'Cambio de altura de cama', 'Instalación alza WC',
    'Mejora de iluminación', 'Ampliación de puertas', 'Instalación pasamanos',
    'Antideslizante en pisos', 'Otro',
];

export const sistemasDeficit = [
    { id: 'cognitivoConductual', label: 'Cognitivo-Conductual' },
    { id: 'sensorioperceptivo', label: 'Sensorioperceptivo' },
    { id: 'neuromuscular', label: 'Neuromuscular' },
    { id: 'musculoesqueletico', label: 'Musculoesquelético' },
    { id: 'cardiorrespiratorio', label: 'Cardiorrespiratorio' },
    { id: 'otros', label: 'Otros' },
];

export const itemsPorSistema: Record<string, { label: string; codigoCIF?: string }[]> = {
    cognitivoConductual: [
        { label: 'Atención', codigoCIF: 'b140' },
        { label: 'Memoria', codigoCIF: 'b144' },
        { label: 'Funciones ejecutivas', codigoCIF: 'b164' },
        { label: 'Conducta/autorregulación', codigoCIF: 'b130' },
    ],
    sensorioperceptivo: [
        { label: 'Visión', codigoCIF: 'b210' },
        { label: 'Vestibular', codigoCIF: 'b235' },
        { label: 'Propiocepción', codigoCIF: 'b260' },
        { label: 'Tacto', codigoCIF: 'b265' },
    ],
    neuromuscular: [
        { label: 'Fuerza', codigoCIF: 'b730' },
        { label: 'Tono/espasticidad', codigoCIF: 'b735' },
        { label: 'Control motor', codigoCIF: 'b760' },
        { label: 'Coordinación', codigoCIF: 'b770' },
        { label: 'Equilibrio', codigoCIF: 'b235' },
        { label: 'Marcha', codigoCIF: 'b770' },
    ],
    musculoesqueletico: [
        { label: 'ROM (rango articular)', codigoCIF: 'b710' },
        { label: 'Dolor', codigoCIF: 'b280' },
        { label: 'Postura/alineación', codigoCIF: 'b715' },
    ],
    cardiorrespiratorio: [
        { label: 'Tolerancia al esfuerzo', codigoCIF: 'b455' },
        { label: 'Disnea', codigoCIF: 'b460' },
        { label: 'Fatiga', codigoCIF: 'b455' },
        { label: 'Ortostatismo', codigoCIF: 'b420' },
    ],
    otros: [
        { label: 'Otro (especificar)' },
    ],
};

export const actividadesD = [
    { label: 'Transferencias', codigoCIF: 'd420' },
    { label: 'Ponerse de pie', codigoCIF: 'd4104' },
    { label: 'Sentarse', codigoCIF: 'd4103' },
    { label: 'Caminar en hogar', codigoCIF: 'd4600' },
    { label: 'Caminar en exterior inmediato', codigoCIF: 'd4602' },
    { label: 'Escaleras', codigoCIF: 'd4551' },
    { label: 'Higiene personal', codigoCIF: 'd510' },
    { label: 'Baño/ducha', codigoCIF: 'd5101' },
    { label: 'Uso de WC', codigoCIF: 'd530' },
    { label: 'Vestirse', codigoCIF: 'd540' },
    { label: 'Alimentación', codigoCIF: 'd550' },
    { label: 'Tareas domésticas básicas', codigoCIF: 'd640' },
    { label: 'Preparar comida simple', codigoCIF: 'd630' },
    { label: 'Manejo de medicación', codigoCIF: 'd5702' },
    { label: 'Cuidado de salud', codigoCIF: 'd570' },
];

export const rolesParticipacion = [
    { label: 'Rol familiar', codigoCIF: 'd760' },
    { label: 'Rol doméstico', codigoCIF: 'd640' },
    { label: 'Rol social/comunitario', codigoCIF: 'd910' },
    { label: 'Rol laboral', codigoCIF: 'd850' },
    { label: 'Ocio/recreación', codigoCIF: 'd920' },
];

export const factoresAmbientalesE = [
    { capitulo: 'e1', label: 'Productos y tecnología para AVD', codigoCIF: 'e115' },
    { capitulo: 'e1', label: 'Productos y tecnología para movilidad', codigoCIF: 'e120' },
    { capitulo: 'e3', label: 'Apoyo familiar', codigoCIF: 'e310' },
    { capitulo: 'e3', label: 'Apoyo de cuidadores', codigoCIF: 'e340' },
    { capitulo: 'e3', label: 'Apoyo de profesionales', codigoCIF: 'e355' },
    { capitulo: 'e4', label: 'Actitudes de la familia', codigoCIF: 'e410' },
    { capitulo: 'e4', label: 'Actitudes de cuidadores', codigoCIF: 'e440' },
    { capitulo: 'e5', label: 'Servicios de salud', codigoCIF: 'e580' },
    { capitulo: 'e5', label: 'Servicios de transporte', codigoCIF: 'e540' },
];

export const factoresPersonalesP = [
    'Adherencia', 'Motivación', 'Autoeficacia', 'Hábitos de sueño',
    'Dolor percibido', 'Alfabetización en salud', 'Afrontamiento',
    'Experiencia previa con rehabilitación', 'Red de apoyo percibida',
];

export const instrumentosEvaluacion = [
    'Evaluación clínica', 'TUG', '10MWT', '6MWT', '5xSTS',
    'Berg', 'Tinetti', 'Barthel', 'FIM', 'MAS (Motor Assessment Scale)',
    'Escala de Tardieu', 'MoCA', 'MMSE', 'ASIA', 'WISCI-II',
    'UPDRS', 'Hoehn & Yahr', 'EDSS', 'ALSFRS-R', 'Hughes GBS Scale',
    'Escala de Borg', 'EVA (dolor)', 'Dinamometría', 'Goniometría', 'Otro',
];

export const diagnosticosFrecuentes = [
    'ACV isquémico', 'ACV hemorrágico', 'Enfermedad de Parkinson',
    'Alzheimer / Demencia', 'Lesión Medular', 'Esclerosis Múltiple',
    'ELA', 'Guillain-Barré', 'TEC (Traumatismo encefalocraneano)',
    'Polineuropatía', 'Miopatía', 'Otro neurodegenerativo', 'Otro (especificar)',
];

export const capitulosAmbientales = [
    { id: 'e1', label: 'e1 — Productos y tecnología' },
    { id: 'e2', label: 'e2 — Entorno natural' },
    { id: 'e3', label: 'e3 — Apoyo y relaciones' },
    { id: 'e4', label: 'e4 — Actitudes' },
    { id: 'e5', label: 'e5 — Servicios, sistemas, políticas' },
];
