/* Demo seed data for DEMO mode */
import { db } from '../db/database';
import type { Patient, Episode, Evaluation, HogarProfile, ProblemaPrincipal, DiagnosticoTerapeutico, PlanIntervencion } from '../types';

const uid = () => crypto.randomUUID();

export async function loadDemoData() {
    // Clear existing demo data
    await Promise.all([
        db.patients.clear(), db.episodes.clear(), db.evaluations.clear(),
        db.hogarProfiles.clear(), db.problemas.clear(), db.diagnosticos.clear(), db.planes.clear(),
    ]);

    const patientId = uid();
    const episodeId = uid();
    const evalIngresoId = uid();
    const evalSeguimientoId = uid();

    const patient: Patient = {
        id: patientId,
        alias: 'M.R.',
        nombreCompleto: 'María de los Ángeles Rodríguez',
        fechaNacimiento: '1958-06-15',
        sexo: 'Femenino',
        diagnosticoPrincipal: 'ACV isquémico',
        diagnosticosSecundarios: ['Hipertensión arterial', 'Diabetes Mellitus tipo 2'],
        fechaEvento: '2025-11-20',
        resumenClinicoBreve: 'Paciente 67 años, ACV isquémico ACM izquierda. Hemiparesia derecha. Vive con esposo en casa de un piso.',
        direccionGeneral: 'Ñuñoa, Santiago',
        contacto: '',
        notas: 'Paciente motivada, buena red de apoyo familiar.',
    };

    const episode: Episode = {
        id: episodeId, patientId, fechaInicio: '2025-12-01', estado: 'activo',
    };

    const makeAssessment = (dominio: 'b' | 's' | 'd' | 'e' | 'p', sistema: string, label: string, q: number, inst: string, val: string, cif?: string) => ({
        id: uid(), dominioCIF: dominio as 'b', sistema: sistema as 'cognitivoConductual',
        categoriaLabel: label, codigoCIF: cif, instrumento: inst,
        resultadoTipo: 'ordinal' as const, resultadoValor: val,
        qualifier: q as 0, fecha: '2025-12-01', notas: '',
    });

    const evalIngreso: Evaluation = {
        id: evalIngresoId, episodeId, tipo: 'INGRESO', fecha: '2025-12-01',
        deficitsPorSistema: [
            makeAssessment('b', 'cognitivoConductual', 'Atención', 1, 'MoCA', '22/30', 'b140'),
            makeAssessment('b', 'cognitivoConductual', 'Funciones ejecutivas', 2, 'MoCA', '18/30', 'b164'),
            makeAssessment('b', 'neuromuscular', 'Fuerza', 3, 'Evaluación clínica', 'Grado 2-3/5 EESS y EEII der', 'b730'),
            makeAssessment('b', 'neuromuscular', 'Tono/espasticidad', 2, 'Escala de Tardieu', 'R1-R2 moderada', 'b735'),
            makeAssessment('b', 'neuromuscular', 'Control motor', 3, 'Evaluación clínica', 'Sinergias marcadas', 'b760'),
            makeAssessment('b', 'neuromuscular', 'Equilibrio', 3, 'Berg', '28/56', 'b235'),
            makeAssessment('b', 'neuromuscular', 'Marcha', 3, 'TUG', '35 seg', 'b770'),
            makeAssessment('b', 'sensorioperceptivo', 'Propiocepción', 2, 'Evaluación clínica', 'Disminuida mano der', 'b260'),
            makeAssessment('b', 'musculoesqueletico', 'ROM (rango articular)', 2, 'Goniometría', 'Limitación hombro/codo der', 'b710'),
            makeAssessment('b', 'cardiorrespiratorio', 'Tolerancia al esfuerzo', 2, 'Escala de Borg', 'Borg 5/10 a los 3 min marcha', 'b455'),
        ],
        actividadesLimitadas: [
            { id: uid(), label: 'Transferencias', codigoCIF: 'd420', assessment: makeAssessment('d', '', 'Transferencias', 3, 'Evaluación clínica', 'Requiere asistencia moderada', 'd420') },
            { id: uid(), label: 'Ponerse de pie', codigoCIF: 'd4104', assessment: makeAssessment('d', '', 'Ponerse de pie', 2, 'Evaluación clínica', 'Requiere apoyo de EESS', 'd4104') },
            { id: uid(), label: 'Caminar en hogar', codigoCIF: 'd4600', assessment: makeAssessment('d', '', 'Caminar en hogar', 3, 'TUG', '35 seg, con andador', 'd4600') },
            { id: uid(), label: 'Baño/ducha', codigoCIF: 'd5101', assessment: makeAssessment('d', '', 'Baño/ducha', 3, 'Barthel', '5/15', 'd5101') },
            { id: uid(), label: 'Vestirse', codigoCIF: 'd540', assessment: makeAssessment('d', '', 'Vestirse', 2, 'Barthel', '5/10', 'd540') },
            { id: uid(), label: 'Escaleras', codigoCIF: 'd4551', assessment: makeAssessment('d', '', 'Escaleras', 4, 'Evaluación clínica', 'No logra', 'd4551') },
        ],
        rolesRestringidos: [
            { id: uid(), label: 'Rol doméstico', codigoCIF: 'd640', assessment: makeAssessment('d', '', 'Rol doméstico', 3, 'Evaluación clínica', 'No realiza tareas domésticas', 'd640'), linkedActivitiesIds: [], linkedContextFactorIds: [] },
            { id: uid(), label: 'Rol familiar', codigoCIF: 'd760', assessment: makeAssessment('d', '', 'Rol familiar', 2, 'Evaluación clínica', 'Participación limitada', 'd760'), linkedActivitiesIds: [], linkedContextFactorIds: [] },
            { id: uid(), label: 'Rol social/comunitario', codigoCIF: 'd910', assessment: makeAssessment('d', '', 'Rol social/comunitario', 3, 'Evaluación clínica', 'No sale del domicilio', 'd910'), linkedActivitiesIds: [], linkedContextFactorIds: [] },
        ],
        factoresContextualesAmbientales: [
            { id: uid(), tipoFactor: 'AMBIENTAL', barreraFacilitador: 'FACILITADOR', capituloAmbiental: 'e3', label: 'Apoyo familiar', codigoCIF: 'e310', impactoQualifier: 3, links: {} },
            { id: uid(), tipoFactor: 'AMBIENTAL', barreraFacilitador: 'BARRERA', capituloAmbiental: 'e1', label: 'Productos y tecnología para movilidad', codigoCIF: 'e120', impactoQualifier: 2, notas: 'Solo cuenta con bastón, requiere andador', links: {} },
            { id: uid(), tipoFactor: 'AMBIENTAL', barreraFacilitador: 'BARRERA', capituloAmbiental: 'e1', label: 'Baño sin adaptaciones', impactoQualifier: 3, links: {} },
        ],
        factoresPersonales: [
            { id: uid(), tipoFactor: 'PERSONAL', barreraFacilitador: 'FACILITADOR', label: 'Motivación', impactoQualifier: 3, links: {} },
            { id: uid(), tipoFactor: 'PERSONAL', barreraFacilitador: 'BARRERA', label: 'Dolor percibido', impactoQualifier: 2, notas: 'Dolor hombro derecho', links: {} },
        ],
        notasBreves: 'Paciente colaboradora, esposo presente como cuidador principal. Casa de un piso, baño principal con bañera sin adaptaciones.',
    };

    const evalSeguimiento: Evaluation = {
        id: evalSeguimientoId, episodeId, tipo: 'SEGUIMIENTO', fecha: '2026-01-15',
        origenDuplicadoDe: evalIngresoId,
        deficitsPorSistema: [
            makeAssessment('b', 'cognitivoConductual', 'Atención', 1, 'MoCA', '24/30', 'b140'),
            makeAssessment('b', 'cognitivoConductual', 'Funciones ejecutivas', 1, 'MoCA', '21/30', 'b164'),
            makeAssessment('b', 'neuromuscular', 'Fuerza', 2, 'Evaluación clínica', 'Grado 3/5 EESS, 3+/5 EEII der', 'b730'),
            makeAssessment('b', 'neuromuscular', 'Tono/espasticidad', 2, 'Escala de Tardieu', 'R1-R2 leve a moderada', 'b735'),
            makeAssessment('b', 'neuromuscular', 'Control motor', 2, 'Evaluación clínica', 'Mejora selectividad EEII', 'b760'),
            makeAssessment('b', 'neuromuscular', 'Equilibrio', 2, 'Berg', '38/56', 'b235'),
            makeAssessment('b', 'neuromuscular', 'Marcha', 2, 'TUG', '22 seg', 'b770'),
            makeAssessment('b', 'sensorioperceptivo', 'Propiocepción', 1, 'Evaluación clínica', 'Mejorada', 'b260'),
            makeAssessment('b', 'musculoesqueletico', 'ROM (rango articular)', 1, 'Goniometría', 'Mejoría flexión hombro', 'b710'),
            makeAssessment('b', 'cardiorrespiratorio', 'Tolerancia al esfuerzo', 1, 'Escala de Borg', 'Borg 3/10 a los 3 min marcha', 'b455'),
        ],
        actividadesLimitadas: [
            { id: uid(), label: 'Transferencias', codigoCIF: 'd420', assessment: makeAssessment('d', '', 'Transferencias', 2, 'Evaluación clínica', 'Supervisión/mínima asistencia', 'd420') },
            { id: uid(), label: 'Ponerse de pie', codigoCIF: 'd4104', assessment: makeAssessment('d', '', 'Ponerse de pie', 1, 'Evaluación clínica', 'Independiente con apoyo', 'd4104') },
            { id: uid(), label: 'Caminar en hogar', codigoCIF: 'd4600', assessment: makeAssessment('d', '', 'Caminar en hogar', 2, 'TUG', '22 seg, con andador', 'd4600') },
            { id: uid(), label: 'Baño/ducha', codigoCIF: 'd5101', assessment: makeAssessment('d', '', 'Baño/ducha', 2, 'Barthel', '10/15', 'd5101') },
            { id: uid(), label: 'Vestirse', codigoCIF: 'd540', assessment: makeAssessment('d', '', 'Vestirse', 1, 'Barthel', '10/10', 'd540') },
            { id: uid(), label: 'Escaleras', codigoCIF: 'd4551', assessment: makeAssessment('d', '', 'Escaleras', 3, 'Evaluación clínica', 'Con asistencia y pasamanos', 'd4551') },
        ],
        rolesRestringidos: [
            { id: uid(), label: 'Rol doméstico', codigoCIF: 'd640', assessment: makeAssessment('d', '', 'Rol doméstico', 2, 'Evaluación clínica', 'Tareas livianas con supervisión', 'd640'), linkedActivitiesIds: [], linkedContextFactorIds: [] },
            { id: uid(), label: 'Rol familiar', codigoCIF: 'd760', assessment: makeAssessment('d', '', 'Rol familiar', 1, 'Evaluación clínica', 'Mayor participación', 'd760'), linkedActivitiesIds: [], linkedContextFactorIds: [] },
            { id: uid(), label: 'Rol social/comunitario', codigoCIF: 'd910', assessment: makeAssessment('d', '', 'Rol social/comunitario', 2, 'Evaluación clínica', 'Salidas cortas acompañada', 'd910'), linkedActivitiesIds: [], linkedContextFactorIds: [] },
        ],
        factoresContextualesAmbientales: [
            { id: uid(), tipoFactor: 'AMBIENTAL', barreraFacilitador: 'FACILITADOR', capituloAmbiental: 'e3', label: 'Apoyo familiar', codigoCIF: 'e310', impactoQualifier: 3, links: {} },
            { id: uid(), tipoFactor: 'AMBIENTAL', barreraFacilitador: 'FACILITADOR', capituloAmbiental: 'e1', label: 'Productos y tecnología para movilidad', codigoCIF: 'e120', impactoQualifier: 2, notas: 'Andador incorporado', links: {} },
            { id: uid(), tipoFactor: 'AMBIENTAL', barreraFacilitador: 'BARRERA', capituloAmbiental: 'e1', label: 'Baño sin adaptaciones', impactoQualifier: 2, notas: 'Pendiente instalación barras', links: {} },
        ],
        factoresPersonales: [
            { id: uid(), tipoFactor: 'PERSONAL', barreraFacilitador: 'FACILITADOR', label: 'Motivación', impactoQualifier: 3, links: {} },
            { id: uid(), tipoFactor: 'PERSONAL', barreraFacilitador: 'BARRERA', label: 'Dolor percibido', impactoQualifier: 1, notas: 'Dolor hombro disminuido', links: {} },
        ],
        notasBreves: 'Evolución favorable. Mejora fuerza EEII, mejor equilibrio y marcha. Pendiente adaptaciones en baño.',
    };

    const hogar: HogarProfile = {
        id: uid(), patientId,
        zonas: [
            {
                zonaId: 'dormitorio', zonaLabel: 'Dormitorio',
                barrerasFacilitadores: [
                    { id: uid(), tipoFactor: 'AMBIENTAL', barreraFacilitador: 'BARRERA', label: 'Altura de cama inadecuada', impactoQualifier: 2, links: {} },
                    { id: uid(), tipoFactor: 'AMBIENTAL', barreraFacilitador: 'FACILITADOR', label: 'Espacio amplio para transferencias', impactoQualifier: 2, links: {} },
                ],
                ayudasTecnicas: ['Andador'],
                modificaciones: [{ id: uid(), label: 'Cambio de altura de cama', estado: 'realizada', fecha: '2025-12-15', responsable: 'Esposo' }],
            },
            {
                zonaId: 'bano', zonaLabel: 'Baño',
                barrerasFacilitadores: [
                    { id: uid(), tipoFactor: 'AMBIENTAL', barreraFacilitador: 'BARRERA', label: 'Superficie resbaladiza', impactoQualifier: 3, links: {} },
                    { id: uid(), tipoFactor: 'AMBIENTAL', barreraFacilitador: 'BARRERA', label: 'Sin barras de apoyo', impactoQualifier: 3, links: {} },
                ],
                ayudasTecnicas: ['Silla de ducha/baño'],
                modificaciones: [
                    { id: uid(), label: 'Instalación de barras', estado: 'pendiente', responsable: 'Pendiente cotización' },
                    { id: uid(), label: 'Antideslizante en pisos', estado: 'realizada', fecha: '2025-12-10', responsable: 'Esposo' },
                ],
            },
            {
                zonaId: 'estar', zonaLabel: 'Estar / Living',
                barrerasFacilitadores: [
                    { id: uid(), tipoFactor: 'AMBIENTAL', barreraFacilitador: 'BARRERA', label: 'Alfombras sueltas', impactoQualifier: 2, links: {} },
                ],
                ayudasTecnicas: [],
                modificaciones: [{ id: uid(), label: 'Retiro de alfombras', estado: 'realizada', fecha: '2025-12-05', responsable: 'Familia' }],
            },
        ],
    };

    const problema: ProblemaPrincipal = {
        id: uid(), episodeId,
        disfuncionesIds: [],
        actividadesIds: [],
        actividadRolesMap: {},
        factoresContextualesClaveIds: [],
        textoResumen: 'Paciente de 67 años con hemiparesia derecha post ACV isquémico ACM izquierda, presenta déficit de fuerza (q3), alteración de tono/espasticidad (q2), y control motor (q3) de hemicuerpo derecho, que limitan transferencias (q3), marcha domiciliaria (q3), baño/ducha (q3) y manejo de escaleras (q4), restringiendo su rol doméstico (q3) y social/comunitario (q3). Barreras principales: baño sin adaptaciones, falta de ayudas técnicas adecuadas. Facilitadores: apoyo familiar sólido, alta motivación.',
    };

    const diagnostico: DiagnosticoTerapeutico = {
        id: uid(), episodeId, fecha: '2025-12-01',
        pacienteIdentificacion: 'M.R.', condicionSalud: 'ACV isquémico ACM izquierda (20/11/2025)',
        problemaPrincipalTexto: problema.textoResumen,
        rolesRestringidosClave: ['Rol doméstico', 'Rol social/comunitario'],
        factoresContextualesClave: ['Baño sin adaptaciones (barrera)', 'Apoyo familiar (facilitador)'],
        textoGenerado: `Paciente M.R., 67 años, cursa neurorehabilitación domiciliaria post ACV isquémico ACM izquierda (20/11/2025). Presenta hemiparesia derecha con déficit de fuerza (q3), espasticidad moderada (q2) y alteración de control motor (q3), que limitan principalmente transferencias, marcha domiciliaria, baño/ducha y escaleras. Esto restringe sus roles doméstico y social-comunitario. El entorno domiciliario presenta barreras en baño (sin adaptaciones), con facilitadores en apoyo familiar sólido y motivación personal alta. Plan orientado a mejorar independencia funcional en AVD y movilidad domiciliaria.`,
        version: 1,
    };

    const plan: PlanIntervencion = {
        id: uid(), episodeId,
        objetivoGeneral: 'Mejorar independencia funcional en AVD básicas y movilidad domiciliaria segura, optimizando el entorno y maximizando facilitadores personales y ambientales.',
        objetivosSMART: [
            {
                id: uid(), episodeId,
                especifico: 'Mejorar transferencias (sentado-bípedo y cama)',
                medible: 'Qualifier de 3 a 1 en transferencias',
                alcanzableNivel: 'alta', relevante: 'Prerequisito para independencia en AVD',
                tiempo: '2026-03-01', estado: 'EN_PROGRESO', evidenciaEvalIds: [evalIngresoId, evalSeguimientoId],
            },
            {
                id: uid(), episodeId,
                especifico: 'Mejorar marcha domiciliaria con andador',
                medible: 'TUG < 15 seg con andador',
                alcanzableNivel: 'media', relevante: 'Movilidad segura dentro del hogar',
                tiempo: '2026-03-01', estado: 'EN_PROGRESO', evidenciaEvalIds: [evalIngresoId, evalSeguimientoId],
            },
            {
                id: uid(), episodeId,
                especifico: 'Lograr baño/ducha con supervisión y adaptaciones',
                medible: 'Qualifier de 3 a 2 en baño/ducha',
                alcanzableNivel: 'media', relevante: 'Autonomía en higiene, dignidad',
                tiempo: '2026-04-01', estado: 'NO_INICIADO', evidenciaEvalIds: [evalIngresoId],
            },
        ],
    };

    // Persist
    await db.patients.put(patient);
    await db.episodes.put(episode);
    await db.evaluations.bulkPut([evalIngreso, evalSeguimiento]);
    await db.hogarProfiles.put(hogar);
    await db.problemas.put(problema);
    await db.diagnosticos.put(diagnostico);
    await db.planes.put(plan);
}

export async function clearAllData() {
    await Promise.all([
        db.patients.clear(), db.episodes.clear(), db.evaluations.clear(),
        db.hogarProfiles.clear(), db.problemas.clear(), db.diagnosticos.clear(), db.planes.clear(),
    ]);
}
