import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../db/database';
import { useAppContext } from '../context/AppContext';
import type { Evaluation, CIFItemAssessment, ActivityItem, RoleItem, ContextFactor, Patient, Episode, TipoEvaluacion, Qualifier } from '../types';
import { uid, formatDate, qualifierLabel, tipoEvalBadge } from '../utils/helpers';
import { BarChart2, Copy, Trash2, Save, X, ArrowLeftRight, ShieldAlert, ShieldCheck, ChevronLeft, Plus } from 'lucide-react';
import { sistemasDeficit, itemsPorSistema, actividadesD, rolesParticipacion, factoresAmbientalesE, factoresPersonalesP, instrumentosEvaluacion, capitulosAmbientales } from '../seeds/catalogs';

function QSlider({ value, onChange }: { value: Qualifier; onChange: (v: Qualifier) => void }) {
    const vals: Qualifier[] = [0, 1, 2, 3, 4, 8, 9];
    return (
        <div className="qualifier-slider">
            <span className={`q-badge q-${value}`}>{value}</span>
            <input type="range" min={0} max={6} value={vals.indexOf(value)}
                onChange={e => onChange(vals[Number(e.target.value)])} />
            <span className="text-sm text-muted" style={{ minWidth: 140 }}>{qualifierLabel(value)}</span>
        </div>
    );
}

function makeBlankAssessment(dominio: 'b' | 's' | 'd' | 'e' | 'p', sistema?: string, label?: string, cif?: string): CIFItemAssessment {
    return {
        id: uid(), dominioCIF: dominio, sistema: (sistema as CIFItemAssessment['sistema']) || undefined,
        categoriaLabel: label || '', codigoCIF: cif, instrumento: 'Evaluación clínica',
        resultadoTipo: 'ordinal', resultadoValor: '', qualifier: 0,
        fecha: new Date().toISOString().split('T')[0],
    };
}

