import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../db/database';
import { useAppContext } from '../context/AppContext';
import type { Episode, Patient } from '../types';
import { uid, formatDate } from '../utils/helpers';
import { ClipboardList, Trash2, Plus } from 'lucide-react';

export default function EpisodesPage() {
    const { activePatientId, setActivePatient, setActiveEpisode } = useAppContext();
    const nav = useNavigate();
    const [patient, setPatient] = useState<Patient | null>(null);
    const [episodes, setEpisodes] = useState<Episode[]>([]);
    const [patients, setPatients] = useState<Patient[]>([]);

    const load = async () => {
        const allP = await db.patients.toArray();
        setPatients(allP);
        if (activePatientId) {
            const p = await db.patients.get(activePatientId);
            setPatient(p || null);
            const eps = await db.episodes.where('patientId').equals(activePatientId).toArray();
            setEpisodes(eps.sort((a, b) => b.fechaInicio.localeCompare(a.fechaInicio)));
        }
    };

    useEffect(() => { load(); }, [activePatientId]);

    const createEpisode = async () => {
        if (!activePatientId) return;
        const ep: Episode = {
            id: uid(), patientId: activePatientId,
            fechaInicio: new Date().toISOString().split('T')[0],
            estado: 'activo',
        };
        await db.episodes.put(ep);
        load();
    };

    const closeEpisode = async (ep: Episode) => {
        if (!window.confirm('¿Cerrar este episodio?')) return;
        await db.episodes.put({ ...ep, estado: 'cerrado', fechaAlta: new Date().toISOString().split('T')[0] });
        load();
    };

    const reopenEpisode = async (ep: Episode) => {
        await db.episodes.put({ ...ep, estado: 'activo', fechaAlta: undefined });
        load();
    };

    const deleteEpisode = async (id: string) => {
        if (!window.confirm('¿Eliminar este episodio y todas sus evaluaciones?')) return;
        await db.episodes.delete(id);
        await db.evaluations.where('episodeId').equals(id).delete();
        await db.problemas.where('episodeId').equals(id).delete();
        await db.diagnosticos.where('episodeId').equals(id).delete();
        await db.planes.where('episodeId').equals(id).delete();
        load();
    };

    const selectEpisode = (ep: Episode) => {
        setActiveEpisode(ep.id);
        nav('/evaluaciones');
    };

    if (!activePatientId) {
        return (
            <div>
                <h1 className="page-title mb-4">Episodios</h1>
                <div className="card">
                    <p className="text-sm text-muted mb-3">Selecciona un paciente primero:</p>
                    {patients.length === 0 ? (
                        <p className="text-muted">No hay pacientes. <span style={{ color: 'var(--primary)', cursor: 'pointer' }} onClick={() => nav('/pacientes')}>Crear uno</span>.</p>
                    ) : (
                        <div className="table-wrap">
                            <table>
                                <thead><tr><th>Alias</th><th>Diagnóstico</th><th></th></tr></thead>
                                <tbody>
                                    {patients.map(p => (
                                        <tr key={p.id}>
                                            <td><strong>{p.alias}</strong></td>
                                            <td>{p.diagnosticoPrincipal}</td>
                                            <td><button className="btn btn-sm btn-primary" onClick={() => setActivePatient(p.id)}>Seleccionar</button></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div>
            <div className="breadcrumb">
                <a href="#" onClick={(e) => { e.preventDefault(); nav('/pacientes'); }}>Pacientes</a> › {patient?.alias}
            </div>
            <div className="page-header">
                <div>
                    <h1 className="page-title">
                        Episodios de {patient?.alias}
                        <small>{patient?.diagnosticoPrincipal}</small>
                    </h1>
                </div>
                <button className="btn btn-primary" onClick={createEpisode}><Plus size={16} /> Nuevo Episodio</button>
            </div>

            {episodes.length === 0 ? (
                <div className="empty-state">
                    <ClipboardList size={40} style={{ opacity: 0.5, marginBottom: 12 }} />
                    <h3>Sin episodios</h3>
                    <p>Crea el primer episodio de rehabilitación para este paciente.</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
                    {episodes.map(ep => (
                        <div key={ep.id} className="card" style={{ borderLeft: `4px solid ${ep.estado === 'activo' ? 'var(--success)' : 'var(--text-light)'}` }}>
                            <div className="card-header">
                                <div>
                                    <div className="card-title">
                                        Episodio
                                        <span className="chip ml-2" style={{
                                            background: ep.estado === 'activo' ? '#dcfce7' : '#f1f5f9',
                                            color: ep.estado === 'activo' ? '#166534' : '#64748b',
                                            marginLeft: 8,
                                        }}>
                                            {ep.estado === 'activo' ? '● Activo' : '○ Cerrado'}
                                        </span>
                                    </div>
                                    <div className="card-subtitle">
                                        Inicio: {formatDate(ep.fechaInicio)}
                                        {ep.fechaAlta && ` — Alta: ${formatDate(ep.fechaAlta)}`}
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
                                <button className="btn btn-sm btn-primary" onClick={() => selectEpisode(ep)}>
                                    Evaluaciones
                                </button>
                                {ep.estado === 'activo' ? (
                                    <button className="btn btn-sm btn-secondary" onClick={() => closeEpisode(ep)}>Cerrar</button>
                                ) : (
                                    <button className="btn btn-sm btn-secondary" onClick={() => reopenEpisode(ep)}>Reabrir</button>
                                )}
                                <button className="btn btn-sm btn-danger" onClick={() => deleteEpisode(ep.id)}><Trash2 size={14} /></button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
