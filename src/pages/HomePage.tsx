import { useAppContext } from '../context/AppContext';
import { loadDemoData, clearAllData } from '../db/demoData';
import { Building2, Theater, Lock, AlertTriangle, Trash2, Info } from 'lucide-react';

export default function HomePage() {
    const { settings, setModoApp, togglePrivacidad } = useAppContext();

    const handleDemo = async () => {
        await loadDemoData();
        setModoApp('DEMO');
    };

    const handleLocal = async () => {
        setModoApp('LOCAL');
    };

    const handleClearAll = async () => {
        if (window.confirm('¿Estás seguro/a de que deseas BORRAR TODOS los datos locales? Esta acción no se puede deshacer.')) {
            if (window.confirm('CONFIRMACIÓN FINAL: Se eliminarán todos los pacientes, episodios, evaluaciones y configuraciones. ¿Continuar?')) {
                await clearAllData();
                window.location.reload();
            }
        }
    };

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1 className="page-title">
                        Bienvenido/a a RehAPP
                        <small>Neurorehabilitación Adulto Domiciliaria — CIF</small>
                    </h1>
                </div>
            </div>

            <div className="grid-2">
                <div className="card" style={{ borderTop: '4px solid var(--primary)' }}>
                    <h3 className="card-title flex items-center gap-2" style={{ marginBottom: 12 }}>
                        <Building2 size={20} /> Modo LOCAL
                    </h3>
                    <p className="text-sm text-muted mb-3">
                        Trabaja con datos reales de pacientes. Todo se guarda en tu equipo mediante IndexedDB.
                        Nada sale de tu navegador.
                    </p>
                    <button className="btn btn-primary" onClick={handleLocal}
                        style={settings.modoApp === 'LOCAL' ? { opacity: .6 } : {}}>
                        {settings.modoApp === 'LOCAL' ? '✓ Modo actual' : 'Activar modo LOCAL'}
                    </button>
                </div>

                <div className="card" style={{ borderTop: '4px solid var(--warning)' }}>
                    <h3 className="card-title flex items-center gap-2" style={{ marginBottom: 12 }}>
                        <Theater size={20} /> Modo DEMO
                    </h3>
                    <p className="text-sm text-muted mb-3">
                        Carga datos ficticios para explorar la app. Ideal para demostrar funcionalidades sin
                        datos reales.
                    </p>
                    <button className="btn btn-accent" onClick={handleDemo}
                        style={settings.modoApp === 'DEMO' ? { opacity: .6 } : {}}>
                        {settings.modoApp === 'DEMO' ? '✓ Modo actual' : 'Activar modo DEMO'}
                    </button>
                </div>
            </div>

            <div className="card">
                <h3 className="card-title mb-3 flex items-center gap-2"><Lock size={20} /> Privacidad</h3>
                <label className="toggle">
                    <input type="checkbox" checked={settings.modoPrivacidad} onChange={togglePrivacidad} />
                    <span className="toggle-track"></span>
                    <span className="text-sm">
                        Modo privacidad {settings.modoPrivacidad ? 'activado' : 'desactivado'}
                        <span className="text-muted" style={{ display: 'block', fontSize: '.78rem' }}>
                            {settings.modoPrivacidad
                                ? 'Se muestra solo alias, se ocultan nombre, RUN y contacto'
                                : 'Se muestran todos los datos del paciente'}
                        </span>
                    </span>
                </label>
            </div>

            <div className="card" style={{ borderLeft: '4px solid var(--danger)' }}>
                <h3 className="card-title mb-3 flex items-center gap-2"><AlertTriangle size={20} /> Gestión de datos</h3>
                <p className="text-sm text-muted mb-3">
                    Elimina todos los datos locales (pacientes, episodios, evaluaciones, configuraciones).
                </p>
                <button className="btn btn-danger btn-sm" onClick={handleClearAll}>
                    <Trash2 size={16} /> Borrar todos los datos locales
                </button>
            </div>

            <div className="card" style={{ marginTop: 12 }}>
                <h3 className="card-title mb-3 flex items-center gap-2"><Info size={20} /> Acerca de</h3>
                <p className="text-sm text-muted">
                    <strong>RehAPP v1.0</strong> — App local-first para kinesiología en neurorehabilitación domiciliaria.<br />
                    Modelo CIF (b/s/d/e/p) • Evaluaciones longitudinales • Diagnóstico terapéutico • Objetivos SMART<br />
                    Sin backend • Sin nube • Sin autenticación • Todo en tu equipo.
                </p>
            </div>
        </div>
    );
}
