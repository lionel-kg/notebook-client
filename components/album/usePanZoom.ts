'use client';

import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent, type RefObject } from 'react';

export interface PanZoomView {
  s: number;
  x: number;
  y: number;
}

/**
 * Zoom + déplacement d'un contenu centré dans une zone (viewport).
 * Le contenu reçoit `transform: translate(x, y) scale(s)` avec `transform-origin: center`.
 * Les coordonnées écran sont converties en unités locales, ce qui fonctionne aussi
 * quand la zone est elle-même mise à l'échelle (scène du livre sur ordinateur).
 */
export function usePanZoom(max = 4) {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLElement | null>(null);
  const [view, setView] = useState<PanZoomView>({ s: 1, x: 0, y: 0 });
  // Valeur à jour même entre deux rendus (molette / pincement très rapides).
  const viewRef = useRef(view);

  const metrics = () => {
    const vp = viewportRef.current;
    const ct = contentRef.current;
    if (!vp || !ct) return null;
    const r = vp.getBoundingClientRect();
    const k = r.width / (vp.offsetWidth || 1) || 1; // pixels écran par unité locale
    return { r, k, vw: vp.offsetWidth, vh: vp.offsetHeight, cw: ct.offsetWidth, ch: ct.offsetHeight };
  };

  const commit = useCallback((s: number, x: number, y: number) => {
    const m = metrics();
    s = Math.min(max, Math.max(1, s));
    if (s <= 1.001) {
      s = 1;
      x = 0;
      y = 0;
    } else if (m) {
      // Le contenu ne peut pas sortir complètement de la zone.
      const mx = Math.max(0, (m.cw * s - m.vw) / 2);
      const my = Math.max(0, (m.ch * s - m.vh) / 2);
      x = Math.min(mx, Math.max(-mx, x));
      y = Math.min(my, Math.max(-my, y));
    }
    const next = { s, x, y };
    viewRef.current = next;
    setView(next);
  }, [max]);

  /** Zoome d'un facteur en gardant fixe le point (clientX, clientY) — par défaut le centre. */
  const zoomBy = useCallback(
    (factor: number, clientX?: number, clientY?: number) => {
      const m = metrics();
      const v = viewRef.current;
      const s2 = Math.min(max, Math.max(1, v.s * factor));
      if (!m || clientX === undefined || clientY === undefined) return commit(s2, (v.x * s2) / v.s, (v.y * s2) / v.s);
      // Point visé, en unités locales, relatif au centre de la zone
      const px = (clientX - (m.r.left + m.r.width / 2)) / m.k;
      const py = (clientY - (m.r.top + m.r.height / 2)) / m.k;
      commit(s2, px - ((px - v.x) * s2) / v.s, py - ((py - v.y) * s2) / v.s);
    },
    [commit, max],
  );

  /** Déplace le contenu d'un vecteur exprimé en pixels écran. */
  const panBy = useCallback(
    (dx: number, dy: number) => {
      const k = metrics()?.k ?? 1;
      const v = viewRef.current;
      commit(v.s, v.x + dx / k, v.y + dy / k);
    },
    [commit],
  );

  const reset = useCallback(() => commit(1, 0, 0), [commit]);

  /** Glisser (souris ou doigt) pour se déplacer dans le contenu zoomé. */
  const panDown = useCallback(
    (e: ReactPointerEvent | PointerEvent) => {
      e.preventDefault();
      e.stopPropagation();
      let lx = e.clientX;
      let ly = e.clientY;
      const id = e.pointerId;
      const move = (ev: PointerEvent) => {
        if (ev.pointerId !== id) return;
        panBy(ev.clientX - lx, ev.clientY - ly);
        lx = ev.clientX;
        ly = ev.clientY;
      };
      const up = (ev: PointerEvent) => {
        if (ev.pointerId !== id) return;
        window.removeEventListener('pointermove', move);
        window.removeEventListener('pointerup', up);
        window.removeEventListener('pointercancel', up);
      };
      window.addEventListener('pointermove', move);
      window.addEventListener('pointerup', up);
      window.addEventListener('pointercancel', up);
    },
    [panBy],
  );

  return {
    ...view,
    zoomed: view.s > 1.001,
    viewportRef,
    contentRef,
    zoomBy,
    panBy,
    panDown,
    reset,
    transform: `translate(${view.x}px, ${view.y}px) scale(${view.s})`,
  };
}

