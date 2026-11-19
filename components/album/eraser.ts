import type { Point, Stroke } from './types';

/** Espacement (en px de page) des points ajoutés autour de la gomme pour une coupe nette. */
const STEP = 1.5;

const round = (n: number) => Math.round(n * 10) / 10;

/** Rayon de la gomme (en px de page) : un peu plus grand au doigt. */
export const eraserRadius = (touch: boolean) => (touch ? 16 : 12);

/** Distance d'un point c au segment [a, b]. */
function segDist(c: Point, a: Point, b: Point): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len2 = dx * dx + dy * dy;
  const t = len2 ? Math.max(0, Math.min(1, ((c.x - a.x) * dx + (c.y - a.y) * dy) / len2)) : 0;
  return Math.hypot(c.x - (a.x + t * dx), c.y - (a.y + t * dy));
}

function hits(st: Stroke, c: Point, r: number): boolean {
  if (st.pts.length === 1) return Math.hypot(st.pts[0].x - c.x, st.pts[0].y - c.y) < r;
  for (let i = 0; i < st.pts.length - 1; i++) if (segDist(c, st.pts[i], st.pts[i + 1]) < r) return true;
  return false;
}

/**
 * Efface l'encre sous un disque de rayon `radius` centré en `c`.
 * Seule la partie touchée disparaît : un trait coupé au milieu devient deux traits.
 * Renvoie null si rien n'a été touché.
 */
function eraseDisc(strokes: Stroke[], c: Point, radius: number, newId: () => string): Stroke[] | null {
  let changed = false;
  const out: Stroke[] = [];

  for (const st of strokes) {
    // Le rayon tient compte de l'épaisseur : l'encre restante s'arrête au bord de la gomme.
    const r = radius + st.size / 2;
    if (!hits(st, c, r)) {
      out.push(st);
      continue;
    }
    changed = true;

    // Densifie uniquement les segments proches de la gomme, pour couper au bon endroit.
    const dense: Point[] = [];
    st.pts.forEach((a, i) => {
      dense.push(a);
      const b = st.pts[i + 1];
      if (!b) return;
      const len = Math.hypot(b.x - a.x, b.y - a.y);
      if (len <= STEP || segDist(c, a, b) >= r + STEP) return;
      const n = Math.ceil(len / STEP);
      for (let k = 1; k < n; k++) dense.push({ x: round(a.x + ((b.x - a.x) * k) / n), y: round(a.y + ((b.y - a.y) * k) / n) });
    });

    // Retire les points sous la gomme et garde les morceaux restants.
    let run: Point[] = [];
    const flush = () => {
      if (run.length >= 2) out.push({ id: newId(), color: st.color, size: st.size, pts: run });
      run = [];
    };
    for (const p of dense) {
      if (Math.hypot(p.x - c.x, p.y - c.y) < r) flush();
      else run.push(p);
    }
    flush();
  }

  return changed ? out : null;
}

/**
 * Passe la gomme le long du trajet `from` → `to` (échantillonné pour ne rien sauter
 * quand le doigt ou la souris va vite). Renvoie null si rien n'a été effacé.
 */
export function eraseAlong(strokes: Stroke[], from: Point, to: Point, radius: number, newId: () => string): Stroke[] | null {
  const dist = Math.hypot(to.x - from.x, to.y - from.y);
  const steps = Math.max(1, Math.ceil(dist / (radius / 2)));
  let cur = strokes;
  let changed = false;
  for (let k = 1; k <= steps; k++) {
    const c = { x: from.x + ((to.x - from.x) * k) / steps, y: from.y + ((to.y - from.y) * k) / steps };
    const next = eraseDisc(cur, c, radius, newId);
    if (next) {
      cur = next;
      changed = true;
    }
  }
  return changed ? cur : null;
}
