import { useState, useEffect } from 'react';
import { db } from '../db/database';
import { useAppContext } from '../context/AppContext';
import type { Patient, Episode, Evaluation, HogarProfile, ProblemaPrincipal, DiagnosticoTerapeutico, PlanIntervencion } from '../types';
import { formatDate, sistemaLabel } from '../utils/helpers';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { FileText, Table, Database, Eye, Download, Upload, CheckCircle, RefreshCw, Circle } from 'lucide-react';

export default function ReportsPage() {
    const { activePatientId, activeEpisodeId, settings } = useAppContext();
    const [patient, setPatient] = useState<Patient | null>(null);
    const [_episode, setEpisode] = useState<Episode | null>(null);
    const [evals, setEvals] = useState<Evaluation[]>([]);
    const [_hogar, setHogar] = useState<HogarProfile | null>(null);
    const [problem, setProblem] = useState<ProblemaPrincipal | null>(null);
    const [diagnostic, setDiagnostic] = useState<DiagnosticoTerapeutico | null>(null);
    const [plan, setPlan] = useState<PlanIntervencion | null>(null);

    const load = async () => {
        if (activePatientId) {
            const p = await db.patients.get(activePatientId);
            setPatient(p || null);
            const hp = await db.hogarProfiles.where('patientId').equals(activePatientId).first();
            setHogar(hp || null);
        }
        if (activeEpisodeId) {
            const ep = await db.episodes.get(activeEpisodeId);
            setEpisode(ep || null);
            const evs = await db.evaluations.where('episodeId').equals(activeEpisodeId).toArray();
            setEvals(evs.sort((a, b) => a.fecha.localeCompare(b.fecha)));
            const prob = await db.problemas.where('episodeId').equals(activeEpisodeId).first();
            setProblem(prob || null);
            const diag = await db.diagnosticos.where('episodeId').equals(activeEpisodeId).first();
            setDiagnostic(diag || null);
            const pl = await db.planes.where('episodeId').equals(activeEpisodeId).first();
            setPlan(pl || null);
        }
    };

    useEffect(() => { load(); }, [activePatientId, activeEpisodeId]);

    // ── PDF ──
    const exportPDF = () => {
        if (!patient) return;
        const doc = new jsPDF();
        const ident = settings.modoPrivacidad ? patient.alias : (patient.nombreCompleto || patient.alias);
        let y = 15;

        doc.setFontSize(18);
        doc.setTextColor(59, 130, 246);
        doc.text('RehAPP — Informe de Episodio', 14, y); y += 10;

        doc.setFontSize(10); doc.setTextColor(100);
        doc.text(`Generado: ${new Date().toLocaleDateString('es-CL')}`, 14, y); y += 8;

        // Patient info
        doc.setFontSize(13); doc.setTextColor(30);
        doc.text('Paciente', 14, y); y += 6;
        doc.setFontSize(10); doc.setTextColor(60);
        doc.text(`Identificación: ${ident}`, 14, y); y += 5;
        if (!settings.modoPrivacidad && patient.runId) { doc.text(`RUN: ${patient.runId}`, 14, y); y += 5; }
        doc.text(`Diagnóstico principal: ${patient.diagnosticoPrincipal}`, 14, y); y += 5;
        if (patient.diagnosticosSecundarios.length) { doc.text(`Secundarios: ${patient.diagnosticosSecundarios.join(', ')}`, 14, y); y += 5; }
        if (patient.fechaEvento) { doc.text(`Fecha evento: ${formatDate(patient.fechaEvento)}`, 14, y); y += 5; }
        y += 4;

        // Evaluations table
        for (const ev of evals) {
            if (y > 250) { doc.addPage(); y = 15; }
            doc.setFontSize(12); doc.setTextColor(30);
            doc.text(`Evaluación: ${ev.tipo} — ${formatDate(ev.fecha)}`, 14, y); y += 6;

            if (ev.deficitsPorSistema.length > 0) {
                autoTable(doc, {
                    startY: y,
                    head: [['Sistema', 'Ítem', 'Qualifier', 'Instrumento', 'Resultado']],
                    body: ev.deficitsPorSistema.map(d => [
                        sistemaLabel(d.sistema || ''), d.categoriaLabel, `q${d.qualifier}`, d.instrumento, d.resultadoValor,
                    ]),
                    styles: { fontSize: 8 },
                    headStyles: { fillColor: [59, 130, 246] },
                    margin: { left: 14 },
                });
                y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable?.finalY + 6 || y + 30;
            }

            if (ev.actividadesLimitadas.length > 0) {
                autoTable(doc, {
                    startY: y,
                    head: [['Actividad', 'Qualifier', 'Instrumento', 'Resultado']],
                    body: ev.actividadesLimitadas.map(a => [
                        a.label, `q${a.assessment.qualifier}`, a.assessment.instrumento, a.assessment.resultadoValor,
                    ]),
                    styles: { fontSize: 8 },
                    headStyles: { fillColor: [139, 92, 246] },
                    margin: { left: 14 },
                });
                y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable?.finalY + 6 || y + 30;
            }

            if (ev.rolesRestringidos.length > 0) {
                autoTable(doc, {
                    startY: y,
                    head: [['Rol', 'Qualifier', 'Resultado']],
                    body: ev.rolesRestringidos.map(r => [
                        r.label, `q${r.assessment.qualifier}`, r.assessment.resultadoValor,
                    ]),
                    styles: { fontSize: 8 },
                    headStyles: { fillColor: [16, 185, 129] },
                    margin: { left: 14 },
                });
                y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable?.finalY + 6 || y + 30;
            }
            y += 4;
        }

        // Problem principal
        if (problem?.textoResumen) {
            if (y > 240) { doc.addPage(); y = 15; }
            doc.setFontSize(12); doc.setTextColor(30);
            doc.text('Problema Principal', 14, y); y += 6;
            doc.setFontSize(9); doc.setTextColor(60);
            const lines = doc.splitTextToSize(problem.textoResumen, 180);
            doc.text(lines, 14, y);
            y += lines.length * 4.5 + 6;
        }

        // Diagnostic
        if (diagnostic?.textoGenerado) {
            if (y > 240) { doc.addPage(); y = 15; }
            doc.setFontSize(12); doc.setTextColor(30);
            doc.text('Diagnóstico Terapéutico', 14, y); y += 6;
            doc.setFontSize(9); doc.setTextColor(60);
            const lines = doc.splitTextToSize(diagnostic.textoGenerado, 180);
            doc.text(lines, 14, y);
            y += lines.length * 4.5 + 6;
        }

        // Plan
        if (plan) {
            if (y > 240) { doc.addPage(); y = 15; }
            doc.setFontSize(12); doc.setTextColor(30);
            doc.text('Plan de Intervención', 14, y); y += 6;
            if (plan.objetivoGeneral) {
                doc.setFontSize(9); doc.setTextColor(60);
                const lines = doc.splitTextToSize(`Objetivo general: ${plan.objetivoGeneral}`, 180);
                doc.text(lines, 14, y);
                y += lines.length * 4.5 + 4;
            }
            if (plan.objetivosSMART.length > 0) {
                autoTable(doc, {
                    startY: y,
                    head: [['Objetivo', 'Medible', 'Plazo', 'Estado']],
                    body: plan.objetivosSMART.map(s => [
                        s.especifico, s.medible, formatDate(s.tiempo),
                        s.estado === 'LOGRADO' ? '✓ Logrado' : s.estado === 'EN_PROGRESO' ? 'En progreso' : 'No iniciado',
                    ]),
                    styles: { fontSize: 8 },
                    headStyles: { fillColor: [245, 158, 11] },
                    margin: { left: 14 },
                });
            }
        }

        doc.save(`RehAPP_Informe_${ident.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
    };

    // ── CSV ──
    const exportCSV = () => {
        const rows: string[][] = [['Evaluación', 'Fecha', 'Dominio', 'Sistema', 'Label', 'Código CIF', 'Qualifier', 'Instrumento', 'Resultado', 'Zona']];

        for (const ev of evals) {
            for (const d of ev.deficitsPorSistema) {
                rows.push([ev.tipo, ev.fecha, 'b/s', d.sistema || '', d.categoriaLabel, d.codigoCIF || '', String(d.qualifier), d.instrumento, d.resultadoValor, '']);
            }
            for (const a of ev.actividadesLimitadas) {
                rows.push([ev.tipo, ev.fecha, 'd', '', a.label, a.codigoCIF || '', String(a.assessment.qualifier), a.assessment.instrumento, a.assessment.resultadoValor, '']);
            }
            for (const r of ev.rolesRestringidos) {
                rows.push([ev.tipo, ev.fecha, 'participación', '', r.label, r.codigoCIF || '', String(r.assessment.qualifier), r.assessment.instrumento, r.assessment.resultadoValor, '']);
            }
            for (const f of ev.factoresContextualesAmbientales) {
                rows.push([ev.tipo, ev.fecha, 'e', f.capituloAmbiental || '', f.label, f.codigoCIF || '', String(f.impactoQualifier), '', f.barreraFacilitador, '']);
            }
            for (const f of ev.factoresPersonales) {
                rows.push([ev.tipo, ev.fecha, 'p', '', f.label, '', String(f.impactoQualifier), '', f.barreraFacilitador, '']);
            }
        }

        const csv = rows.map(r => r.map(c => `"${c.replace(/"/g, '""')}"`).join(',')).join('\n');
        const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
        saveAs(blob, `RehAPP_datos_${new Date().toISOString().split('T')[0]}.csv`);
    };

    // ── JSON Backup ──
    const exportBackup = async () => {
        const data = {
            version: '1.0',
            exportDate: new Date().toISOString(),
            patients: await db.patients.toArray(),
            episodes: await db.episodes.toArray(),
            evaluations: await db.evaluations.toArray(),
            hogarProfiles: await db.hogarProfiles.toArray(),
            problemas: await db.problemas.toArray(),
            diagnosticos: await db.diagnosticos.toArray(),
            planes: await db.planes.toArray(),
            settings: await db.settings.toArray(),
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        saveAs(blob, `RehAPP_backup_${new Date().toISOString().split('T')[0]}.json`);
    };

    // ── JSON Restore ──
    const importBackup = async () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = async (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (!file) return;
            try {
                const text = await file.text();
                const data = JSON.parse(text);
                if (!data.version || !data.patients) { alert('Archivo no válido.'); return; }
                if (!window.confirm('¿Reemplazar TODOS los datos con los del backup? Esto eliminará los datos actuales.')) return;

                await Promise.all([
                    db.patients.clear(), db.episodes.clear(), db.evaluations.clear(),
                    db.hogarProfiles.clear(), db.problemas.clear(), db.diagnosticos.clear(), db.planes.clear(),
                ]);

                if (data.patients?.length) await db.patients.bulkPut(data.patients);
                if (data.episodes?.length) await db.episodes.bulkPut(data.episodes);
                if (data.evaluations?.length) await db.evaluations.bulkPut(data.evaluations);
                if (data.hogarProfiles?.length) await db.hogarProfiles.bulkPut(data.hogarProfiles);
                if (data.problemas?.length) await db.problemas.bulkPut(data.problemas);
                if (data.diagnosticos?.length) await db.diagnosticos.bulkPut(data.diagnosticos);
                if (data.planes?.length) await db.planes.bulkPut(data.planes);
                if (data.settings?.length) await db.settings.bulkPut(data.settings);

                alert('✅ Backup restaurado exitosamente.');
                load();
            } catch (err) {
                alert('Error al importar: ' + (err as Error).message);
            }
        };
        input.click();
    };

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title flex items-center gap-2"><FileText size={24} /> Reportes y Exportación</h1>
            </div>

            <div className="grid-3">
                <div className="card" style={{ borderTop: '4px solid var(--primary)' }}>
                    <h3 className="card-title mb-3 flex items-center gap-2"><FileText size={18} /> Informe PDF</h3>
                    <p className="text-sm text-muted mb-3">
                        Genera un informe completo del episodio: paciente, evaluaciones, problema principal, diagnóstico y plan.
                    </p>
                    <button className="btn btn-primary" onClick={exportPDF} disabled={!patient}>
                        Descargar PDF
                    </button>
                </div>

                <div className="card" style={{ borderTop: '4px solid var(--success)' }}>
                    <h3 className="card-title mb-3 flex items-center gap-2"><Table size={18} /> Exportar CSV</h3>
                    <p className="text-sm text-muted mb-3">
                        Exporta todos los ítems evaluados en formato CSV (compatible con Excel/Google Sheets).
                    </p>
                    <button className="btn btn-success" onClick={exportCSV} disabled={evals.length === 0}>
                        Descargar CSV
                    </button>
                </div>

                <div className="card" style={{ borderTop: '4px solid var(--accent)' }}>
                    <h3 className="card-title mb-3 flex items-center gap-2"><Database size={18} /> Backup JSON</h3>
                    <p className="text-sm text-muted mb-3">
                        Exporta todos los datos (pacientes, episodios, configuraciones) en un archivo JSON.
                    </p>
                    <div className="flex gap-2">
                        <button className="btn btn-accent flex items-center gap-2" onClick={exportBackup}><Download size={14} /> Exportar</button>
                        <button className="btn btn-secondary flex items-center gap-2" onClick={importBackup}><Upload size={14} /> Importar</button>
                    </div>
                </div>
            </div>

            {/* Preview */}
            {patient && (
                <div className="card mt-3">
                    <h3 className="card-title mb-3 flex items-center gap-2"><Eye size={18} /> Vista previa del informe</h3>
                    <div style={{ background: '#f8fafc', padding: 20, borderRadius: 8, fontSize: '.88rem', lineHeight: 1.7 }}>
                        <h4 style={{ color: 'var(--primary)' }}>RehAPP — Informe de Episodio</h4>
                        <p className="text-muted text-sm">Generado: {new Date().toLocaleDateString('es-CL')}</p>
                        <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '12px 0' }} />

                        <p><strong>Paciente:</strong> {settings.modoPrivacidad ? patient.alias : (patient.nombreCompleto || patient.alias)}</p>
                        <p><strong>Diagnóstico:</strong> {patient.diagnosticoPrincipal}</p>
                        {patient.fechaEvento && <p><strong>Fecha evento:</strong> {formatDate(patient.fechaEvento)}</p>}

                        <p className="mt-2"><strong>Evaluaciones:</strong> {evals.length} registrada(s)</p>
                        {evals.map(ev => (
                            <p key={ev.id} className="text-sm" style={{ paddingLeft: 12 }}>
                                • {ev.tipo} ({formatDate(ev.fecha)}): {ev.deficitsPorSistema.length} déficits, {ev.actividadesLimitadas.length} actividades, {ev.rolesRestringidos.length} roles
                            </p>
                        ))}

                        {problem?.textoResumen && (
                            <>
                                <p className="mt-2"><strong>Problema Principal:</strong></p>
                                <p className="text-sm" style={{ paddingLeft: 12 }}>{problem.textoResumen}</p>
                            </>
                        )}

                        {diagnostic?.textoGenerado && (
                            <>
                                <p className="mt-2"><strong>Diagnóstico Terapéutico (v{diagnostic.version}):</strong></p>
                                <p className="text-sm" style={{ paddingLeft: 12 }}>{diagnostic.textoGenerado.substring(0, 200)}…</p>
                            </>
                        )}

                        {plan && (
                            <>
                                <p className="mt-2"><strong>Plan:</strong> {plan.objetivosSMART.length} objetivo(s) SMART</p>
                                {plan.objetivosSMART.map(s => (
                                    <p key={s.id} className="text-sm flex items-center gap-2" style={{ paddingLeft: 12 }}>
                                        • {s.especifico} — {s.estado === 'LOGRADO' ? <CheckCircle size={12} /> : s.estado === 'EN_PROGRESO' ? <RefreshCw size={12} /> : <Circle size={12} />} {s.estado.replace('_', ' ').toLowerCase()}
                                    </p>
                                ))}
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
