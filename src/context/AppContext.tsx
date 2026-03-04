import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { db, ensureDefaults } from '../db/database';
import type { AppSettings } from '../types';

interface AppContextType {
    settings: AppSettings;
    activePatientId: string | null;
    activeEpisodeId: string | null;
    setActivePatient: (id: string | null) => void;
    setActiveEpisode: (id: string | null) => void;
    togglePrivacidad: () => void;
    setModoApp: (m: 'LOCAL' | 'DEMO') => void;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
    const [settings, setSettings] = useState<AppSettings>({
        id: 'app', modoPrivacidad: false, modoApp: 'LOCAL',
    });
    const [activePatientId, setActivePatientId] = useState<string | null>(null);
    const [activeEpisodeId, setActiveEpisodeId] = useState<string | null>(null);

    useEffect(() => {
        ensureDefaults().then(async () => {
            const s = await db.settings.get('app');
            if (s) setSettings(s);
        });
    }, []);

    const togglePrivacidad = async () => {
        const next = { ...settings, modoPrivacidad: !settings.modoPrivacidad };
        await db.settings.put(next);
        setSettings(next);
    };

    const setModoApp = async (m: 'LOCAL' | 'DEMO') => {
        const next = { ...settings, modoApp: m };
        await db.settings.put(next);
        setSettings(next);
    };

    return (
        <AppContext.Provider value={{
            settings,
            activePatientId,
            activeEpisodeId,
            setActivePatient: setActivePatientId,
            setActiveEpisode: setActiveEpisodeId,
            togglePrivacidad,
            setModoApp,
        }}>
            {children}
        </AppContext.Provider>
    );
}

export function useAppContext() {
    const ctx = useContext(AppContext);
    if (!ctx) throw new Error('useAppContext must be inside AppProvider');
    return ctx;
}