export type PanZoom = ReturnType<typeof usePanZoom>;

/**
 * Molette : avec Ctrl/⌘ (ou pincement du trackpad) on zoome, sinon on se déplace quand c'est zoomé.
 * `alwaysZoom` : la molette seule zoome (visionneuse photo).
 */
export function useWheelZoom(pz: PanZoom, alwaysZoom = false) {
  const { viewportRef, zoomBy, panBy } = pz;
  const zoomedRef = useRef(pz.zoomed);
  zoomedRef.current = pz.zoomed;
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (alwaysZoom || e.ctrlKey || e.metaKey) {
        e.preventDefault();
        // Pincement du trackpad = petits deltas nombreux ; cran de souris ≈ 100 : on borne chaque pas.
        const dy = Math.max(-40, Math.min(40, e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY));
        zoomBy(Math.exp(-dy * 0.01), e.clientX, e.clientY);
      } else if (zoomedRef.current) {
        e.preventDefault();
        panBy(-e.deltaX, -e.deltaY);
      }
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [viewportRef, zoomBy, panBy, alwaysZoom]);
}

/**
 * Pincement à deux doigts sur la zone : zoom autour du milieu des doigts + déplacement.
 * Intercepté en phase de capture : le deuxième doigt n'atteint jamais la page (pas de trait parasite),
 * et `onPinchStart` permet d'annuler le geste commencé par le premier doigt.
 */
export function usePinchZoom(pz: PanZoom, onPinchStart?: () => void, targetRef?: RefObject<HTMLElement | null>) {
  const { viewportRef, zoomBy, panBy } = pz;
  const startRef = useRef(onPinchStart);
  startRef.current = onPinchStart;
  const [pinching, setPinching] = useState(false);

  useEffect(() => {
    const el = targetRef?.current ?? viewportRef.current;
    if (!el) return;
    const pts = new Map<number, { x: number; y: number }>();
    let prev: { d: number; mx: number; my: number } | null = null;

    const measure = () => {
      const [a, b] = [...pts.values()];
      return { d: Math.hypot(a.x - b.x, a.y - b.y) || 1, mx: (a.x + b.x) / 2, my: (a.y + b.y) / 2 };
    };
    const down = (e: PointerEvent) => {
      if (e.pointerType !== 'touch') return;
      pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pts.size === 2) {
        e.stopPropagation();
        e.preventDefault();
        startRef.current?.();
        prev = measure();
        setPinching(true);
      } else if (pts.size > 2) {
        e.stopPropagation();
      }
    };
    const move = (e: PointerEvent) => {
      if (!pts.has(e.pointerId)) return;
      pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pts.size < 2 || !prev) return;
      e.stopPropagation();
      const cur = measure();
      zoomBy(cur.d / prev.d, cur.mx, cur.my);
      panBy(cur.mx - prev.mx, cur.my - prev.my);
      prev = cur;
    };
    const up = (e: PointerEvent) => {
      if (!pts.delete(e.pointerId)) return;
      if (pts.size < 2 && prev) {
        prev = null;
        // Laisse passer un court instant avant de réautoriser les gestes à un doigt.
        setTimeout(() => setPinching(false), 0);
      }
    };
    el.addEventListener('pointerdown', down, true);
    window.addEventListener('pointermove', move, true);
    window.addEventListener('pointerup', up, true);
    window.addEventListener('pointercancel', up, true);
    return () => {
      el.removeEventListener('pointerdown', down, true);
      window.removeEventListener('pointermove', move, true);
      window.removeEventListener('pointerup', up, true);
      window.removeEventListener('pointercancel', up, true);
    };
  }, [viewportRef, targetRef, zoomBy, panBy]);

  return pinching;
}
