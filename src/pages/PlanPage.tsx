import { useState, useEffect } from 'react';
import { db } from '../db/database';
import { useAppContext } from '../context/AppContext';
import type { PlanIntervencion, ObjectiveSMART, Evaluation } from '../types';
import { uid, formatDate } from '../utils/helpers';
import { Target, Plus, Edit2, Trash2, Check, Circle, Save } from 'lucide-react';

const estadoColors: Record<string, string> = {
    NO_INICIADO: '#94a3b8', EN_PROGRESO: '#3b82f6', LOGRADO: '#10b981',
};

export default function PlanPage() {
    const { activeEpisodeId } = useAppContext();
    const [plan, setPlan] = useState<PlanIntervencion | null>(null);
    const [evals, setEvals] = useState<Evaluation[]>([]);
    const [showSmartForm, setShowSmartForm] = useState(false);
    const [editingSmart, setEditingSmart] = useState<ObjectiveSMART | null>(null);

    const load = async () => {
        if (!activeEpisodeId) return;
        const evs = await db.evaluations.where('episodeId').equals(activeEpisodeId).toArray();
        setEvals(evs.sort((a, b) => a.fecha.localeCompare(b.fecha)));

        let p = await db.planes.where('episodeId').equals(activeEpisodeId).first();
        if (!p) {
            p = { id: uid(), episodeId: activeEpisodeId, objetivoGeneral: '', objetivosSMART: [] };
            await db.planes.put(p);
        }
        setPlan(p);
    };

    useEffect(() => { load(); }, [activeEpisodeId]);

    const savePlan = async (p: PlanIntervencion) => {
        await db.planes.put(p);
        setPlan(p);
    };

    const blankSmart = (): ObjectiveSMART => ({
        id: uid(), episodeId: activeEpisodeId!,
        especifico: '', medible: '',
        alcanzableNivel: 'media', relevante: '',
        tiempo: '', estado: 'NO_INICIADO', evidenciaEvalIds: [],
    });

    const openNewSmart = () => {
        setEditingSmart(blankSmart());
        setShowSmartForm(true);
    };

    const openEditSmart = (s: ObjectiveSMART) => {
        setEditingSmart({ ...s });
        setShowSmartForm(true);
    };

    const saveSmart = () => {
        if (!plan || !editingSmart) return;
        const exists = plan.objetivosSMART.find(s => s.id === editingSmart.id);
        const updated = exists
            ? plan.objetivosSMART.map(s => s.id === editingSmart.id ? editingSmart : s)
            : [...plan.objetivosSMART, editingSmart];
        savePlan({ ...plan, objetivosSMART: updated });
        setShowSmartForm(false);
    };

    const removeSmart = (id: string) => {
        if (!plan) return;
        savePlan({ ...plan, objetivosSMART: plan.objetivosSMART.filter(s => s.id !== id) });
    };

    const updateSmartEstado = (id: string, estado: string) => {
        if (!plan) return;
        savePlan({
            ...plan,
            objetivosSMART: plan.objetivosSMART.map(s => s.id === id ? { ...s, estado: estado as ObjectiveSMART['estado'] } : s),
        });
    };

    if (!activeEpisodeId) {
        return (
            <div>
                <h1 className="page-title mb-4">Plan de Intervención</h1>
                <div className="card"><p className="text-muted">Selecciona un paciente y episodio primero.</p></div>
            </div>
        );
    }

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title flex items-center gap-2"><Target size={24} /> Plan de Intervención</h1>
                <button className="btn btn-primary" onClick={openNewSmart}><Plus size={16} /> Objetivo SMART</button>
            </div>

            {/* Objetivo general */}
            <div className="card">
                <h3 className="card-title mb-3">Objetivo General</h3>
                <textarea
                    value={plan?.objetivoGeneral || ''}
                    onChange={e => plan && savePlan({ ...plan, objetivoGeneral: e.target.value })}
                    placeholder="Ej: Mejorar independencia funcional en AVD básicas y movilidad domiciliaria segura, optimizando el entorno y maximizando facilitadores." />
            </div>

            {/* Stats */}
            {plan && plan.objetivosSMART.length > 0 && (
                <div className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-value" style={{ color: 'var(--primary)' }}>{plan.objetivosSMART.length}</div>
                        <div className="stat-label">Objetivos totales</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-value" style={{ color: estadoColors.LOGRADO }}>{plan.objetivosSMART.filter(s => s.estado === 'LOGRADO').length}</div>
                        <div className="stat-label">Logrados</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-value" style={{ color: estadoColors.EN_PROGRESO }}>{plan.objetivosSMART.filter(s => s.estado === 'EN_PROGRESO').length}</div>
                        <div className="stat-label">En progreso</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-value" style={{ color: estadoColors.NO_INICIADO }}>{plan.objetivosSMART.filter(s => s.estado === 'NO_INICIADO').length}</div>
                        <div className="stat-label">No iniciados</div>
                    </div>
                </div>
            )}

            {/* SMART list */}
            {plan?.objetivosSMART.map(s => (
                <div key={s.id} className="card" style={{ borderLeft: `4px solid ${estadoColors[s.estado]}` }}>
                    <div className="card-header">
                        <div>
                            <h3 className="card-title">{s.especifico || 'Sin definir'}</h3>
                            <div className="card-subtitle">
                                Meta: {s.tiempo ? formatDate(s.tiempo) : '—'} • Alcanzable: {s.alcanzableNivel}
                            </div>
                        </div>
                        <div className="flex gap-2 items-center">
                            <select value={s.estado} onChange={e => updateSmartEstado(s.id, e.target.value)}
                                style={{ padding: '4px 8px', borderRadius: 4, fontSize: '.8rem', fontWeight: 600, color: estadoColors[s.estado], background: estadoColors[s.estado] + '15', border: `1px solid ${estadoColors[s.estado]}` }}>
                                <option value="NO_INICIADO">No iniciado</option>
                                <option value="EN_PROGRESO">En progreso</option>
                                <option value="LOGRADO">Logrado</option>
                            </select>
                            <button className="btn btn-sm btn-ghost" onClick={() => openEditSmart(s)}><Edit2 size={14} /></button>
                            <button className="btn btn-sm btn-danger" onClick={() => removeSmart(s.id)}><Trash2 size={14} /></button>
                        </div>
                    </div>

                    <div className="grid-2 text-sm">
                        <div><strong>Medible:</strong> {s.medible || '—'}</div>
                        <div><strong>Relevante:</strong> {s.relevante || '—'}</div>
                    </div>
                    {s.evidenciaEvalIds.length > 0 && (
                        <div className="text-sm text-muted mt-2">
                            Evidencia: {s.evidenciaEvalIds.length} evaluación(es) vinculada(s)
                        </div>
                    )}
                </div>
            ))}

            {plan?.objetivosSMART.length === 0 && (
                <div className="empty-state">
                    <Target size={40} style={{ opacity: 0.5, marginBottom: 12 }} />
                    <h3>Sin objetivos SMART</h3>
                    <p>Define objetivos específicos, medibles, alcanzables, relevantes y con plazo.</p>
                </div>
            )}

            {/* SMART form modal */}
            {showSmartForm && editingSmart && (
                <div className="modal-overlay" onClick={() => setShowSmartForm(false)}>
                    <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
                        <h2>Objetivo SMART</h2>

                        <div className="form-group">
                            <label>Específico (¿Qué se va a lograr?)</label>
                            <textarea value={editingSmart.especifico} onChange={e => setEditingSmart({ ...editingSmart, especifico: e.target.value })}
                                placeholder="Ej: Mejorar transferencias sentado-bípedo con supervisión mínima" />
                        </div>

                        <div className="form-group">
                            <label>Medible (¿Cómo se mide el logro?)</label>
                            <textarea value={editingSmart.medible} onChange={e => setEditingSmart({ ...editingSmart, medible: e.target.value })}
                                placeholder="Ej: Qualifier de 3 a 1 en transferencias, o TUG < 15 seg" />
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Alcanzable</label>
                                <select value={editingSmart.alcanzableNivel} onChange={e => setEditingSmart({ ...editingSmart, alcanzableNivel: e.target.value as 'alta' | 'media' | 'baja' })}>
                                    <option value="alta">Alta probabilidad</option>
                                    <option value="media">Media probabilidad</option>
                                    <option value="baja">Baja probabilidad</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Nota alcanzable (opcional)</label>
                                <input type="text" value={editingSmart.alcanzableNota || ''} onChange={e => setEditingSmart({ ...editingSmart, alcanzableNota: e.target.value })} />
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Relevante (¿Por qué es importante?)</label>
                            <input type="text" value={editingSmart.relevante} onChange={e => setEditingSmart({ ...editingSmart, relevante: e.target.value })}
                                placeholder="Ej: Prerequisito para independencia en AVD" />
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Tiempo (fecha objetivo)</label>
                                <input type="date" value={editingSmart.tiempo} onChange={e => setEditingSmart({ ...editingSmart, tiempo: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label>Estado</label>
                                <select value={editingSmart.estado} onChange={e => setEditingSmart({ ...editingSmart, estado: e.target.value as ObjectiveSMART['estado'] })}>
                                    <option value="NO_INICIADO">No iniciado</option>
                                    <option value="EN_PROGRESO">En progreso</option>
                                    <option value="LOGRADO">Logrado</option>
                                </select>
                            </div>
                        </div>

                        {evals.length > 0 && (
                            <div className="form-group">
                                <label>Vincular evaluaciones como evidencia</label>
                                <div className="chips">
                                    {evals.map(ev => {
                                        const linked = editingSmart.evidenciaEvalIds.includes(ev.id);
                                        return (
                                            <span key={ev.id} className={`chip removable ${linked ? '' : 'chip-warning'}`}
                                                onClick={() => {
                                                    const ids = linked ? editingSmart.evidenciaEvalIds.filter(i => i !== ev.id) : [...editingSmart.evidenciaEvalIds, ev.id];
                                                    setEditingSmart({ ...editingSmart, evidenciaEvalIds: ids });
                                                }}
                                                style={{ display: 'flex', alignItems: 'center', gap: 4, opacity: linked ? 1 : .5 }}>
                                                {linked ? <Check size={14} /> : <Circle size={14} />} {ev.tipo} — {formatDate(ev.fecha)}
                                            </span>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        <div className="flex gap-2 mt-3" style={{ justifyContent: 'flex-end' }}>
                            <button className="btn btn-secondary" onClick={() => setShowSmartForm(false)}>Cancelar</button>
                            <button className="btn btn-primary" onClick={saveSmart}><Save size={16} /> Guardar</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
