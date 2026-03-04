/* ───────────────────────────────────────────────────
   RehAPP v1.0  —  Typescript domain types (CIF)
   ─────────────────────────────────────────────────── */

// ── helpers ──────────────────────────────────────────
export type Qualifier = 0 | 1 | 2 | 3 | 4 | 8 | 9;
export type DominioCIF = 'b' | 's' | 'd' | 'e' | 'p';
export type SistemaCIF =
    | 'cognitivoConductual'
    | 'sensorioperceptivo'
    | 'neuromuscular'
    | 'musculoesqueletico'
    | 'cardiorrespiratorio'
    | 'otros';
export type ResultadoTipo = 'numeric' | 'ordinal' | 'textoCorto';
export type TipoFactor = 'AMBIENTAL' | 'PERSONAL';
export type BarreraFacilitador = 'BARRERA' | 'FACILITADOR';
export type TipoEvaluacion = 'INGRESO' | 'SEGUIMIENTO' | 'ALTA';
export type EstadoEpisodio = 'activo' | 'cerrado';
export type EstadoObjetivo = 'NO_INICIADO' | 'EN_PROGRESO' | 'LOGRADO';
export type AlcanzableNivel = 'alta' | 'media' | 'baja';

// ── CIF Item Assessment (universal) ─────────────────
export interface CIFItemAssessment {
    id: string;
    dominioCIF: DominioCIF;
    sistema?: SistemaCIF;
    categoriaLabel: string;
    codigoCIF?: string;
    instrumento: string;
    resultadoTipo: ResultadoTipo;
    resultadoValor: string;
    qualifier: Qualifier;
    fecha: string;
    notas?: string;
    links?: {
        activityIds?: string[];
        roleIds?: string[];
        zoneIds?: string[];
    };
}

// ── Activity (d) ────────────────────────────────────
export interface ActivityItem {
    id: string;
    label: string;
    codigoCIF?: string;
    assessment: CIFItemAssessment;
}

// ── Role / Participation ────────────────────────────
export interface RoleItem {
    id: string;
    label: string;
    codigoCIF?: string;
    assessment: CIFItemAssessment;
    linkedActivitiesIds: string[];
    linkedContextFactorIds: string[];
}

// ── Context factor (e / p) ──────────────────────────
export interface ContextFactor {
    id: string;
    tipoFactor: TipoFactor;
    barreraFacilitador: BarreraFacilitador;
    capituloAmbiental?: string;
    label: string;
    codigoCIF?: string;
    impactoQualifier: Qualifier;
    notas?: string;
    links?: {
        activityIds?: string[];
        roleIds?: string[];
        zoneIds?: string[];
    };
}

// ── Zone Profile (Hogar) ────────────────────────────
export interface ZoneProfile {
    zonaId: string;
    zonaLabel: string;
    barrerasFacilitadores: ContextFactor[];
    ayudasTecnicas: string[];
    modificaciones: HomeModification[];
}

export interface HomeModification {
    id: string;
    label: string;
    estado: 'pendiente' | 'realizada';
    fecha?: string;
    responsable?: string;
    impacto?: string;
}

export interface HogarProfile {
    id: string;
    patientId: string;
    zonas: ZoneProfile[];
}

// ── Evaluation (Encounter) ──────────────────────────
export interface Evaluation {
    id: string;
    episodeId: string;
    tipo: TipoEvaluacion;
    fecha: string;
    deficitsPorSistema: CIFItemAssessment[];
    actividadesLimitadas: ActivityItem[];
    rolesRestringidos: RoleItem[];
    factoresContextualesAmbientales: ContextFactor[];
    factoresPersonales: ContextFactor[];
    notasBreves?: string;
    origenDuplicadoDe?: string;
}

// ── Episode ─────────────────────────────────────────
export interface Episode {
    id: string;
    patientId: string;
    fechaInicio: string;
    fechaAlta?: string;
    estado: EstadoEpisodio;
}

// ── Patient ─────────────────────────────────────────
export interface Patient {
    id: string;
    nombreCompleto?: string;
    alias: string;
    runId?: string;
    fechaNacimiento?: string;
    sexo?: string;
    contacto?: string;
    direccionGeneral?: string;
    notas?: string;
    diagnosticoPrincipal: string;
    diagnosticosSecundarios: string[];
    fechaEvento?: string;
    resumenClinicoBreve?: string;
}

// ── Problem Principal ───────────────────────────────
export interface ProblemaPrincipal {
    id: string;
    episodeId: string;
    disfuncionesIds: string[];
    actividadesIds: string[];
    actividadRolesMap: Record<string, string[]>;
    factoresContextualesClaveIds: string[];
    textoResumen: string;
}

// ── Diagnóstico Terapéutico ─────────────────────────
export interface DiagnosticoTerapeutico {
    id: string;
    episodeId: string;
    fecha: string;
    pacienteIdentificacion: string;
    condicionSalud: string;
    problemaPrincipalTexto: string;
    rolesRestringidosClave: string[];
    factoresContextualesClave: string[];
    textoGenerado: string;
    version: number;
}

// ── Objective SMART ─────────────────────────────────
export interface ObjectiveSMART {
    id: string;
    episodeId: string;
    especifico: string;
    especificoItemId?: string;
    medible: string;
    medibleIndicador?: string;
    alcanzableNivel: AlcanzableNivel;
    alcanzableNota?: string;
    relevante: string;
    relevanteNota?: string;
    tiempo: string;
    estado: EstadoObjetivo;
    evidenciaEvalIds: string[];
}

// ── Plan Intervención ───────────────────────────────
export interface PlanIntervencion {
    id: string;
    episodeId: string;
    objetivoGeneral: string;
    objetivosSMART: ObjectiveSMART[];
}

// ── App Settings ────────────────────────────────────
export interface AppSettings {
    id: string;
    modoPrivacidad: boolean;
    modoApp: 'LOCAL' | 'DEMO';
}
