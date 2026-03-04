import { useState, useEffect } from 'react';
import { db } from '../db/database';
import { useAppContext } from '../context/AppContext';
import type { Evaluation, HogarProfile, PlanIntervencion } from '../types';
import { avgQualifier, formatDate } from '../utils/helpers';
import { sistemasDeficit } from '../seeds/catalogs';
import { TrendingUp, CheckCircle, RefreshCw, Circle } from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
    RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
    LineChart, Line, ResponsiveContainer,
} from 'recharts';

export default function DashboardPage() {
    const { activeEpisodeId, activePatientId } = useAppContext();
    const [evals, setEvals] = useState<Evaluation[]>([]);
    const [hogar, setHogar] = useState<HogarProfile | null>(null);
    const [plan, setPlan] = useState<PlanIntervencion | null>(null);
    const [tab, setTab] = useState<'domains' | 'systems' | 'activities' | 'roles' | 'hogar' | 'impact'>('domains');

    const load = async () => {
        if (!activeEpisodeId) return;
        const evs = await db.evaluations.where('episodeId').equals(activeEpisodeId).toArray();
        setEvals(evs.sort((a, b) => a.fecha.localeCompare(b.fecha)));
        const p = await db.planes.where('episodeId').equals(activeEpisodeId).first();
        setPlan(p || null);
        if (activePatientId) {
            const hp = await db.hogarProfiles.where('patientId').equals(activePatientId).first();
            setHogar(hp || null);
        }
    };

    useEffect(() => { load(); }, [activeEpisodeId, activePatientId]);

    if (!activeEpisodeId) {
        return (
            <div>
                <h1 className="page-title mb-4">Dashboard</h1>
                <div className="card"><p className="text-muted">Selecciona un paciente y episodio primero.</p></div>
            </div>
        );
    }

    if (evals.length === 0) {
        return (
            <div>
                <h1 className="page-title mb-4">Dashboard</h1>
                <div className="empty-state">
                    <TrendingUp size={40} style={{ opacity: 0.5, marginBottom: 12 }} />
                    <h3>Sin datos</h3>
                    <p>Crea evaluaciones para ver los gráficos.</p>
                </div>
            </div>
        );
    }

    // ── Data preparation ──
    // 1) Domain severity (radar)
    const domainData = evals.map(ev => {
        const bsAvg = avgQualifier(ev.deficitsPorSistema);
        const dAvg = avgQualifier(ev.actividadesLimitadas.map(a => a.assessment));
        const rolesAvg = avgQualifier(ev.rolesRestringidos.map(r => r.assessment));
        const eAvg = avgQualifier(ev.factoresContextualesAmbientales.map(f => ({ qualifier: f.impactoQualifier })));
        const pAvg = avgQualifier(ev.factoresPersonales.map(f => ({ qualifier: f.impactoQualifier })));
        return {
            name: `${ev.tipo.slice(0, 3)} ${formatDate(ev.fecha)}`,
            'Funciones (b/s)': +bsAvg.toFixed(1),
            'Actividades (d)': +dAvg.toFixed(1),
            'Roles': +rolesAvg.toFixed(1),
            'Ambiental (e)': +eAvg.toFixed(1),
            'Personal (p)': +pAvg.toFixed(1),
        };
    });

    // 2) System severity longitudinal
    const systemData = evals.map(ev => {
        const row: Record<string, string | number> = { name: `${ev.tipo.slice(0, 3)} ${formatDate(ev.fecha)}` };
        for (const sys of sistemasDeficit) {
            const items = ev.deficitsPorSistema.filter(d => d.sistema === sys.id);
            row[sys.label] = items.length > 0 ? +avgQualifier(items).toFixed(1) : 0;
        }
        return row;
    });

    // 3) Activities evolution
    const activityLabels = Array.from(new Set(evals.flatMap(ev => ev.actividadesLimitadas.map(a => a.label))));
    const activityData = evals.map(ev => {
        const row: Record<string, string | number> = { name: `${ev.tipo.slice(0, 3)} ${formatDate(ev.fecha)}` };
        for (const label of activityLabels) {
            const act = ev.actividadesLimitadas.find(a => a.label === label);
            row[label] = act ? act.assessment.qualifier : 0;
        }
        return row;
    });

    // 4) Roles evolution
    const roleLabels = Array.from(new Set(evals.flatMap(ev => ev.rolesRestringidos.map(r => r.label))));
    const roleData = evals.map(ev => {
        const row: Record<string, string | number> = { name: `${ev.tipo.slice(0, 3)} ${formatDate(ev.fecha)}` };
        for (const label of roleLabels) {
            const role = ev.rolesRestringidos.find(r => r.label === label);
            row[label] = role ? role.assessment.qualifier : 0;
        }
        return row;
    });

    // 5) Hogar heatmap data
    const hogarData = (hogar?.zonas || []).map(z => {
        const barreras = z.barrerasFacilitadores.filter(b => b.barreraFacilitador === 'BARRERA').length;
        const facilitadores = z.barrerasFacilitadores.filter(b => b.barreraFacilitador === 'FACILITADOR').length;
        return { name: z.zonaLabel, Barreras: barreras, Facilitadores: facilitadores };
    });

    // 6) Impact: ingreso vs last
    const first = evals[0];
    const last = evals[evals.length - 1];
    const impactData = first && last && first.id !== last.id ? [
        {
            domain: 'Funciones (b/s)',
            Ingreso: +avgQualifier(first.deficitsPorSistema).toFixed(1),
            Último: +avgQualifier(last.deficitsPorSistema).toFixed(1),
        },
        {
            domain: 'Actividades (d)',
            Ingreso: +avgQualifier(first.actividadesLimitadas.map(a => a.assessment)).toFixed(1),
            Último: +avgQualifier(last.actividadesLimitadas.map(a => a.assessment)).toFixed(1),
        },
        {
            domain: 'Roles',
            Ingreso: +avgQualifier(first.rolesRestringidos.map(r => r.assessment)).toFixed(1),
            Último: +avgQualifier(last.rolesRestringidos.map(r => r.assessment)).toFixed(1),
        },
    ] : [];

    const colors = ['#3b82f6', '#8b5cf6', '#f59e0b', '#10b981', '#ef4444', '#6366f1'];

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title flex items-center gap-2"><TrendingUp size={24} /> Dashboard</h1>
            </div>

            <div className="tabs">
                {([
                    ['domains', 'Dominios CIF'],
                    ['systems', 'Sistemas'],
                    ['activities', 'Actividades'],
                    ['roles', 'Roles'],
                    ['hogar', 'Hogar'],
                    ['impact', 'Impacto'],
                ] as const).map(([key, label]) => (
                    <button key={key} className={`tab-btn ${tab === key ? 'active' : ''}`} onClick={() => setTab(key)}>{label}</button>
                ))}
            </div>

            {/* 1) Domains radar */}
            {tab === 'domains' && (
                <div className="card">
                    <h3 className="card-title mb-3">Severidad por dominio CIF</h3>
                    <p className="text-sm text-muted mb-3">Promedio de qualifiers (excluye 8/9). Eje 0-4.</p>
                    <ResponsiveContainer width="100%" height={400}>
                        <RadarChart data={[
                            { domain: 'Funciones (b/s)', ...Object.fromEntries(domainData.map(d => [d.name, d['Funciones (b/s)']])) },
                            { domain: 'Actividades (d)', ...Object.fromEntries(domainData.map(d => [d.name, d['Actividades (d)']])) },
                            { domain: 'Roles', ...Object.fromEntries(domainData.map(d => [d.name, d['Roles']])) },
                            { domain: 'Ambiental (e)', ...Object.fromEntries(domainData.map(d => [d.name, d['Ambiental (e)']])) },
                            { domain: 'Personal (p)', ...Object.fromEntries(domainData.map(d => [d.name, d['Personal (p)']])) },
                        ]}>
                            <PolarGrid />
                            <PolarAngleAxis dataKey="domain" />
                            <PolarRadiusAxis domain={[0, 4]} />
                            {domainData.map((d, i) => (
                                <Radar key={d.name} name={d.name} dataKey={d.name} stroke={colors[i % colors.length]} fill={colors[i % colors.length]} fillOpacity={0.15} />
                            ))}
                            <Legend />
                            <Tooltip />
                        </RadarChart>
                    </ResponsiveContainer>
                </div>
            )}

            {/* 2) Systems longitudinal */}
            {tab === 'systems' && (
                <div className="card">
                    <h3 className="card-title mb-3">Severidad por sistema — Evolución longitudinal</h3>
                    <ResponsiveContainer width="100%" height={350}>
                        <LineChart data={systemData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis domain={[0, 4]} />
                            <Tooltip />
                            <Legend />
                            {sistemasDeficit.map((sys, i) => (
                                <Line key={sys.id} type="monotone" dataKey={sys.label} stroke={colors[i % colors.length]} strokeWidth={2} dot={{ r: 4 }} />
                            ))}
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            )}

            {/* 3) Activities */}
            {tab === 'activities' && (
                <div className="card">
                    <h3 className="card-title mb-3">Actividades — Evolución de qualifiers</h3>
                    <ResponsiveContainer width="100%" height={350}>
                        <LineChart data={activityData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis domain={[0, 4]} />
                            <Tooltip />
                            <Legend />
                            {activityLabels.map((label, i) => (
                                <Line key={label} type="monotone" dataKey={label} stroke={colors[i % colors.length]} strokeWidth={2} dot={{ r: 4 }} />
                            ))}
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            )}

            {/* 4) Roles */}
            {tab === 'roles' && (
                <div className="card">
                    <h3 className="card-title mb-3">Roles / Participación — Evolución</h3>
                    <ResponsiveContainer width="100%" height={350}>
                        <LineChart data={roleData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis domain={[0, 4]} />
                            <Tooltip />
                            <Legend />
                            {roleLabels.map((label, i) => (
                                <Line key={label} type="monotone" dataKey={label} stroke={colors[i % colors.length]} strokeWidth={2} dot={{ r: 4 }} />
                            ))}
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            )}

            {/* 5) Hogar heatmap */}
            {tab === 'hogar' && (
                <div className="card">
                    <h3 className="card-title mb-3">Hogar — Barreras vs Facilitadores por zona</h3>
                    {hogarData.length === 0 ? (
                        <p className="text-muted">No hay zonas del hogar registradas.</p>
                    ) : (
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={hogarData} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis type="number" />
                                <YAxis dataKey="name" type="category" width={120} />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="Barreras" fill="#ef4444" />
                                <Bar dataKey="Facilitadores" fill="#22c55e" />
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </div>
            )}

            {/* 6) Impact */}
            {tab === 'impact' && (
                <div className="card">
                    <h3 className="card-title mb-3">Impacto de intervención — Ingreso vs Última evaluación</h3>
                    {impactData.length === 0 ? (
                        <p className="text-muted">Se necesitan al menos 2 evaluaciones para comparar.</p>
                    ) : (
                        <>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={impactData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="domain" />
                                    <YAxis domain={[0, 4]} />
                                    <Tooltip />
                                    <Legend />
                                    <Bar dataKey="Ingreso" fill="#f97316" />
                                    <Bar dataKey="Último" fill="#3b82f6" />
                                </BarChart>
                            </ResponsiveContainer>

                            {/* SMART objectives status */}
                            {plan && plan.objetivosSMART.length > 0 && (
                                <div className="mt-4">
                                    <h4 className="card-title mb-2">Estado de objetivos SMART</h4>
                                    <div className="stats-grid">
                                        {plan.objetivosSMART.map(s => (
                                            <div key={s.id} className="stat-card" style={{ borderTop: `3px solid ${s.estado === 'LOGRADO' ? '#10b981' : s.estado === 'EN_PROGRESO' ? '#3b82f6' : '#94a3b8'}` }}>
                                                <div className="stat-label" style={{ fontWeight: 600, fontSize: '.82rem', marginBottom: 4 }}>{s.especifico.substring(0, 40)}{s.especifico.length > 40 ? '…' : ''}</div>
                                                <div className="stat-value" style={{ fontSize: '1rem', color: s.estado === 'LOGRADO' ? '#10b981' : s.estado === 'EN_PROGRESO' ? '#3b82f6' : '#94a3b8', display: 'flex', alignItems: 'center', gap: 4 }}>
                                                    {s.estado === 'LOGRADO' ? <><CheckCircle size={14} /> Logrado</> : s.estado === 'EN_PROGRESO' ? <><RefreshCw size={14} /> En progreso</> : <><Circle size={14} /> No iniciado</>}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
