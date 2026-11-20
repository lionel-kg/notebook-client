'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { api } from '@/lib/api';
import { BG_DEFS, stickerSize } from './constants';
import { compressImage } from './image';
import { eraseAlong, eraserRadius } from './eraser';
import { mergePages } from './merge';
import { PAGE_H, PAGE_W } from './types';
import type { BgId, DragMode, Item, Page, Point, Selection, StickerKind, Stroke } from './types';

export type SaveState = 'saved' | 'pending' | 'saving' | 'error';

type Session =
  | { kind: 'item'; p: number; id: string; mode: DragMode; rect: DOMRect; start: Point; orig: Item; pushed: boolean }
  | { kind: 'draw'; p: number; rect: DOMRect }
  | { kind: 'erase'; p: number; rect: DOMRect; touch: boolean; last: Point; startPages: Page[] }
  | { kind: 'swipe'; x: number; y: number; lx: number; ly: number; onSwipe: (dir: 1 | -1) => void };

const HISTORY_MAX = 40;
const SAVE_DELAY = 800;

export const uid = () => 'i' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
export const blankPage = (): Page => ({ id: uid(), bg: 'creme', items: [], strokes: [] });

function localFrom(rect: DOMRect, e: { clientX: number; clientY: number }): Point {
  const sc = rect.width / PAGE_W || 1;
  return { x: (e.clientX - rect.left) / sc, y: (e.clientY - rect.top) / sc };
}

function updItem(pages: Page[], p: number, id: string, patch: Partial<Item>): Page[] {
  return pages.map((pg, i) =>
    i !== p ? pg : { ...pg, items: pg.items.map((it) => (it.id === id ? ({ ...it, ...patch } as Item) : it)) },
  );
}

