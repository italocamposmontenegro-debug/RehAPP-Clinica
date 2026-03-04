import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../db/database';
import { useAppContext } from '../context/AppContext';
import type { HogarProfile, ZoneProfile, ContextFactor, HomeModification } from '../types';
import { uid } from '../utils/helpers';
import { Building, Trash2, ShieldAlert, ShieldCheck, X, Wrench } from 'lucide-react';
import { zonasHogar, barrerasFacilitadoresPorZona, ayudasTecnicas, modificacionesHogar } from '../seeds/catalogs';

export default function HogarPage() {
    const { activePatientId } = useAppContext();
    const nav = useNavigate();
    const [profile, setProfile] = useState<HogarProfile | null>(null);

    const load = async () => {
        // const allP = await db.patients.toArray(); // This line is no longer needed as patients state is removed
        // setPatients(allP.map(p => ({ id: p.id, alias: p.alias }))); // This line is no longer needed as patients state is removed
        if (!activePatientId) return;
        let hp = await db.hogarProfiles.where('patientId').equals(activePatientId).first();
        if (!hp) {
            hp = { id: uid(), patientId: activePatientId, zonas: [] };
            await db.hogarProfiles.put(hp);
        }
        setProfile(hp);
    };

    useEffect(() => { load(); }, [activePatientId]);

    const save = async (p: HogarProfile) => {
        await db.hogarProfiles.put(p);
        setProfile(p);
    };

    const addZone = (z: { id: string; label: string }) => {
        if (!profile) return;
        if (profile.zonas.find(zp => zp.zonaId === z.id)) return;
        const zone: ZoneProfile = { zonaId: z.id, zonaLabel: z.label, barrerasFacilitadores: [], ayudasTecnicas: [], modificaciones: [] };
        save({ ...profile, zonas: [...profile.zonas, zone] });
    };

    const removeZone = (zid: string) => {
        if (!profile) return;
        save({ ...profile, zonas: profile.zonas.filter(z => z.zonaId !== zid) });
    };

    const updateZone = (zid: string, patch: Partial<ZoneProfile>) => {
        if (!profile) return;
        save({ ...profile, zonas: profile.zonas.map(z => z.zonaId === zid ? { ...z, ...patch } : z) });
    };

    const addBarrera = (zid: string, label: string, bf: 'BARRERA' | 'FACILITADOR') => {
        if (!profile) return;
        const zone = profile.zonas.find(z => z.zonaId === zid);
        if (!zone) return;
        const cf: ContextFactor = { id: uid(), tipoFactor: 'AMBIENTAL', barreraFacilitador: bf, label, impactoQualifier: 1, links: {} };
        updateZone(zid, { barrerasFacilitadores: [...zone.barrerasFacilitadores, cf] });
    };

    const removeBarrera = (zid: string, cfId: string) => {
        if (!profile) return;
        const zone = profile.zonas.find(z => z.zonaId === zid);
        if (!zone) return;
        updateZone(zid, { barrerasFacilitadores: zone.barrerasFacilitadores.filter(b => b.id !== cfId) });
    };

    const addAyuda = (zid: string, label: string) => {
        if (!profile) return;
        const zone = profile.zonas.find(z => z.zonaId === zid);
        if (!zone || zone.ayudasTecnicas.includes(label)) return;
        updateZone(zid, { ayudasTecnicas: [...zone.ayudasTecnicas, label] });
    };

    const removeAyuda = (zid: string, label: string) => {
        if (!profile) return;
        const zone = profile.zonas.find(z => z.zonaId === zid);
        if (!zone) return;
        updateZone(zid, { ayudasTecnicas: zone.ayudasTecnicas.filter(a => a !== label) });
    };

    const addModificacion = (zid: string, label: string) => {
        if (!profile) return;
        const zone = profile.zonas.find(z => z.zonaId === zid);
        if (!zone) return;
        const mod: HomeModification = { id: uid(), label, estado: 'pendiente' };
        updateZone(zid, { modificaciones: [...zone.modificaciones, mod] });
    };

    const toggleModEstado = (zid: string, modId: string) => {
        if (!profile) return;
        const zone = profile.zonas.find(z => z.zonaId === zid);
        if (!zone) return;
        updateZone(zid, {
            modificaciones: zone.modificaciones.map(m => m.id === modId
                ? { ...m, estado: m.estado === 'pendiente' ? 'realizada' as const : 'pendiente' as const, fecha: m.estado === 'pendiente' ? new Date().toISOString().split('T')[0] : undefined }
                : m),
        });
    };

    const removeModificacion = (zid: string, modId: string) => {
        if (!profile) return;
        const zone = profile.zonas.find(z => z.zonaId === zid);
        if (!zone) return;
        updateZone(zid, { modificaciones: zone.modificaciones.filter(m => m.id !== modId) });
    };

    if (!activePatientId) {
        return (
            <div>
                <h1 className="page-title mb-4">Hogar</h1>
                <div className="card">
                    <p className="text-muted">Selecciona un paciente en la sección <a href="#" onClick={e => { e.preventDefault(); nav('/pacientes'); }}>Pacientes</a>.</p>
                </div>
            </div>
        );
    }

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title flex items-center gap-2"><Building size={24} /> Perfil del Hogar</h1>
                <select onChange={e => { const z = zonasHogar.find(zh => zh.id === e.target.value); if (z) addZone(z); e.target.value = ''; }} defaultValue="">
                    <option value="">+ Agregar zona…</option>
                    {zonasHogar.filter(z => !profile?.zonas.find(zp => zp.zonaId === z.id)).map(z => (
                        <option key={z.id} value={z.id}>{z.label}</option>
                    ))}
                </select>
            </div>

            {(!profile || profile.zonas.length === 0) && (
                <div className="empty-state">
                    <Building size={40} style={{ opacity: 0.5, marginBottom: 12 }} />
                    <h3>Sin zonas registradas</h3>
                    <p>Agrega zonas del hogar para registrar barreras, facilitadores, ayudas técnicas y modificaciones.</p>
                </div>
            )}

            {profile?.zonas.map(zone => (
                <div key={zone.zonaId} className="card">
                    <div className="card-header">
                        <h3 className="card-title">{zone.zonaLabel}</h3>
                        <button className="btn btn-sm btn-danger flex items-center gap-1" onClick={() => removeZone(zone.zonaId)}>
                            <Trash2 size={14} /> Quitar
                        </button>
                    </div>

                    {/* Barreras/Facilitadores */}
                    <div className="mb-3">
                        <div className="flex items-center justify-between mb-2">
                            <strong className="text-sm">Barreras / Facilitadores</strong>
                            <div className="flex gap-2">
                                <select onChange={e => { if (e.target.value) addBarrera(zone.zonaId, e.target.value, 'BARRERA'); e.target.value = ''; }} defaultValue="">
                                    <option value="">+ Barrera…</option>
                                    {(barrerasFacilitadoresPorZona[zone.zonaId] || []).map(b => <option key={b} value={b}>{b}</option>)}
                                </select>
                                <select onChange={e => { if (e.target.value) addBarrera(zone.zonaId, e.target.value, 'FACILITADOR'); e.target.value = ''; }} defaultValue="">
                                    <option value="">+ Facilitador…</option>
                                    {(barrerasFacilitadoresPorZona[zone.zonaId] || []).map(b => <option key={b} value={b}>{b}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="chips">
                            {zone.barrerasFacilitadores.map(bf => (
                                <span key={bf.id}
                                    className={`chip removable ${bf.barreraFacilitador === 'BARRERA' ? 'chip-barrera' : 'chip-facilitador'}`}
                                    onClick={() => removeBarrera(zone.zonaId, bf.id)}
                                    style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                    {bf.barreraFacilitador === 'BARRERA' ? <ShieldAlert size={14} /> : <ShieldCheck size={14} />}
                                    {bf.label}
                                    <X size={12} className="chip-x" />
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Ayudas técnicas */}
                    <div className="mb-3">
                        <div className="flex items-center justify-between mb-2">
                            <strong className="text-sm">Ayudas Técnicas</strong>
                            <select onChange={e => { if (e.target.value) addAyuda(zone.zonaId, e.target.value); e.target.value = ''; }} defaultValue="">
                                <option value="">+ Agregar…</option>
                                {ayudasTecnicas.map(a => <option key={a} value={a}>{a}</option>)}
                            </select>
                        </div>
                        <div className="chips">
                            {zone.ayudasTecnicas.map(a => (
                                <span key={a} className="chip removable" onClick={() => removeAyuda(zone.zonaId, a)} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                    <Wrench size={14} /> {a} <X size={12} className="chip-x" />
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Modificaciones */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <strong className="text-sm">Modificaciones al Hogar</strong>
                            <select onChange={e => { if (e.target.value) addModificacion(zone.zonaId, e.target.value); e.target.value = ''; }} defaultValue="">
                                <option value="">+ Agregar…</option>
                                {modificacionesHogar.map(m => <option key={m} value={m}>{m}</option>)}
                            </select>
                        </div>
                        {zone.modificaciones.map(mod => (
                            <div key={mod.id} className="flex items-center gap-2 mb-2" style={{ padding: 6, borderRadius: 4, background: mod.estado === 'realizada' ? '#f0fdf4' : '#fefce8' }}>
                                <input type="checkbox" checked={mod.estado === 'realizada'} onChange={() => toggleModEstado(zone.zonaId, mod.id)} />
                                <span className="text-sm" style={{ textDecoration: mod.estado === 'realizada' ? 'line-through' : 'none', flex: 1 }}>
                                    {mod.label} {mod.fecha && <span className="text-muted">({mod.fecha})</span>}
                                </span>
                                <button className="btn-icon" style={{ width: 24, height: 24 }} onClick={() => removeModificacion(zone.zonaId, mod.id)}><X size={12} /></button>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}
