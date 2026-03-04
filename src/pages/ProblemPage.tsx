import { useState, useEffect } from 'react';
import { db } from '../db/database';
import { useAppContext } from '../context/AppContext';
import type { ProblemaPrincipal, Evaluation } from '../types';
import { uid } from '../utils/helpers';
import { Puzzle, Wand2, CheckCircle, TriangleAlert, Check, Circle, ShieldAlert, ShieldCheck } from 'lucide-react';

interface CoherenceAlert { type: 'warning' | 'info'; msg: string; }

function checkCoherence(prob: ProblemaPrincipal, evals: Evaluation[]): CoherenceAlert[] {
    const alerts: CoherenceAlert[] = [];
    if (!prob.textoResumen.trim()) alerts.push({ type: 'warning', msg: 'El texto resumen del problema principal está vacío.' });
    if (evals.length === 0) alerts.push({ type: 'info', msg: 'No hay evaluaciones registradas para vincular.' });

    const lastEval = evals[evals.length - 1];
    if (lastEval) {
        // Check roles without activities
        for (const role of lastEval.rolesRestringidos) {
            if (role.linkedActivitiesIds.length === 0 && prob.actividadRolesMap) {
                const hasLink = Object.values(prob.actividadRolesMap).some(rIds => rIds.includes(role.id));
                if (!hasLink) alerts.push({ type: 'warning', msg: `Rol "${role.label}" sin actividad asociada en el problema principal.` });
            }
        }

        // Activities without deficit link
        if (lastEval.actividadesLimitadas.length > 0 && lastEval.deficitsPorSistema.length === 0) {
            alerts.push({ type: 'warning', msg: 'Hay actividades limitadas sin disfunciones vinculadas.' });
        }

        // Incomplete problem
        if (prob.disfuncionesIds.length === 0 && prob.actividadesIds.length === 0) {
            alerts.push({ type: 'warning', msg: 'El problema principal no tiene disfunciones ni actividades seleccionadas.' });
        }
    }

    if (prob.factoresContextualesClaveIds.length === 0) {
        alerts.push({ type: 'info', msg: 'No se han seleccionado factores contextuales clave (se recomienda 3-5).' });
    }

    return alerts;
}

