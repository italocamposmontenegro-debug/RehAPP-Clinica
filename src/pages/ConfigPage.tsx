import { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { saveAs } from 'file-saver';
import * as seeds from '../seeds/catalogs';
import { Settings, Building2, Theater, Download, Globe, Shield, Info } from 'lucide-react';

export default function ConfigPage() {
    const { settings, togglePrivacidad, setModoApp } = useAppContext();
    const [tab, setTab] = useState<'general' | 'catalogs'>('general');

    const exportCatalogs = () => {
        const data = {
            zonasHogar: seeds.zonasHogar,
            barrerasFacilitadoresPorZona: seeds.barrerasFacilitadoresPorZona,
            ayudasTecnicas: seeds.ayudasTecnicas,
            modificacionesHogar: seeds.modificacionesHogar,
            sistemasDeficit: seeds.sistemasDeficit,
            itemsPorSistema: seeds.itemsPorSistema,
            actividadesD: seeds.actividadesD,
            rolesParticipacion: seeds.rolesParticipacion,
            factoresAmbientalesE: seeds.factoresAmbientalesE,
            factoresPersonalesP: seeds.factoresPersonalesP,
            instrumentosEvaluacion: seeds.instrumentosEvaluacion,
            diagnosticosFrecuentes: seeds.diagnosticosFrecuentes,
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        saveAs(blob, `RehAPP_catalogos_${new Date().toISOString().split('T')[0]}.json`);
    };

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title flex items-center gap-2"><Settings size={24} /> Configuración</h1>
            </div>

            <div className="tabs">
                <button className={`tab-btn ${tab === 'general' ? 'active' : ''} flex items-center gap-2`} onClick={() => setTab('general')}><Globe size={14} /> General</button>
                <button className={`tab-btn ${tab === 'catalogs' ? 'active' : ''} flex items-center gap-2`} onClick={() => setTab('catalogs')}><Settings size={14} /> Catálogos</button>
            </div>

            {tab === 'general' && (
                <div>
                    <div className="card">
                        <h3 className="card-title mb-3">Modo de la aplicación</h3>
                        <div className="flex gap-3">
                            <button className={`btn ${settings.modoApp === 'LOCAL' ? 'btn-primary' : 'btn-secondary'} flex items-center gap-2`}
                                onClick={() => setModoApp('LOCAL')}>
                                <Building2 size={16} /> Modo LOCAL
                            </button>
                            <button className={`btn ${settings.modoApp === 'DEMO' ? 'btn-accent' : 'btn-secondary'} flex items-center gap-2`}
                                onClick={async () => {
                                    const { loadDemoData } = await import('../db/demoData');
                                    await loadDemoData();
                                    setModoApp('DEMO');
                                }}>
                                <Theater size={16} /> Modo DEMO
                            </button>
                        </div>
                    </div>

                    <div className="card">
                        <h3 className="card-title mb-3 flex items-center gap-2"><Shield size={18} /> Privacidad</h3>
                        <label className="toggle">
                            <input type="checkbox" checked={settings.modoPrivacidad} onChange={togglePrivacidad} />
                            <span className="toggle-track"></span>
                            <span className="text-sm fw-600">
                                Modo privacidad {settings.modoPrivacidad ? 'ACTIVADO' : 'desactivado'}
                            </span>
                        </label>
                        <p className="text-sm text-muted mt-2">
                            Al activar, se muestra solo el alias en todas las pantallas y PDFs.
                            Se ocultan nombre completo, RUN y datos de contacto.
                        </p>
                    </div>

                    <div className="card">
                        <h3 className="card-title mb-3 flex items-center gap-2"><Info size={18} /> Información del sistema</h3>
                        <div className="text-sm">
                            <p><strong>Versión:</strong> RehAPP v1.0</p>
                            <p><strong>Almacenamiento:</strong> IndexedDB (local)</p>
                            <p><strong>Framework:</strong> React + TypeScript + Vite</p>
                            <p className="text-muted mt-2">Todos los datos se almacenan exclusivamente en tu navegador. No se envían datos a ningún servidor.</p>
                        </div>
                    </div>
                </div>
            )}

            {tab === 'catalogs' && (
                <div>
                    <div className="card">
                        <div className="card-header">
                            <h3 className="card-title">Catálogos clínicos</h3>
                            <button className="btn btn-accent btn-sm flex items-center gap-2" onClick={exportCatalogs}><Download size={14} /> Exportar catálogos JSON</button>
                        </div>
                        <p className="text-sm text-muted mb-4">
                            Los catálogos definen las opciones disponibles en los dropdowns de la aplicación.
                            Actualmente se gestionan desde código; la exportación permite respaldarlos.
                        </p>
                    </div>

                    {/* Catalog previews */}
                    {[
                        { title: 'Zonas del hogar', data: seeds.zonasHogar.map(z => z.label) },
                        { title: 'Ayudas técnicas', data: seeds.ayudasTecnicas },
                        { title: 'Sistemas de déficit', data: seeds.sistemasDeficit.map(s => s.label) },
                        { title: 'Actividades (d)', data: seeds.actividadesD.map(a => `${a.label} (${a.codigoCIF})`) },
                        { title: 'Roles / Participación', data: seeds.rolesParticipacion.map(r => `${r.label} (${r.codigoCIF})`) },
                        { title: 'Instrumentos de evaluación', data: seeds.instrumentosEvaluacion },
                        { title: 'Diagnósticos frecuentes', data: seeds.diagnosticosFrecuentes },
                        { title: 'Factores personales', data: seeds.factoresPersonalesP },
                    ].map(cat => (
                        <div key={cat.title} className="card">
                            <h4 className="card-title mb-2">{cat.title}</h4>
                            <div className="chips">
                                {cat.data.map(item => (
                                    <span key={item} className="chip">{item}</span>
                                ))}
                            </div>
                        </div>
                    ))}

                    {/* Items por sistema */}
                    <div className="card">
                        <h4 className="card-title mb-3">Ítems por sistema</h4>
                        {seeds.sistemasDeficit.map(sys => (
                            <div key={sys.id} className="mb-3">
                                <strong className="text-sm">{sys.label}</strong>
                                <div className="chips mt-1">
                                    {(seeds.itemsPorSistema[sys.id] || []).map(item => (
                                        <span key={item.label} className="chip">
                                            {item.label} {item.codigoCIF ? `(${item.codigoCIF})` : ''}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="card">
                        <h4 className="card-title mb-3">Factores ambientales (e)</h4>
                        {seeds.capitulosAmbientales.map(cap => (
                            <div key={cap.id} className="mb-3">
                                <strong className="text-sm">{cap.label}</strong>
                                <div className="chips mt-1">
                                    {seeds.factoresAmbientalesE.filter(f => f.capitulo === cap.id).map(f => (
                                        <span key={f.label} className="chip">{f.label} ({f.codigoCIF})</span>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="card">
                        <h4 className="card-title mb-3">Barreras/Facilitadores por zona</h4>
                        {seeds.zonasHogar.map(z => (
                            <div key={z.id} className="mb-3">
                                <strong className="text-sm">{z.label}</strong>
                                <div className="chips mt-1">
                                    {(seeds.barrerasFacilitadoresPorZona[z.id] || []).map(b => (
                                        <span key={b} className="chip">{b}</span>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
