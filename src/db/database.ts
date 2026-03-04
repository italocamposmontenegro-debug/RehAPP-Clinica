import Dexie, { type Table } from 'dexie';
import type {
    Patient, Episode, Evaluation, HogarProfile,
    ProblemaPrincipal, DiagnosticoTerapeutico, PlanIntervencion, AppSettings
} from '../types';

export class RehAppDB extends Dexie {
    patients!: Table<Patient, string>;
    episodes!: Table<Episode, string>;
    evaluations!: Table<Evaluation, string>;
    hogarProfiles!: Table<HogarProfile, string>;
    problemas!: Table<ProblemaPrincipal, string>;
    diagnosticos!: Table<DiagnosticoTerapeutico, string>;
    planes!: Table<PlanIntervencion, string>;
    settings!: Table<AppSettings, string>;
    catalogs!: Table<{ id: string; key: string; data: unknown }, string>;

    constructor() {
        super('RehAppDB');
        this.version(1).stores({
            patients: 'id',
            episodes: 'id, patientId',
            evaluations: 'id, episodeId',
            hogarProfiles: 'id, patientId',
            problemas: 'id, episodeId',
            diagnosticos: 'id, episodeId',
            planes: 'id, episodeId',
            settings: 'id',
            catalogs: 'id, key',
        });
    }
}

export const db = new RehAppDB();

// Ensure default settings exist
export async function ensureDefaults() {
    const s = await db.settings.get('app');
    if (!s) {
        await db.settings.put({ id: 'app', modoPrivacidad: false, modoApp: 'LOCAL' });
    }
}
