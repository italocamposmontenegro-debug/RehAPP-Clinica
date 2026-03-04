import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useAppContext } from '../context/AppContext';
import { TriangleAlert } from 'lucide-react';

export default function Layout() {
    const { settings } = useAppContext();

    return (
        <div className="app-layout">
            <Sidebar />
            <div className="content-wrapper">
                {settings.modoApp === 'DEMO' && (
                    <div className="demo-banner" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                        <TriangleAlert size={16} /> MODO DEMO — Datos ficticios de demostración
                    </div>
                )}
                <main className="main-content">
                    <Outlet />
                </main>
                <footer className="app-footer">
                    RehAPP by Italo Campos
                </footer>
            </div>
        </div>
    );
}
