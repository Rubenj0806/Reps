const nf = new Intl.NumberFormat('es-ES', { maximumFractionDigits: 1 });
const dayFmt = new Intl.DateTimeFormat('es-ES', { weekday: 'short', day: 'numeric', month: 'short' });
const shortFmt = new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'short' });
const monthFmt = new Intl.DateTimeFormat('es-ES', { month: 'long', year: 'numeric' });
const longFmt = new Intl.DateTimeFormat('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });

export const num = (n: number) => nf.format(n);

export function kg(n: number): string {
  return `${nf.format(n)} kg`;
}

/** 9612,5 kg → "9,6 t": a partir de una tonelada, para que las cifras quepan en el móvil. */
export function volume(n: number): string {
  return n >= 1000 ? `${nf.format(n / 1000)} t` : kg(n);
}

export const dayLabel = (iso: string | Date) => dayFmt.format(new Date(iso)).replace('.', '');
export const shortDate = (iso: string | Date) => shortFmt.format(new Date(iso)).replace('.', '');
export const longDate = (d: Date) => longFmt.format(d);
export function monthLabel(iso: string): string {
  const s = monthFmt.format(new Date(iso));
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function duration(min: number): string {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h} h ${m} min` : `${h} h`;
}

export function clock(totalSec: number): string {
  const s = Math.max(0, Math.round(totalSec));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = String(s % 60).padStart(2, '0');
  return h ? `${h}:${String(m).padStart(2, '0')}:${ss}` : `${m}:${ss}`;
}

/** "3 × 8 · 60 kg" o, si los pesos varían, "60–65 kg". */
export function setsSummary(sets: { weight: number; reps: number }[]): string {
  if (!sets.length) return '';
  const reps = new Set(sets.map((s) => s.reps));
  const weights = sets.map((s) => s.weight);
  const min = Math.min(...weights);
  const max = Math.max(...weights);
  const repsPart = reps.size === 1 ? `${sets.length} × ${sets[0].reps}` : `${sets.length} series`;
  if (max === 0) return repsPart;
  const w = min === max ? kg(max) : `${num(min)}–${kg(max)}`;
  return `${repsPart} · ${w}`;
}
