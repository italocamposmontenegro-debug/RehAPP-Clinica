import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../db/database';
import { useAppContext } from '../context/AppContext';
import type { Patient } from '../types';
import { uid, formatDate } from '../utils/helpers';
import { diagnosticosFrecuentes } from '../seeds/catalogs';
import { Users, Edit2, Trash2, Save } from 'lucide-react';

export default function PatientsPage() {
    const { settings, setActivePatient } = useAppContext();
    const nav = useNavigate();
    const [patients, setPatients] = useState<Patient[]>([]);
    const [showForm, setShowForm] = useState(false);
    const [editing, setEditing] = useState<Patient | null>(null);
    const [search, setSearch] = useState('');

    const load = async () => {
        const all = await db.patients.toArray();
        setPatients(all);
    };

    useEffect(() => { load(); }, []);

    const blank: Patient = {
        id: '', alias: '', diagnosticoPrincipal: '', diagnosticosSecundarios: [],
    };

    const [form, setForm] = useState<Patient>(blank);
    const [secDiag, setSecDiag] = useState('');

    const openNew = () => { setEditing(null); setForm({ ...blank, id: uid() }); setSecDiag(''); setShowForm(true); };
    const openEdit = (p: Patient) => { setEditing(p); setForm({ ...p }); setSecDiag(''); setShowForm(true); };

    const save = async () => {
        if (!form.alias.trim()) { alert('Ingresa al menos un alias.'); return; }
        await db.patients.put(form);
        setShowForm(false);
        load();
    };

    const remove = async (id: string) => {
        if (!window.confirm('¿Eliminar este paciente y todos sus datos asociados?')) return;
        await db.patients.delete(id);
        await db.episodes.where('patientId').equals(id).delete();
        const eps = await db.episodes.where('patientId').equals(id).toArray();
        for (const ep of eps) {
            await db.evaluations.where('episodeId').equals(ep.id).delete();
        }
        await db.hogarProfiles.where('patientId').equals(id).delete();
        load();
    };

    const selectPatient = (p: Patient) => {
        setActivePatient(p.id);
        nav('/episodios');
    };

    const addSecDiag = () => {
        if (secDiag.trim() && !form.diagnosticosSecundarios.includes(secDiag.trim())) {
            setForm({ ...form, diagnosticosSecundarios: [...form.diagnosticosSecundarios, secDiag.trim()] });
            setSecDiag('');
        }
    };

    const removeSecDiag = (d: string) => {
        setForm({ ...form, diagnosticosSecundarios: form.diagnosticosSecundarios.filter(x => x !== d) });
    };

    const filtered = patients.filter(p => {
        const q = search.toLowerCase();
        return p.alias.toLowerCase().includes(q) ||
            (p.nombreCompleto || '').toLowerCase().includes(q) ||
            p.diagnosticoPrincipal.toLowerCase().includes(q);
    });

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Pacientes</h1>
                </div>
                <button className="btn btn-primary" onClick={openNew}>+ Nuevo Paciente</button>
            </div>

            <div className="card" style={{ padding: 12, marginBottom: 16 }}>
                <input type="text" placeholder="Buscar por alias, nombre o diagnóstico…"
                    value={search} onChange={e => setSearch(e.target.value)} />
            </div>

            {filtered.length === 0 && !showForm ? (
                <div className="empty-state">
                    <Users size={40} style={{ opacity: 0.5, marginBottom: 12 }} />
                    <h3>Sin pacientes</h3>
                    <p>Crea tu primer paciente o activa el modo DEMO para ver datos de ejemplo.</p>
                </div>
            ) : (
                <div className="table-wrap">
                    <table>
                        <thead>
                            <tr>
                                <th>Alias</th>
                                {!settings.modoPrivacidad && <th>Nombre</th>}
                                <th>Diagnóstico principal</th>
                                <th>Fecha evento</th>
                                <th style={{ width: 160 }}>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(p => (
                                <tr key={p.id}>
                                    <td>
                                        <strong style={{ cursor: 'pointer', color: 'var(--primary)' }} onClick={() => selectPatient(p)}>
                                            {p.alias}
                                        </strong>
                                    </td>
                                    {!settings.modoPrivacidad && <td>{p.nombreCompleto || '—'}</td>}
                                    <td>{p.diagnosticoPrincipal || '—'}</td>
                                    <td>{formatDate(p.fechaEvento)}</td>
                                    <td>
                                        <div className="flex gap-2">
                                            <button className="btn btn-sm btn-ghost" onClick={() => selectPatient(p)}>Ver</button>
                                            <button className="btn btn-sm btn-secondary" onClick={() => openEdit(p)}><Edit2 size={14} /></button>
                                            <button className="btn btn-sm btn-danger" onClick={() => remove(p.id)}><Trash2 size={14} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {showForm && (
                <div className="modal-overlay" onClick={() => setShowForm(false)}>
                    <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
                        <h2>{editing ? 'Editar Paciente' : 'Nuevo Paciente'}</h2>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Alias (recomendado) *</label>
                                <input type="text" value={form.alias} onChange={e => setForm({ ...form, alias: e.target.value })}
                                    placeholder="Ej: M.R." />
                            </div>
                            <div className="form-group">
                                <label>Nombre completo (opcional)</label>
                                <input type="text" value={form.nombreCompleto || ''} onChange={e => setForm({ ...form, nombreCompleto: e.target.value })} />
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>RUN (opcional)</label>
                                <input type="text" value={form.runId || ''} onChange={e => setForm({ ...form, runId: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label>Fecha de nacimiento</label>
                                <input type="date" value={form.fechaNacimiento || ''} onChange={e => setForm({ ...form, fechaNacimiento: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label>Sexo</label>
                                <select value={form.sexo || ''} onChange={e => setForm({ ...form, sexo: e.target.value })}>
                                    <option value="">— Seleccionar —</option>
                                    <option value="Masculino">Masculino</option>
                                    <option value="Femenino">Femenino</option>
                                    <option value="Otro">Otro</option>
                                </select>
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Contacto</label>
                                <input type="text" value={form.contacto || ''} onChange={e => setForm({ ...form, contacto: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label>Dirección general</label>
                                <input type="text" value={form.direccionGeneral || ''} onChange={e => setForm({ ...form, direccionGeneral: e.target.value })} />
                            </div>
                        </div>

                        <h3 className="card-title mt-4 mb-2">Condición de Salud</h3>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Diagnóstico principal</label>
                                <select value={diagnosticosFrecuentes.includes(form.diagnosticoPrincipal) ? form.diagnosticoPrincipal : '__otro'}
                                    onChange={e => {
                                        if (e.target.value === '__otro') setForm({ ...form, diagnosticoPrincipal: '' });
                                        else setForm({ ...form, diagnosticoPrincipal: e.target.value });
                                    }}>
                                    <option value="">— Seleccionar —</option>
                                    {diagnosticosFrecuentes.map(d => <option key={d} value={d}>{d}</option>)}
                                    <option value="__otro">Otro (escribir)</option>
                                </select>
                                {!diagnosticosFrecuentes.includes(form.diagnosticoPrincipal) && form.diagnosticoPrincipal !== '' && (
                                    <input type="text" className="mt-2" value={form.diagnosticoPrincipal}
                                        onChange={e => setForm({ ...form, diagnosticoPrincipal: e.target.value })}
                                        placeholder="Especificar diagnóstico" />
                                )}
                            </div>
                            <div className="form-group">
                                <label>Fecha del evento</label>
                                <input type="date" value={form.fechaEvento || ''} onChange={e => setForm({ ...form, fechaEvento: e.target.value })} />
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Diagnósticos secundarios</label>
                            <div className="flex gap-2 mb-2">
                                <input type="text" value={secDiag} onChange={e => setSecDiag(e.target.value)}
                                    placeholder="Agregar diagnóstico secundario" onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSecDiag())} />
                                <button className="btn btn-sm btn-secondary" onClick={addSecDiag}>+</button>
                            </div>
                            <div className="chips">
                                {form.diagnosticosSecundarios.map(d => (
                                    <span key={d} className="chip removable" onClick={() => removeSecDiag(d)}>
                                        {d} <span className="chip-x">×</span>
                                    </span>
                                ))}
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Resumen clínico breve</label>
                            <textarea value={form.resumenClinicoBreve || ''} onChange={e => setForm({ ...form, resumenClinicoBreve: e.target.value })}
                                placeholder="Breve descripción clínica…" />
                        </div>

                        <div className="form-group">
                            <label>Notas</label>
                            <textarea value={form.notas || ''} onChange={e => setForm({ ...form, notas: e.target.value })} />
                        </div>

                        <div className="flex gap-2 mt-3" style={{ justifyContent: 'flex-end' }}>
                            <button className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancelar</button>
                            <button className="btn btn-primary" onClick={save}><Save size={16} /> Guardar</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