export function useAlbumEditor(albumId: string, initialPages: Page[], touch: boolean) {
  const [doc, setDoc] = useState<{ pages: Page[]; hist: Page[][] }>({ pages: initialPages, hist: [] });
  const [sel, setSel] = useState<Selection | null>(null);
  const [live, setLive] = useState<{ p: number; pts: Point[] } | null>(null);
  const [color, setColorState] = useState('#2b2b2b');
  const [size, setSize] = useState(7);
  const [uploading, setUploading] = useState(0);
  const [saveState, setSaveState] = useState<SaveState>('saved');
  const [error, setError] = useState<string | null>(null);

  const docRef = useRef(doc);
  docRef.current = doc;
  const selRef = useRef(sel);
  selRef.current = sel;
  const liveRef = useRef(live);
  liveRef.current = live;
  const styleRef = useRef({ color, size });
  styleRef.current = { color, size };

  const pages = doc.pages;

  /* ----------------------------- Modifications ----------------------------- */

  const mutate = useCallback((fn: (pages: Page[]) => Page[], withHist: boolean) => {
    setDoc((d) => {
      const next = fn(d.pages);
      if (next === d.pages) return d;
      return { pages: next, hist: withHist ? [...d.hist, d.pages].slice(-HISTORY_MAX) : d.hist };
    });
  }, []);

  const undo = useCallback(() => {
    setDoc((d) => (d.hist.length ? { pages: d.hist[d.hist.length - 1], hist: d.hist.slice(0, -1) } : d));
    setSel(null);
  }, []);

  const selItem = (): Item | null => {
    if (!sel) return null;
    return pages[sel.p]?.items.find((it) => it.id === sel.id) ?? null;
  };

  const addItems = useCallback(
    (p: number, items: Item[]) => {
      if (!items.length) return;
      mutate((pgs) => pgs.map((pg, i) => (i !== p ? pg : { ...pg, items: [...pg.items, ...items] })), true);
      setSel({ p, id: items[items.length - 1].id });
    },
    [mutate],
  );

  const addSticker = (p: number, kind: StickerKind) => {
    const [w, h] = stickerSize(kind, touch);
    const spreadX = touch ? 70 : 80;
    const spreadY = touch ? 90 : 100;
    addItems(p, [
      {
        id: uid(),
        type: 'sticker',
        kind,
        x: Math.round(PAGE_W / 2 - w / 2 + (Math.random() * 2 - 1) * spreadX),
        y: Math.round(PAGE_H / 2 - h / 2 + (Math.random() * 2 - 1) * spreadY),
        w,
        h,
        r: Math.round(Math.random() * 16 - 8),
      },
    ]);
  };

  const addText = (p: number) => {
    const dark = BG_DEFS[pages[p]?.bg ?? 'creme'].dark;
    const c = color;
    const textColor = dark ? (c === '#2b2b2b' ? '#f6efe2' : c) : c === '#ffffff' ? '#2b2b2b' : c;
    addItems(p, [
      touch
        ? { id: uid(), type: 'text', text: 'Écris ici', x: 90, y: 260, w: 280, fs: 46, r: 0, color: textColor, font: 'hand' }
        : { id: uid(), type: 'text', text: 'Écris ici', x: 100, y: 260, w: 260, fs: 40, r: 0, color: textColor, font: 'hand' },
    ]);
  };

  const addPhotos = async (p: number, files: File[]) => {
    if (!files.length) return;
    setUploading((u) => u + files.length);
    setError(null);
    const items: Item[] = [];
    const pad = touch ? 24 : 20;
    const box = touch && files.length === 1 ? 300 : 230;
    for (const file of files) {
      try {
        const img = await compressImage(file);
        if (!img) throw new Error("Impossible de lire l'image");
        const { photo } = await api.uploadPhoto(albumId, img.blob, img.width, img.height);
        const s = Math.min(box / img.width, box / img.height);
        const w = Math.round(img.width * s) + pad;
        const h = Math.round(img.height * s) + pad;
        items.push({
          id: uid(),
          type: 'photo',
          photoId: photo.id,
          x: Math.round(20 + Math.random() * Math.max(0, PAGE_W - w - 40)),
          y: Math.round(20 + Math.random() * Math.max(0, PAGE_H - h - 50)),
          w,
          h,
          r: Math.round(Math.random() * 10 - 5),
          frame: true,
        });
      } catch (e) {
        setError(e instanceof Error ? e.message : "Échec de l'envoi d'une photo");
      } finally {
        setUploading((u) => u - 1);
      }
    }
    addItems(p, items);
  };

  const patchSel = (patch: Partial<Item>, withHist = true) => {
    if (!sel) return;
    mutate((pgs) => updItem(pgs, sel.p, sel.id, patch), withHist);
  };

  const delSel = () => {
    if (!sel) return;
    mutate((pgs) => pgs.map((pg, i) => (i !== sel.p ? pg : { ...pg, items: pg.items.filter((it) => it.id !== sel.id) })), true);
    setSel(null);
  };

  const rotateSel = (deg: number) => {
    const it = selItem();
    if (it) patchSel({ r: (it.r || 0) + deg });
  };

  /** Change la couleur courante ; recolore aussi le texte sélectionné si demandé. */
  const setColor = (c: string, recolorText: boolean) => {
    setColorState(c);
    const it = selItem();
    if (recolorText && it?.type === 'text') patchSel({ color: c });
  };

  const setBg = (p: number, bg: BgId) => {
    mutate((pgs) => pgs.map((pg, i) => (i !== p ? pg : { ...pg, bg })), true);
  };

  const insertPages = (at: number, newPages: Page[]) => {
    mutate((pgs) => [...pgs.slice(0, at), ...newPages, ...pgs.slice(at)], true);
    setSel(null);
  };

  const removePages = (indices: number[]) => {
    const drop = new Set(indices);
    mutate((pgs) => pgs.filter((_, i) => !drop.has(i)), true);
    setSel(null);
  };

  /* ----------------------------- Gestes (pointeur) ----------------------------- */

  const sessRef = useRef<Session | null>(null);
  const listenersRef = useRef<{ move: (e: PointerEvent) => void; up: () => void } | null>(null);

  /** Gomme progressive : n'efface que l'encre sous la gomme, entre la position précédente et `pt`. */
  const eraseAt = (pt: Point) => {
    const s = sessRef.current;
    if (!s || s.kind !== 'erase') return;
    const from = s.last;
    s.last = pt;
    const radius = eraserRadius(s.touch);
    const { p, startPages } = s;
    // Calcul dans l'updater : plusieurs mouvements peuvent arriver avant le prochain rendu.
    setDoc((d) => {
      const pg = d.pages[p];
      if (!pg) return d;
      const strokes = eraseAlong(pg.strokes, from, pt, radius, uid);
      if (!strokes) return d;
      const pages = d.pages.map((g, i) => (i !== p ? g : { ...g, strokes }));
      // Un seul point d'annulation par coup de gomme : l'état d'avant le geste.
      const top = d.hist[d.hist.length - 1];
      const hist = top === startPages ? d.hist : [...d.hist, startPages].slice(-HISTORY_MAX);
      return { pages, hist };
    });
  };

  const handleMove = (e: PointerEvent) => {
    const s = sessRef.current;
    if (!s) return;
    if (s.kind === 'swipe') {
      s.lx = e.clientX;
      s.ly = e.clientY;
      return;
    }
    const pt = localFrom(s.rect, e);
    if (s.kind === 'draw') {
      setLive((lv) => {
        if (!lv) return lv;
        const last = lv.pts[lv.pts.length - 1];
        if (Math.hypot(pt.x - last.x, pt.y - last.y) < 1.5) return lv;
        return { p: lv.p, pts: [...lv.pts, pt] };
      });
      return;
    }
    if (s.kind === 'erase') {
      eraseAt(pt);
      return;
    }
    const o = s.orig;
    const dx = pt.x - s.start.x;
    const dy = pt.y - s.start.y;
    if (!s.pushed && Math.hypot(dx, dy) < (touch ? 3 : 2)) return;
    let patch: Partial<Item>;
    if (s.mode === 'move') {
      patch = { x: Math.round(o.x + dx), y: Math.round(o.y + dy) };
    } else if (s.mode === 'size') {
      const oh = o.type === 'text' ? 0 : o.h;
      const base = o.w + (oh || o.w);
      const k = Math.max(0.2, Math.min(6, 1 + (dx + dy) / base));
      patch = { w: Math.round(o.w * k) };
      if (o.type !== 'text') (patch as { h: number }).h = Math.round(o.h * k);
      else (patch as { fs: number }).fs = Math.round(o.fs * k);
    } else {
      const hh = o.type === 'text' ? o.fs * 1.15 * String(o.text).split('\n').length + 8 : o.h;
      const cx = o.x + o.w / 2;
      const cy = o.y + hh / 2;
      patch = { r: Math.round((Math.atan2(pt.y - cy, pt.x - cx) * 180) / Math.PI + 90) };
    }
    const withHist = !s.pushed;
    s.pushed = true;
    mutate((pgs) => updItem(pgs, s.p, s.id, patch), withHist);
  };

  const detach = () => {
    const l = listenersRef.current;
    if (!l) return;
    window.removeEventListener('pointermove', l.move);
    window.removeEventListener('pointerup', l.up);
    window.removeEventListener('pointercancel', l.up);
    listenersRef.current = null;
  };

  const handleUp = () => {
    const s = sessRef.current;
    detach();
    sessRef.current = null;
    if (!s) return;
    if (s.kind === 'swipe') {
      const dx = s.lx - s.x;
      const dy = s.ly - s.y;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) s.onSwipe(dx < 0 ? 1 : -1);
      return;
    }
    if (s.kind !== 'draw') return;
    const lv = liveRef.current;
    if (!lv) return;
    const stroke: Stroke = { id: uid(), color: styleRef.current.color, size: styleRef.current.size, pts: lv.pts };
    mutate((pgs) => pgs.map((g, i) => (i !== lv.p ? g : { ...g, strokes: [...g.strokes, stroke] })), true);
    setLive(null);
  };

  // Les écouteurs globaux appellent toujours la dernière version des fonctions.
  const handlersRef = useRef({ handleMove, handleUp });
  handlersRef.current = { handleMove, handleUp };

  const attach = () => {
    if (listenersRef.current) return;
    const move = (e: PointerEvent) => handlersRef.current.handleMove(e);
    const up = () => handlersRef.current.handleUp();
    listenersRef.current = { move, up };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
  };

  useEffect(() => detach, []);

  /** Appui sur un élément : déplacement, redimensionnement ou rotation. */
  const itemDown = (e: ReactPointerEvent, p: number, id: string, mode: DragMode): Item | null => {
    e.stopPropagation();
    if (e.button !== undefined && e.button !== 0) return null;
    e.preventDefault();
    const pageEl = (e.currentTarget as HTMLElement).closest('[data-page]');
    if (!pageEl) return null;
    const rect = pageEl.getBoundingClientRect();
    const it = docRef.current.pages[p]?.items.find((x) => x.id === id);
    if (!it) return null;
    const items = docRef.current.pages[p].items;
    if (mode === 'move' && items[items.length - 1].id !== id) {
      // Passe l'élément au premier plan (sans entrée d'historique).
      mutate((pgs) => pgs.map((pg, i) => (i !== p ? pg : { ...pg, items: [...pg.items.filter((x) => x.id !== id), it] })), false);
    }
    sessRef.current = { kind: 'item', p, id, mode, rect, start: localFrom(rect, e), orig: { ...it }, pushed: false };
    setSel({ p, id });
    attach();
    return it;
  };

  /** Appui sur la couche de dessin : pinceau ou gomme. */
  const inkDown = (e: ReactPointerEvent, p: number, pen: 'draw' | 'erase') => {
    e.stopPropagation();
    if (e.button !== undefined && e.button !== 0) return;
    e.preventDefault();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const pt = localFrom(rect, e);
    if (pen === 'erase') {
      sessRef.current = { kind: 'erase', p, rect, touch, last: pt, startPages: docRef.current.pages };
      eraseAt(pt);
    } else {
      sessRef.current = { kind: 'draw', p, rect };
      setLive({ p, pts: [pt] });
    }
    attach();
  };

  /** Glissement horizontal sur la page pour la tourner (téléphone / tablette). */
  const swipeDown = (e: ReactPointerEvent, onSwipe: (dir: 1 | -1) => void) => {
    sessRef.current = { kind: 'swipe', x: e.clientX, y: e.clientY, lx: e.clientX, ly: e.clientY, onSwipe };
    attach();
  };

  /* ----------------------------- Enregistrement automatique ----------------------------- */

  const lastSavedRef = useRef(initialPages);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inFlightRef = useRef<Promise<void> | null>(null);
  /** Identifiant de cet onglet, envoyé avec chaque enregistrement (voir temps réel). */
  const clientIdRef = useRef(uid());
  /** Incrémenté à chaque modification reçue d'une autre personne. */
  const remoteSeqRef = useRef(0);

  const save = useCallback(async () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (inFlightRef.current) await inFlightRef.current;
    const snapshot = docRef.current.pages;
    if (snapshot === lastSavedRef.current) {
      setSaveState('saved');
      return;
    }
    setSaveState('saving');
    const seq = remoteSeqRef.current;
    const run = api
      .savePages(albumId, snapshot, clientIdRef.current)
      .then(() => {
        // Si une modification distante est arrivée pendant l'envoi, elle reste la base de fusion.
        if (remoteSeqRef.current === seq) lastSavedRef.current = snapshot;
        setSaveState(docRef.current.pages === snapshot ? 'saved' : 'pending');
      })
      .catch((e) => {
        setSaveState('error');
        setError(e instanceof Error ? e.message : "Échec de l'enregistrement");
      })
      .finally(() => {
        inFlightRef.current = null;
      });
    inFlightRef.current = run;
    await run;
  }, [albumId]);

  useEffect(() => {
    if (pages === lastSavedRef.current) return;
    setSaveState('pending');
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => void save(), SAVE_DELAY);
  }, [pages, save]);

  /* ----------------------------- Temps réel ----------------------------- */

  /** Applique l'état envoyé par le serveur après la modification d'une autre personne. */
  const applyRemote = useCallback((remote: Page[]) => {
    remoteSeqRef.current++;
    const base = lastSavedRef.current;
    lastSavedRef.current = remote;
    // L'historique d'annulation ne correspond plus à l'album : on le vide.
    setDoc((d) => ({ pages: mergePages(base, d.pages, remote), hist: [] }));
  }, []);

  // Désélectionne un élément supprimé entre-temps par quelqu'un d'autre.
  useEffect(() => {
    if (sel && !pages[sel.p]?.items.some((it) => it.id === sel.id)) setSel(null);
  }, [pages, sel]);

  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (docRef.current.pages !== lastSavedRef.current) {
        void save();
        e.preventDefault();
      }
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [save]);

  return {
    pages,
    canUndo: doc.hist.length > 0,
    sel,
    setSel,
    selected: selItem(),
    live,
    color,
    size,
    setSize,
    setColor,
    uploading,
    saveState,
    error,
    clearError: () => setError(null),
    flush: save,
    clientId: clientIdRef.current,
    applyRemote,
    undo,
    addSticker,
    addText,
    addPhotos,
    patchSel,
    delSel,
    rotateSel,
    setBg,
    insertPages,
    removePages,
    itemDown,
    inkDown,
    swipeDown,
  };
}

export type AlbumEditor = ReturnType<typeof useAlbumEditor>;