export default function EvaluationsPage() {
    const { activePatientId, activeEpisodeId, setActivePatient, setActiveEpisode } = useAppContext();
    const nav = useNavigate();
    const [patient, setPatient] = useState<Patient | null>(null);
    const [episode, setEpisode] = useState<Episode | null>(null);
    const [evals, setEvals] = useState<Evaluation[]>([]);
    const [patients, setPatients] = useState<Patient[]>([]);
    const [episodes, setEpisodes] = useState<Episode[]>([]);
    const [editing, setEditing] = useState<Evaluation | null>(null);
    const [tab, setTab] = useState<'deficits' | 'actividades' | 'roles' | 'ambiental' | 'personal'>('deficits');
    const [prevEval, setPrevEval] = useState<Evaluation | null>(null);

    const load = useCallback(async () => {
        const allP = await db.patients.toArray();
        setPatients(allP);
        if (activePatientId) {
            const p = await db.patients.get(activePatientId);
            setPatient(p || null);
            const eps = await db.episodes.where('patientId').equals(activePatientId).toArray();
            setEpisodes(eps);
        }
        if (activeEpisodeId) {
            const ep = await db.episodes.get(activeEpisodeId);
            setEpisode(ep || null);
            const evs = await db.evaluations.where('episodeId').equals(activeEpisodeId).toArray();
            setEvals(evs.sort((a, b) => a.fecha.localeCompare(b.fecha)));
        }
    }, [activePatientId, activeEpisodeId]);

    useEffect(() => { load(); }, [load]);

    const createEval = (tipo: TipoEvaluacion, duplicateFrom?: Evaluation) => {
        const base: Evaluation = duplicateFrom ? {
            ...JSON.parse(JSON.stringify(duplicateFrom)),
            id: uid(),
            tipo,
            fecha: new Date().toISOString().split('T')[0],
            origenDuplicadoDe: duplicateFrom.id,
        } : {
            id: uid(),
            episodeId: activeEpisodeId!,
            tipo,
            fecha: new Date().toISOString().split('T')[0],
            deficitsPorSistema: [],
            actividadesLimitadas: [],
            rolesRestringidos: [],
            factoresContextualesAmbientales: [],
            factoresPersonales: [],
        };
        if (!duplicateFrom) {
            base.episodeId = activeEpisodeId!;
        }

        // Find previous evaluation for diff
        if (evals.length > 0) {
            setPrevEval(evals[evals.length - 1]);
        }

        setEditing(base);
        setTab('deficits');
    };

    const saveEval = async () => {
        if (!editing) return;
        await db.evaluations.put(editing);
        setEditing(null);
        load();
    };

    const deleteEval = async (id: string) => {
        if (!window.confirm('¿Eliminar esta evaluación?')) return;
        await db.evaluations.delete(id);
        load();
    };

    // ── deficit handlers ──
    const addDeficit = (sistemaId: string, item: { label: string; codigoCIF?: string }) => {
        if (!editing) return;
        const exists = editing.deficitsPorSistema.find(d => d.categoriaLabel === item.label && d.sistema === sistemaId);
        if (exists) return;
        const a = makeBlankAssessment('b', sistemaId, item.label, item.codigoCIF);
        setEditing({ ...editing, deficitsPorSistema: [...editing.deficitsPorSistema, a] });
    };

    const updateDeficit = (id: string, patch: Partial<CIFItemAssessment>) => {
        if (!editing) return;
        setEditing({
            ...editing,
            deficitsPorSistema: editing.deficitsPorSistema.map(d => d.id === id ? { ...d, ...patch } : d),
        });
    };

    const removeDeficit = (id: string) => {
        if (!editing) return;
        setEditing({ ...editing, deficitsPorSistema: editing.deficitsPorSistema.filter(d => d.id !== id) });
    };

    // ── activity handlers ──
    const addActivity = (item: { label: string; codigoCIF?: string }) => {
        if (!editing) return;
        if (editing.actividadesLimitadas.find(a => a.label === item.label)) return;
        const act: ActivityItem = { id: uid(), label: item.label, codigoCIF: item.codigoCIF, assessment: makeBlankAssessment('d', undefined, item.label, item.codigoCIF) };
        setEditing({ ...editing, actividadesLimitadas: [...editing.actividadesLimitadas, act] });
    };

    const updateActivity = (id: string, patch: Partial<CIFItemAssessment>) => {
        if (!editing) return;
        setEditing({
            ...editing,
            actividadesLimitadas: editing.actividadesLimitadas.map(a => a.id === id ? { ...a, assessment: { ...a.assessment, ...patch } } : a),
        });
    };

    const removeActivity = (id: string) => {
        if (!editing) return;
        setEditing({ ...editing, actividadesLimitadas: editing.actividadesLimitadas.filter(a => a.id !== id) });
    };

    // ── role handlers ──
    const addRole = (item: { label: string; codigoCIF?: string }) => {
        if (!editing) return;
        if (editing.rolesRestringidos.find(r => r.label === item.label)) return;
        const role: RoleItem = { id: uid(), label: item.label, codigoCIF: item.codigoCIF, assessment: makeBlankAssessment('d', undefined, item.label, item.codigoCIF), linkedActivitiesIds: [], linkedContextFactorIds: [] };
        setEditing({ ...editing, rolesRestringidos: [...editing.rolesRestringidos, role] });
    };

    const updateRole = (id: string, patch: Partial<CIFItemAssessment>) => {
        if (!editing) return;
        setEditing({
            ...editing,
            rolesRestringidos: editing.rolesRestringidos.map(r => r.id === id ? { ...r, assessment: { ...r.assessment, ...patch } } : r),
        });
    };

    const removeRole = (id: string) => {
        if (!editing) return;
        setEditing({ ...editing, rolesRestringidos: editing.rolesRestringidos.filter(r => r.id !== id) });
    };

    // ── context factor (ambiental) handlers ──
    const addAmbientalFactor = (item: { capitulo: string; label: string; codigoCIF?: string }, bf: 'BARRERA' | 'FACILITADOR') => {
        if (!editing) return;
        const cf: ContextFactor = {
            id: uid(), tipoFactor: 'AMBIENTAL', barreraFacilitador: bf,
            capituloAmbiental: item.capitulo, label: item.label, codigoCIF: item.codigoCIF,
            impactoQualifier: 1, links: {},
        };
        setEditing({ ...editing, factoresContextualesAmbientales: [...editing.factoresContextualesAmbientales, cf] });
    };

    const updateAmbientalFactor = (id: string, patch: Partial<ContextFactor>) => {
        if (!editing) return;
        setEditing({
            ...editing,
            factoresContextualesAmbientales: editing.factoresContextualesAmbientales.map(f => f.id === id ? { ...f, ...patch } : f),
        });
    };

    const removeAmbientalFactor = (id: string) => {
        if (!editing) return;
        setEditing({ ...editing, factoresContextualesAmbientales: editing.factoresContextualesAmbientales.filter(f => f.id !== id) });
    };

    // ── personal factor handlers ──
    const addPersonalFactor = (label: string, bf: 'BARRERA' | 'FACILITADOR') => {
        if (!editing) return;
        const cf: ContextFactor = {
            id: uid(), tipoFactor: 'PERSONAL', barreraFacilitador: bf,
            label, impactoQualifier: 1, links: {},
        };
        setEditing({ ...editing, factoresPersonales: [...editing.factoresPersonales, cf] });
    };

    const updatePersonalFactor = (id: string, patch: Partial<ContextFactor>) => {
        if (!editing) return;
        setEditing({
            ...editing,
            factoresPersonales: editing.factoresPersonales.map(f => f.id === id ? { ...f, ...patch } : f),
        });
    };

    const removePersonalFactor = (id: string) => {
        if (!editing) return;
        setEditing({ ...editing, factoresPersonales: editing.factoresPersonales.filter(f => f.id !== id) });
    };

    // helper: diff class for a qualifier comparison
    const diffClass = (label: string, currentQ: number): string => {
        if (!prevEval) return '';
        const prevItem = prevEval.deficitsPorSistema.find(d => d.categoriaLabel === label) ||
            prevEval.actividadesLimitadas.find(a => a.label === label)?.assessment ||
            prevEval.rolesRestringidos.find(r => r.label === label)?.assessment;
        if (!prevItem) return '';
        const prevQ = 'qualifier' in prevItem ? (prevItem as CIFItemAssessment).qualifier : 0;
        if (currentQ < prevQ) return 'diff-improved';
        if (currentQ > prevQ) return 'diff-worsened';
        return 'diff-unchanged';
    };

    // ── No patient/episode fallback ──
    if (!activePatientId || !activeEpisodeId) {
        return (
            <div>
                <h1 className="page-title mb-4">Evaluaciones</h1>
                <div className="card">
                    <p className="text-sm text-muted mb-3">Selecciona un paciente y episodio:</p>
                    {patients.map(p => (
                        <div key={p.id} className="mb-3">
                            <strong style={{ cursor: 'pointer', color: 'var(--primary)' }}
                                onClick={() => { setActivePatient(p.id); }}>{p.alias}</strong>
                            {activePatientId === p.id && episodes.map(ep => (
                                <button key={ep.id} className="btn btn-sm btn-secondary ml-2" style={{ marginLeft: 8 }}
                                    onClick={() => setActiveEpisode(ep.id)}>
                                    Ep. {formatDate(ep.fechaInicio)} ({ep.estado})
                                </button>
                            ))}
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    // ── Eval list view ──
    if (!editing) {
        return (
            <div>
                <div className="breadcrumb">
                    <a href="#" onClick={e => { e.preventDefault(); nav('/pacientes'); }}>Pacientes</a> › {patient?.alias} ›{' '}
                    <a href="#" onClick={e => { e.preventDefault(); nav('/episodios'); }}>Episodios</a> › Ep. {formatDate(episode?.fechaInicio)}
                </div>
                <div className="page-header">
                    <div>
                        <h1 className="page-title">Evaluaciones</h1>
                    </div>
                    <div className="flex gap-2">
                        <button className="btn btn-primary" onClick={() => createEval(evals.length === 0 ? 'INGRESO' : 'SEGUIMIENTO')}>
                            <Plus size={16} /> Nueva {evals.length === 0 ? 'Ingreso' : 'Seguimiento'}
                        </button>
                        {evals.length > 0 && (
                            <>
                                <button className="btn btn-accent" onClick={() => createEval('SEGUIMIENTO', evals[evals.length - 1])}>
                                    <Copy size={16} /> Duplicar última
                                </button>
                                <button className="btn btn-success" onClick={() => createEval('ALTA')}>
                                    Alta
                                </button>
                            </>
                        )}
                    </div>
                </div>

                {evals.length === 0 ? (
                    <div className="empty-state">
                        <BarChart2 size={40} style={{ opacity: 0.5, marginBottom: 12 }} />
                        <h3>Sin evaluaciones</h3>
                        <p>Crea la evaluación de ingreso para comenzar.</p>
                    </div>
                ) : (
                    <div className="table-wrap">
                        <table>
                            <thead>
                                <tr>
                                    <th>Tipo</th><th>Fecha</th><th>Déficits</th><th>Actividades</th><th>Roles</th><th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {evals.map(ev => {
                                    const badge = tipoEvalBadge(ev.tipo);
                                    return (
                                        <tr key={ev.id}>
                                            <td>
                                                <span className="chip" style={{ background: badge.color + '20', color: badge.color }}>
                                                    {badge.label}
                                                </span>
                                                {ev.origenDuplicadoDe && <Copy size={14} className="text-muted" style={{ marginLeft: 4 }} />}
                                            </td>
                                            <td>{formatDate(ev.fecha)}</td>
                                            <td>{ev.deficitsPorSistema.length}</td>
                                            <td>{ev.actividadesLimitadas.length}</td>
                                            <td>{ev.rolesRestringidos.length}</td>
                                            <td>
                                                <div className="flex gap-2">
                                                    <button className="btn btn-sm btn-ghost" onClick={() => { setPrevEval(evals.find(e => e.fecha < ev.fecha) || null); setEditing(ev); }}>Editar</button>
                                                    <button className="btn btn-sm btn-danger" onClick={() => deleteEval(ev.id)}><Trash2 size={14} /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        );
    }

    // ── Eval editor ──
    const badge = tipoEvalBadge(editing.tipo);

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1 className="page-title">
                        <span className="chip" style={{ background: badge.color + '20', color: badge.color, marginRight: 8 }}>
                            {badge.label}
                        </span>
                        Evaluación — {patient?.alias}
                    </h1>
                </div>
                <div className="flex gap-2">
                    <button className="btn btn-secondary" onClick={() => setEditing(null)}><ChevronLeft size={16} /> Volver</button>
                    <button className="btn btn-primary" onClick={saveEval}><Save size={16} /> Guardar</button>
                </div>
            </div>

            <div className="form-row mb-3">
                <div className="form-group" style={{ maxWidth: 200 }}>
                    <label>Fecha</label>
                    <input type="date" value={editing.fecha} onChange={e => setEditing({ ...editing, fecha: e.target.value })} />
                </div>
                <div className="form-group" style={{ maxWidth: 200 }}>
                    <label>Tipo</label>
                    <select value={editing.tipo} onChange={e => setEditing({ ...editing, tipo: e.target.value as TipoEvaluacion })}>
                        <option value="INGRESO">Ingreso</option>
                        <option value="SEGUIMIENTO">Seguimiento</option>
                        <option value="ALTA">Alta</option>
                    </select>
                </div>
            </div>

            {editing.origenDuplicadoDe && (
                <div className="alert alert-info mb-3">
                    <Copy size={16} /> Esta evaluación fue duplicada de una anterior. Los cambios se resaltan con color.
                </div>
            )}

            <div className="tabs">
                {([
                    ['deficits', 'Déficits por Sistema (b/s)'],
                    ['actividades', 'Actividades (d)'],
                    ['roles', 'Roles/Participación'],
                    ['ambiental', 'Factores Ambientales (e)'],
                    ['personal', 'Factores Personales (p)'],
                ] as const).map(([key, label]) => (
                    <button key={key} className={`tab-btn ${tab === key ? 'active' : ''}`} onClick={() => setTab(key)}>
                        {label}
                        {key === 'deficits' && ` (${editing.deficitsPorSistema.length})`}
                        {key === 'actividades' && ` (${editing.actividadesLimitadas.length})`}
                        {key === 'roles' && ` (${editing.rolesRestringidos.length})`}
                        {key === 'ambiental' && ` (${editing.factoresContextualesAmbientales.length})`}
                        {key === 'personal' && ` (${editing.factoresPersonales.length})`}
                    </button>
                ))}
            </div>

            {/* ── TAB: Déficits por Sistema ── */}
            {tab === 'deficits' && (
                <div>
                    {sistemasDeficit.map(sys => (
                        <div key={sys.id} className="card">
                            <div className="card-header">
                                <h3 className="card-title">{sys.label}</h3>
                                <select onChange={e => {
                                    const item = itemsPorSistema[sys.id]?.find(i => i.label === e.target.value);
                                    if (item) addDeficit(sys.id, item);
                                    e.target.value = '';
                                }} defaultValue="">
                                    <option value="">+ Agregar ítem…</option>
                                    {itemsPorSistema[sys.id]?.map(it => (
                                        <option key={it.label} value={it.label}>{it.label} {it.codigoCIF ? `(${it.codigoCIF})` : ''}</option>
                                    ))}
                                </select>
                            </div>
                            {editing.deficitsPorSistema.filter(d => d.sistema === sys.id).map(d => (
                                <div key={d.id} className={`mb-3 ${diffClass(d.categoriaLabel, d.qualifier)}`} style={{ padding: 8, borderRadius: 6 }}>
                                    <div className="flex items-center justify-between gap-2 mb-2">
                                        <strong className="text-sm">{d.categoriaLabel} {d.codigoCIF ? <span className="text-muted">({d.codigoCIF})</span> : ''}</strong>
                                        <button className="btn-icon" onClick={() => removeDeficit(d.id)} title="Eliminar"><X size={14} /></button>
                                    </div>
                                    <QSlider value={d.qualifier} onChange={q => updateDeficit(d.id, { qualifier: q })} />
                                    <div className="form-row mt-2">
                                        <div className="form-group">
                                            <label>Instrumento</label>
                                            <select value={d.instrumento} onChange={e => updateDeficit(d.id, { instrumento: e.target.value })}>
                                                {instrumentosEvaluacion.map(i => <option key={i} value={i}>{i}</option>)}
                                            </select>
                                        </div>
                                        <div className="form-group">
                                            <label>Resultado</label>
                                            <input type="text" value={d.resultadoValor} onChange={e => updateDeficit(d.id, { resultadoValor: e.target.value })}
                                                placeholder="Ej: 28/56, Grado 3/5" />
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {editing.deficitsPorSistema.filter(d => d.sistema === sys.id).length === 0 && (
                                <p className="text-sm text-muted">Sin ítems evaluados en este sistema.</p>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* ── TAB: Actividades ── */}
            {tab === 'actividades' && (
                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title">Actividades limitadas (d)</h3>
                        <select onChange={e => {
                            const item = actividadesD.find(a => a.label === e.target.value);
                            if (item) addActivity(item);
                            e.target.value = '';
                        }} defaultValue="">
                            <option value="">+ Agregar actividad…</option>
                            {actividadesD.map(a => <option key={a.label} value={a.label}>{a.label} ({a.codigoCIF})</option>)}
                        </select>
                    </div>
                    {editing.actividadesLimitadas.map(act => (
                        <div key={act.id} className={`mb-3 ${diffClass(act.label, act.assessment.qualifier)}`} style={{ padding: 8, borderRadius: 6 }}>
                            <div className="flex items-center justify-between gap-2 mb-2">
                                <strong className="text-sm">{act.label} {act.codigoCIF ? <span className="text-muted">({act.codigoCIF})</span> : ''}</strong>
                                <button className="btn-icon" onClick={() => removeActivity(act.id)}><X size={14} /></button>
                            </div>
                            <QSlider value={act.assessment.qualifier} onChange={q => updateActivity(act.id, { qualifier: q })} />
                            <div className="form-row mt-2">
                                <div className="form-group">
                                    <label>Instrumento</label>
                                    <select value={act.assessment.instrumento} onChange={e => updateActivity(act.id, { instrumento: e.target.value })}>
                                        {instrumentosEvaluacion.map(i => <option key={i} value={i}>{i}</option>)}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Resultado</label>
                                    <input type="text" value={act.assessment.resultadoValor}
                                        onChange={e => updateActivity(act.id, { resultadoValor: e.target.value })} />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* ── TAB: Roles ── */}
            {tab === 'roles' && (
                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title">Roles / Participación</h3>
                        <select onChange={e => {
                            const item = rolesParticipacion.find(r => r.label === e.target.value);
                            if (item) addRole(item);
                            e.target.value = '';
                        }} defaultValue="">
                            <option value="">+ Agregar rol…</option>
                            {rolesParticipacion.map(r => <option key={r.label} value={r.label}>{r.label} ({r.codigoCIF})</option>)}
                        </select>
                    </div>
                    {editing.rolesRestringidos.map(role => (
                        <div key={role.id} className={`mb-3 ${diffClass(role.label, role.assessment.qualifier)}`} style={{ padding: 8, borderRadius: 6 }}>
                            <div className="flex items-center justify-between gap-2 mb-2">
                                <strong className="text-sm">{role.label} {role.codigoCIF ? <span className="text-muted">({role.codigoCIF})</span> : ''}</strong>
                                <button className="btn-icon" onClick={() => removeRole(role.id)}><X size={14} /></button>
                            </div>
                            <QSlider value={role.assessment.qualifier} onChange={q => updateRole(role.id, { qualifier: q })} />
                            <div className="form-row mt-2">
                                <div className="form-group">
                                    <label>Instrumento</label>
                                    <select value={role.assessment.instrumento} onChange={e => updateRole(role.id, { instrumento: e.target.value })}>
                                        {instrumentosEvaluacion.map(i => <option key={i} value={i}>{i}</option>)}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Resultado</label>
                                    <input type="text" value={role.assessment.resultadoValor}
                                        onChange={e => updateRole(role.id, { resultadoValor: e.target.value })} />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* ── TAB: Factores Ambientales ── */}
            {tab === 'ambiental' && (
                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title">Factores Ambientales (e)</h3>
                    </div>
                    <div className="form-row mb-3">
                        <div className="form-group">
                            <label>Agregar factor ambiental</label>
                            <select onChange={e => {
                                const item = factoresAmbientalesE.find(f => f.label === e.target.value);
                                if (item) addAmbientalFactor(item, 'BARRERA');
                                e.target.value = '';
                            }} defaultValue="">
                                <option value="">+ Elegir factor…</option>
                                {capitulosAmbientales.map(cap => (
                                    <optgroup key={cap.id} label={cap.label}>
                                        {factoresAmbientalesE.filter(f => f.capitulo === cap.id).map(f => (
                                            <option key={f.label} value={f.label}>{f.label}</option>
                                        ))}
                                    </optgroup>
                                ))}
                            </select>
                        </div>
                    </div>

                    {editing.factoresContextualesAmbientales.map(f => (
                        <div key={f.id} className="mb-3" style={{ padding: 8, borderRadius: 6, background: f.barreraFacilitador === 'BARRERA' ? '#fef2f2' : '#f0fdf4' }}>
                            <div className="flex items-center justify-between gap-2 mb-2">
                                <div>
                                    <span className={`chip ${f.barreraFacilitador === 'BARRERA' ? 'chip-barrera' : 'chip-facilitador'}`} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                        {f.barreraFacilitador === 'BARRERA' ? <ShieldAlert size={14} /> : <ShieldCheck size={14} />}
                                        {f.barreraFacilitador === 'BARRERA' ? 'Barrera' : 'Facilitador'}
                                    </span>
                                    <strong className="text-sm" style={{ marginLeft: 8 }}>{f.label}</strong>
                                    {f.codigoCIF && <span className="text-muted text-sm"> ({f.codigoCIF})</span>}
                                </div>
                                <div className="flex gap-2">
                                    <button className="btn btn-sm btn-secondary" onClick={() => updateAmbientalFactor(f.id, {
                                        barreraFacilitador: f.barreraFacilitador === 'BARRERA' ? 'FACILITADOR' : 'BARRERA',
                                    })}>
                                        <ArrowLeftRight size={14} />
                                    </button>
                                    <button className="btn-icon" onClick={() => removeAmbientalFactor(f.id)}><X size={14} /></button>
                                </div>
                            </div>
                            <QSlider value={f.impactoQualifier} onChange={q => updateAmbientalFactor(f.id, { impactoQualifier: q })} />
                            <div className="form-group mt-2">
                                <input type="text" placeholder="Notas…" value={f.notas || ''}
                                    onChange={e => updateAmbientalFactor(f.id, { notas: e.target.value })} />
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* ── TAB: Factores Personales ── */}
            {tab === 'personal' && (
                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title">Factores Personales (p)</h3>
                    </div>
                    <div className="form-row mb-3">
                        <div className="form-group">
                            <label>Agregar factor personal</label>
                            <select onChange={e => {
                                if (e.target.value) addPersonalFactor(e.target.value, 'FACILITADOR');
                                e.target.value = '';
                            }} defaultValue="">
                                <option value="">+ Elegir factor…</option>
                                {factoresPersonalesP.map(fp => <option key={fp} value={fp}>{fp}</option>)}
                            </select>
                        </div>
                    </div>

                    {editing.factoresPersonales.map(f => (
                        <div key={f.id} className="mb-3" style={{ padding: 8, borderRadius: 6, background: f.barreraFacilitador === 'BARRERA' ? '#fef2f2' : '#f0fdf4' }}>
                            <div className="flex items-center justify-between gap-2 mb-2">
                                <div>
                                    <span className={`chip ${f.barreraFacilitador === 'BARRERA' ? 'chip-barrera' : 'chip-facilitador'}`}>
                                        {f.barreraFacilitador === 'BARRERA' ? '⛔ Barrera' : '✅ Facilitador'}
                                    </span>
                                    <strong className="text-sm" style={{ marginLeft: 8 }}>{f.label}</strong>
                                </div>
                                <div className="flex gap-2">
                                    <button className="btn btn-sm btn-secondary" onClick={() => updatePersonalFactor(f.id, {
                                        barreraFacilitador: f.barreraFacilitador === 'BARRERA' ? 'FACILITADOR' : 'BARRERA',
                                    })}>
                                        <ArrowLeftRight size={14} />
                                    </button>
                                    <button className="btn-icon" onClick={() => removePersonalFactor(f.id)}><X size={14} /></button>
                                </div>
                            </div>
                            <QSlider value={f.impactoQualifier} onChange={q => updatePersonalFactor(f.id, { impactoQualifier: q })} />
                            <div className="form-group mt-2">
                                <input type="text" placeholder="Notas…" value={f.notas || ''}
                                    onChange={e => updatePersonalFactor(f.id, { notas: e.target.value })} />
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* notas breves */}
            <div className="card mt-3">
                <div className="form-group">
                    <label>Notas breves</label>
                    <textarea value={editing.notasBreves || ''} onChange={e => setEditing({ ...editing, notasBreves: e.target.value })}
                        placeholder="Observaciones generales de la evaluación…" />
                </div>
                <div className="flex gap-2" style={{ justifyContent: 'flex-end' }}>
                    <button className="btn btn-secondary" onClick={() => setEditing(null)}>Cancelar</button>
                    <button className="btn btn-primary" onClick={saveEval}><Save size={16} /> Guardar evaluación</button>
                </div>
            </div>
        </div>
    );
}