export default function ProblemPage() {
    const { activeEpisodeId } = useAppContext();
    const [problem, setProblem] = useState<ProblemaPrincipal | null>(null);
    const [evals, setEvals] = useState<Evaluation[]>([]);
    const [alerts, setAlerts] = useState<CoherenceAlert[]>([]);

    const load = async () => {
        if (!activeEpisodeId) return;
        const evs = await db.evaluations.where('episodeId').equals(activeEpisodeId).toArray();
        setEvals(evs.sort((a, b) => a.fecha.localeCompare(b.fecha)));

        let prob = await db.problemas.where('episodeId').equals(activeEpisodeId).first();
        if (!prob) {
            prob = {
                id: uid(), episodeId: activeEpisodeId,
                disfuncionesIds: [], actividadesIds: [], actividadRolesMap: {},
                factoresContextualesClaveIds: [], textoResumen: '',
            };
        }
        setProblem(prob);
    };

    useEffect(() => { load(); }, [activeEpisodeId]);

    useEffect(() => {
        if (problem) setAlerts(checkCoherence(problem, evals));
    }, [problem, evals]);

    const save = async (p: ProblemaPrincipal) => {
        await db.problemas.put(p);
        setProblem(p);
    };

    const toggleDisfuncion = (id: string) => {
        if (!problem) return;
        const ids = problem.disfuncionesIds.includes(id)
            ? problem.disfuncionesIds.filter(d => d !== id)
            : [...problem.disfuncionesIds, id];
        save({ ...problem, disfuncionesIds: ids });
    };

    const toggleActividad = (id: string) => {
        if (!problem) return;
        const ids = problem.actividadesIds.includes(id)
            ? problem.actividadesIds.filter(a => a !== id)
            : [...problem.actividadesIds, id];
        save({ ...problem, actividadesIds: ids });
    };

    const toggleRoleForActivity = (actId: string, roleId: string) => {
        if (!problem) return;
        const map = { ...problem.actividadRolesMap };
        const current = map[actId] || [];
        map[actId] = current.includes(roleId) ? current.filter(r => r !== roleId) : [...current, roleId];
        save({ ...problem, actividadRolesMap: map });
    };

    const toggleContextFactor = (id: string) => {
        if (!problem) return;
        const ids = problem.factoresContextualesClaveIds.includes(id)
            ? problem.factoresContextualesClaveIds.filter(f => f !== id)
            : [...problem.factoresContextualesClaveIds, id];
        save({ ...problem, factoresContextualesClaveIds: ids });
    };

    const autoGenerateText = () => {
        if (!problem || evals.length === 0) return;
        const lastEval = evals[evals.length - 1];
        const disfunciones = lastEval.deficitsPorSistema
            .filter(d => problem.disfuncionesIds.includes(d.id))
            .map(d => `${d.categoriaLabel} (q${d.qualifier})`)
            .join(', ');
        const actividades = lastEval.actividadesLimitadas
            .filter(a => problem.actividadesIds.includes(a.id))
            .map(a => `${a.label} (q${a.assessment.qualifier})`)
            .join(', ');
        const roles = lastEval.rolesRestringidos.map(r => `${r.label} (q${r.assessment.qualifier})`).join(', ');
        const factores = [...lastEval.factoresContextualesAmbientales, ...lastEval.factoresPersonales]
            .filter(f => problem.factoresContextualesClaveIds.includes(f.id))
            .map(f => `${f.label} (${f.barreraFacilitador === 'BARRERA' ? 'barrera' : 'facilitador'}, q${f.impactoQualifier})`)
            .join(', ');

        const text = `Paciente presenta déficit en: ${disfunciones || 'sin seleccionar'}. Esto limita las actividades: ${actividades || 'sin seleccionar'}, restringiendo: ${roles || 'sin datos'}. Factores contextuales clave: ${factores || 'sin seleccionar'}.`;
        save({ ...problem, textoResumen: text });
    };

    if (!activeEpisodeId) {
        return (
            <div>
                <h1 className="page-title mb-4">Problema Principal</h1>
                <div className="card"><p className="text-muted">Selecciona un paciente y episodio primero.</p></div>
            </div>
        );
    }

    const lastEval = evals.length > 0 ? evals[evals.length - 1] : null;

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title flex items-center gap-2"><Puzzle size={24} /> Problema Principal</h1>
                <button className="btn btn-primary" onClick={autoGenerateText}><Wand2 size={16} /> Auto-generar texto</button>
            </div>

            {/* Coherence Index */}
            <div className="card" style={{ borderLeft: `4px solid ${alerts.filter(a => a.type === 'warning').length > 0 ? 'var(--warning)' : 'var(--success)'}` }}>
                <h3 className="card-title mb-2 flex items-center gap-2">
                    Índice de Coherencia: {alerts.filter(a => a.type === 'warning').length === 0 ? <><CheckCircle size={18} className="text-success" /> Completo</> : <><TriangleAlert size={18} className="text-warning" /> {alerts.filter(a => a.type === 'warning').length} pendiente(s)</>}
                </h3>
                {alerts.map((a, i) => (
                    <div key={i} className={`alert alert-${a.type}`}>{a.msg}</div>
                ))}
                {alerts.length === 0 && <p className="text-sm text-muted">Sin alertas. Problema principal coherente.</p>}
            </div>

            {!lastEval ? (
                <div className="alert alert-info">No hay evaluaciones. Crea una evaluación de ingreso para construir el problema principal.</div>
            ) : (
                <>
                    {/* Step 1: Disfunciones */}
                    <div className="card">
                        <h3 className="card-title mb-3">1. Selecciona disfunciones (b/s)</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 8 }}>
                            {lastEval.deficitsPorSistema.map(d => (
                                <label key={d.id} className="flex items-center gap-2" style={{ padding: 6, borderRadius: 4, background: problem?.disfuncionesIds.includes(d.id) ? '#dbeafe' : '#f8fafc', cursor: 'pointer' }}>
                                    <input type="checkbox" checked={problem?.disfuncionesIds.includes(d.id) || false} onChange={() => toggleDisfuncion(d.id)} />
                                    <span className={`q-badge q-${d.qualifier}`}>{d.qualifier}</span>
                                    <span className="text-sm">{d.categoriaLabel}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Step 2: Actividades */}
                    <div className="card">
                        <h3 className="card-title mb-3">2. Selecciona actividades limitadas (d)</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 8 }}>
                            {lastEval.actividadesLimitadas.map(a => (
                                <label key={a.id} className="flex items-center gap-2" style={{ padding: 6, borderRadius: 4, background: problem?.actividadesIds.includes(a.id) ? '#dbeafe' : '#f8fafc', cursor: 'pointer' }}>
                                    <input type="checkbox" checked={problem?.actividadesIds.includes(a.id) || false} onChange={() => toggleActividad(a.id)} />
                                    <span className={`q-badge q-${a.assessment.qualifier}`}>{a.assessment.qualifier}</span>
                                    <span className="text-sm">{a.label}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Step 3: Vincular roles a actividades */}
                    <div className="card">
                        <h3 className="card-title mb-3">3. Vincula roles a actividades</h3>
                        {(problem?.actividadesIds || []).map(actId => {
                            const act = lastEval.actividadesLimitadas.find(a => a.id === actId);
                            if (!act) return null;
                            return (
                                <div key={actId} className="mb-3" style={{ padding: 8, background: '#f8fafc', borderRadius: 6 }}>
                                    <strong className="text-sm">{act.label}</strong>
                                    <div className="chips mt-2">
                                        {lastEval.rolesRestringidos.map(r => (
                                            <span key={r.id}
                                                className={`chip removable ${(problem?.actividadRolesMap[actId] || []).includes(r.id) ? '' : 'chip-warning'}`}
                                                onClick={() => toggleRoleForActivity(actId, r.id)}
                                                style={{ display: 'flex', alignItems: 'center', gap: 4, opacity: (problem?.actividadRolesMap[actId] || []).includes(r.id) ? 1 : .5 }}>
                                                {(problem?.actividadRolesMap[actId] || []).includes(r.id) ? <Check size={14} /> : <Circle size={14} />} {r.label}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Step 4: Factores contextuales clave */}
                    <div className="card">
                        <h3 className="card-title mb-3">4. Factores contextuales clave (3-5)</h3>
                        <p className="text-sm text-muted mb-2">Selecciona los factores más relevantes:</p>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 8 }}>
                            {[...lastEval.factoresContextualesAmbientales, ...lastEval.factoresPersonales].map(f => (
                                <label key={f.id} className="flex items-center gap-2" style={{
                                    padding: 6, borderRadius: 4, cursor: 'pointer',
                                    background: problem?.factoresContextualesClaveIds.includes(f.id) ? (f.barreraFacilitador === 'BARRERA' ? '#fee2e2' : '#dcfce7') : '#f8fafc',
                                }}>
                                    <input type="checkbox" checked={problem?.factoresContextualesClaveIds.includes(f.id) || false} onChange={() => toggleContextFactor(f.id)} />
                                    <span className={`chip ${f.barreraFacilitador === 'BARRERA' ? 'chip-barrera' : 'chip-facilitador'}`} style={{ fontSize: '.7rem', display: 'flex', alignItems: 'center', gap: 4 }}>
                                        {f.barreraFacilitador === 'BARRERA' ? <ShieldAlert size={12} /> : <ShieldCheck size={12} />}
                                    </span>
                                    <span className="text-sm">{f.label}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                </>
            )}

            {/* Texto resumen */}
            <div className="card">
                <h3 className="card-title mb-3">Texto resumen del problema principal</h3>
                <textarea style={{ minHeight: 120 }}
                    value={problem?.textoResumen || ''}
                    onChange={e => problem && save({ ...problem, textoResumen: e.target.value })}
                    placeholder="Describe el problema principal integrando disfunciones, actividades, roles y factores contextuales…" />
            </div>
        </div>
    );
}
