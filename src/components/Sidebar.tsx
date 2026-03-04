import { NavLink, useLocation } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { Home, Users, FileText, BarChart2, Building, Puzzle, FileSignature, Target, TrendingUp, FileBarChart, Settings } from 'lucide-react';

const nav = [
    { to: '/', icon: <Home size={18} />, label: 'Inicio' },
    { section: 'Clínica' },
    { to: '/pacientes', icon: <Users size={18} />, label: 'Pacientes' },
    { to: '/episodios', icon: <FileText size={18} />, label: 'Episodios' },
    { to: '/evaluaciones', icon: <BarChart2 size={18} />, label: 'Evaluaciones' },
    { to: '/hogar', icon: <Building size={18} />, label: 'Hogar' },
    { section: 'Razonamiento' },
    { to: '/problema', icon: <Puzzle size={18} />, label: 'Problema Principal' },
    { to: '/diagnostico', icon: <FileSignature size={18} />, label: 'Diagnóstico Terapéutico' },
    { to: '/plan', icon: <Target size={18} />, label: 'Plan de Intervención' },
    { section: 'Análisis' },
    { to: '/dashboard', icon: <TrendingUp size={18} />, label: 'Dashboard' },
    { to: '/reportes', icon: <FileBarChart size={18} />, label: 'Reportes' },
    { section: 'Sistema' },
    { to: '/config', icon: <Settings size={18} />, label: 'Configuración' },
] as const;

export default function Sidebar() {
    const { settings } = useAppContext();
    const location = useLocation();

    return (
        <aside className="sidebar">
            <div className="sidebar-logo">
                <h1>RehAPP</h1>
                <span className={`mode-badge ${settings.modoApp.toLowerCase()}`}>
                    {settings.modoApp}
                </span>
            </div>

            <nav className="sidebar-nav">
                {nav.map((item, i) => {
                    if ('section' in item) {
                        return <div key={i} className="nav-section">{item.section}</div>;
                    }
                    return (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            className={({ isActive }) =>
                                isActive || (item.to !== '/' && location.pathname.startsWith(item.to)) ? 'active' : ''
                            }
                            end={item.to === '/'}
                        >
                            <span>{item.icon}</span>
                            {item.label}
                        </NavLink>
                    );
                })}
            </nav>

            <div className="sidebar-footer">
                RehAPP v1.0 — Neurorehabilitación
            </div>
        </aside>
    );
}
