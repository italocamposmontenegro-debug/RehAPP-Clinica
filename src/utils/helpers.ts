export function uid(): string {
    return crypto.randomUUID();
}

export function formatDate(d: string | undefined): string {
    if (!d) return '—';
    try {
        return new Date(d + 'T00:00:00').toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch { return d; }
}

export function qualifierLabel(q: number): string {
    const map: Record<number, string> = {
        0: '0 — Sin problema',
        1: '1 — Problema ligero',
        2: '2 — Problema moderado',
        3: '3 — Problema grave',
        4: '4 — Problema completo',
        8: '8 — Sin especificar',
        9: '9 — No aplicable',
    };
    return map[q] ?? String(q);
}

export function qualifierShort(q: number): string {
    const map: Record<number, string> = { 0: 'q0', 1: 'q1', 2: 'q2', 3: 'q3', 4: 'q4', 8: 'q8', 9: 'q9' };
    return map[q] ?? `q${q}`;
}

export function qualifierColor(q: number): string {
    const map: Record<number, string> = {
        0: '#22c55e', 1: '#84cc16', 2: '#eab308', 3: '#f97316', 4: '#ef4444', 8: '#94a3b8', 9: '#cbd5e1',
    };
    return map[q] ?? '#94a3b8';
}

export function sistemaLabel(s: string): string {
    const map: Record<string, string> = {
        cognitivoConductual: 'Cognitivo-Conductual',
        sensorioperceptivo: 'Sensorioperceptivo',
        neuromuscular: 'Neuromuscular',
        musculoesqueletico: 'Musculoesquelético',
        cardiorrespiratorio: 'Cardiorrespiratorio',
        otros: 'Otros',
    };
    return map[s] || s;
}

export function domainLabel(d: string): string {
    const map: Record<string, string> = {
        b: 'Funciones Corporales (b)', s: 'Estructuras (s)', d: 'Actividades (d)',
        e: 'Amb. (e)', p: 'Personales (p)',
    };
    return map[d] || d;
}

export function tipoEvalBadge(t: string): { label: string; color: string } {
    switch (t) {
        case 'INGRESO': return { label: 'Ingreso', color: '#3b82f6' };
        case 'SEGUIMIENTO': return { label: 'Seguimiento', color: '#8b5cf6' };
        case 'ALTA': return { label: 'Alta', color: '#10b981' };
        default: return { label: t, color: '#64748b' };
    }
}

export function avgQualifier(items: { qualifier: number }[]): number {
    const valid = items.filter(i => i.qualifier !== 8 && i.qualifier !== 9);
    if (valid.length === 0) return 0;
    return valid.reduce((s, i) => s + i.qualifier, 0) / valid.length;
}
