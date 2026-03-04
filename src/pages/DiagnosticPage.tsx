import { useState, useEffect } from 'react';
import { db } from '../db/database';
import { useAppContext } from '../context/AppContext';
import type { DiagnosticoTerapeutico, Patient, ProblemaPrincipal } from '../types';
import { uid, formatDate } from '../utils/helpers';
import { FileSignature, Plus, Save, Trash2 } from 'lucide-react';

export default function DiagnosticPage() {
    const { activePatientId, activeEpisodeId, settings } = useAppContext();
    const [diagnostics, setDiagnostics] = useState<DiagnosticoTerapeutico[]>([]);
    const [patient, setPatient] = useState<Patient | null>(null);
    const [problem, setProblem] = useState<ProblemaPrincipal | null>(null);
    const [editing, setEditing] = useState<DiagnosticoTerapeutico | null>(null);

    const load = async () => {
        if (!activeEpisodeId || !activePatientId) return;
        const p = await db.patients.get(activePatientId);
        setPatient(p || null);
        const prob = await db.problemas.where('episodeId').equals(activeEpisodeId).first();
        setProblem(prob || null);
        const diags = await db.diagnosticos.where('episodeId').equals(activeEpisodeId).toArray();
        setDiagnostics(diags.sort((a, b) => b.fecha.localeCompare(a.fecha)));
    };

    useEffect(() => { load(); }, [activeEpisodeId, activePatientId]);

    const generateText = (): string => {
        if (!patient || !problem) return '';
        const ident = settings.modoPrivacidad ? patient.alias : (patient.nombreCompleto || patient.alias);
        return `Paciente ${ident}, diagnóstico principal: ${patient.diagnosticoPrincipal || 'no especificado'}${patient.fechaEvento ? ` (${patient.fechaEvento})` : ''}. ${patient.diagnosticosSecundarios.length > 0 ? `Diagnósticos secundarios: ${patient.diagnosticosSecundarios.join(', ')}. ` : ''}

Problema principal: ${problem.textoResumen || 'No definido.'}

Plan de rehabilitación orientado a mejorar la independencia funcional en actividades de la vida diaria y movilidad domiciliaria, considerando facilitadores y barreras del entorno.`;
    };

    const createDiagnostic = () => {
        const version = diagnostics.length + 1;
        const diag: DiagnosticoTerapeutico = {
            id: uid(),
            episodeId: activeEpisodeId!,
            fecha: new Date().toISOString().split('T')[0],
            pacienteIdentificacion: settings.modoPrivacidad ? (patient?.alias || '') : (patient?.nombreCompleto || patient?.alias || ''),
            condicionSalud: patient?.diagnosticoPrincipal || '',
            problemaPrincipalTexto: problem?.textoResumen || '',
            rolesRestringidosClave: [],
            factoresContextualesClave: [],
            textoGenerado: generateText(),
            version,
        };
        setEditing(diag);
    };

    const saveDiagnostic = async () => {
        if (!editing) return;
        await db.diagnosticos.put(editing);
        setEditing(null);
        load();
    };

    const deleteDiagnostic = async (id: string) => {
        if (!window.confirm('¿Eliminar esta versión del diagnóstico?')) return;
        await db.diagnosticos.delete(id);
        load();
    };

    if (!activeEpisodeId) {
        return (
            <div>
                <h1 className="page-title mb-4">Diagnóstico Terapéutico</h1>
                <div className="card"><p className="text-muted">Selecciona un paciente y episodio primero.</p></div>
            </div>
        );
    }

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title flex items-center gap-2"><FileSignature size={24} /> Diagnóstico Terapéutico</h1>
                <button className="btn btn-primary" onClick={createDiagnostic}><Plus size={16} /> Nueva versión</button>
            </div>

            {editing && (
                <div className="card" style={{ borderTop: '4px solid var(--accent)' }}>
                    <h3 className="card-title mb-3">Versión {editing.version} — {formatDate(editing.fecha)}</h3>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Fecha</label>
                            <input type="date" value={editing.fecha} onChange={e => setEditing({ ...editing, fecha: e.target.value })} />
                        </div>
                        <div className="form-group">
                            <label>Identificación paciente</label>
                            <input type="text" value={editing.pacienteIdentificacion} onChange={e => setEditing({ ...editing, pacienteIdentificacion: e.target.value })} />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Condición de salud</label>
                        <input type="text" value={editing.condicionSalud} onChange={e => setEditing({ ...editing, condicionSalud: e.target.value })} />
                    </div>

                    <div className="form-group">
                        <label>Texto del diagnóstico terapéutico</label>
                        <textarea style={{ minHeight: 200, fontFamily: 'inherit', lineHeight: 1.6 }}
                            value={editing.textoGenerado}
                            onChange={e => setEditing({ ...editing, textoGenerado: e.target.value })} />
                    </div>

                    <div className="flex gap-2" style={{ justifyContent: 'flex-end' }}>
                        <button className="btn btn-secondary" onClick={() => setEditing(null)}>Cancelar</button>
                        <button className="btn btn-primary" onClick={saveDiagnostic}><Save size={16} /> Guardar</button>
                    </div>
                </div>
            )}

            {diagnostics.length === 0 && !editing && (
                <div className="empty-state">
                    <FileSignature size={40} style={{ opacity: 0.5, marginBottom: 12 }} />
                    <h3>Sin diagnósticos</h3>
                    <p>Crea el problema principal primero, luego genera el diagnóstico terapéutico.</p>
                </div>
            )}

            {diagnostics.map(d => (
                <div key={d.id} className="card">
                    <div className="card-header">
                        <div>
                            <h3 className="card-title">Versión {d.version}</h3>
                            <div className="card-subtitle">{formatDate(d.fecha)}</div>
                        </div>
                        <div className="flex gap-2">
                            <button className="btn btn-sm btn-ghost" onClick={() => setEditing(d)}>Editar</button>
                            <button className="btn btn-sm btn-danger" onClick={() => deleteDiagnostic(d.id)}><Trash2 size={14} /></button>
                        </div>
                    </div>
                    <div style={{ whiteSpace: 'pre-wrap', fontSize: '.88rem', color: 'var(--text)', lineHeight: 1.6, background: '#f8fafc', padding: 16, borderRadius: 6 }}>
                        {d.textoGenerado}
                    </div>
                </div>
            ))}
        </div>
    );
}
