'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { BG_DEFS, BG_ORDER, COLORS, IDLE_RING, SELECT_RING, SIZES } from './constants';
import { useHasClipboard } from './clipboard';
import { ExportMenu } from './ExportMenu';
import {
  IconBack,
  IconBrush,
  IconChevronLeft,
  IconChevronRight,
  IconCopy,
  IconCursor,
  IconDuplicate,
  IconEraser,
  IconEye,
  IconLock,
  IconPaste,
  IconPencil,
  IconPhoto,
  IconPlus,
  IconRedoRot,
  IconText,
  IconToBack,
  IconToFront,
  IconTrash,
  IconUndo,
  IconUnlock,
  IconZoomIn,
  IconZoomOut,
} from './Icons';
import { PageView } from './PageView';
import { SaveStatus } from './SaveStatus';
import { StickerPalette } from './StickerPalette';
import { FontPicker, TextArea } from './TextEditor';
import { blankPage, type AlbumEditor } from './useAlbumEditor';
import { usePanZoom, usePinchZoom, useWheelZoom } from './usePanZoom';
import type { Tool } from './types';

const STAGE_W = 1280;
const STAGE_H = 810;
const FLIP_MS = 900;

interface Props {
  editor: AlbumEditor;
  title: string;
  subtitle: string;
  deskColor: string;
  onBack: () => void;
  readOnly?: boolean;
  owner?: string;
  backLabel?: string;
  loginHref?: string;
  /** Nombre de personnes qui ont l'album ouvert (temps réel) */
  viewers?: number;
  /** Personne qui vient de modifier l'album (affiché quelques secondes) */
  lastEditor?: string | null;
  /** Bascule aperçu ⇄ modification (absent pour les visiteurs) */
  onToggleMode?: () => void;
  /** Aperçu : ouvrir une photo en plein écran */
  onPhotoClick?: (photoId: string) => void;
  exporting?: boolean;
  onExportPdf?: () => void;
  onExportPage?: (index: number) => void;
}

/** Activité en temps réel : qui vient de modifier, ou combien de personnes regardent. */
export function LiveBadge({ viewers, lastEditor }: { viewers: number; lastEditor: string | null }) {
  const text = lastEditor ? `${lastEditor} vient de modifier` : viewers > 1 ? `${viewers} personnes ici` : null;
  if (!text) return null;
  return (
    <span className="live-badge" role="status">
      <span className="dot" aria-hidden="true" />
      {text}
    </span>
  );
}

/** Vue ordinateur : le livre ouvert en double page, outils à gauche, stickers à droite. */
export function DesktopEditor({ editor, title, subtitle, deskColor, onBack, readOnly = false, owner, backLabel = 'Albums', loginHref, viewers = 1, lastEditor = null, onToggleMode, onPhotoClick, exporting = false, onExportPdf, onExportPage }: Props) {
  const { pages, sel, selected } = editor;
  const n = pages.length;

  // Une double page = 2 faces. Si le nombre de pages est impair, une face vierge précède le dos.
  const slots = useMemo<(number | null)[]>(() => {
    const idx = pages.map((_, i) => i);
    return n % 2 === 0 ? idx : [...idx.slice(0, -1), null, n - 1];
  }, [pages, n]);
  const L = slots.length / 2;

  const [k, setK] = useState(0);
  const [flipping, setFlipping] = useState<number | null>(null);
  const [tool, setTool] = useState<Tool>('move');
  const [active, setActive] = useState(0);
  /** Page survolée pendant un glisser-déposer de photos */
  const [dropPage, setDropPage] = useState<number | null>(null);
  const flipTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (k > L) setK(L);
  }, [k, L]);
  useEffect(() => () => {
    if (flipTimer.current) clearTimeout(flipTimer.current);
  }, []);

  const kk = Math.min(k, L);
  const leftSlot = kk >= 1 ? 2 * kk - 1 : -1;
  const rightSlot = kk < L ? 2 * kk : -1;
  const visible = [slots[leftSlot], slots[rightSlot]].filter((x): x is number => x !== null && x !== undefined);
  const defaultActive = visible.length ? visible[visible.length - 1] : 0;
  const activeIdx = visible.includes(active) ? active : defaultActive;

  const startFlip = (leaf: number | null) => {
    setFlipping(leaf);
    if (flipTimer.current) clearTimeout(flipTimer.current);
    flipTimer.current = setTimeout(() => setFlipping(null), FLIP_MS);
  };

  const go = (dir: 1 | -1) => {
    if (flipping !== null) return;
    const nk = kk + dir;
    if (nk < 0 || nk > L) return;
    setK(nk);
    editor.setSel(null);
    setActive(-1);
    startFlip(dir > 0 ? kk : kk - 1);
  };

  const addSpread = () => {
    if (flipping !== null) return;
    const insAt = Math.min(Math.max(0, ...visible) + 1, n - 1);
    const a = blankPage();
    editor.insertPages(insAt, [a, blankPage()]);
    const nk = Math.floor((insAt + 1) / 2);
    setK(nk);
    setActive(insAt);
    if (nk > kk) startFlip(kk);
  };

  const deletable = visible.filter((i) => i !== 0 && i !== n - 1);
  const canDelSpread = !readOnly && kk >= 1 && kk <= L - 1 && deletable.length > 0 && n - deletable.length >= 3;
  const delSpread = () => {
    if (!canDelSpread || flipping !== null) return;
    if (!window.confirm('Supprimer cette double page et tout son contenu ?')) return;
    editor.removePages(deletable);
    const newN = n - deletable.length;
    const newL = Math.ceil(newN / 2);
    setK(Math.max(1, Math.min(kk, newL - 1)));
    setActive(-1);
  };

  const chooseTool = (t: Tool) => {
    setTool(t);
    if (t !== 'move') editor.setSel(null);
  };

  const pickColor = (c: string) => {
    editor.setColor(c, true);
    if (!selected && tool === 'erase') setTool('draw');
  };

  const label = kk === 0 ? 'Couverture' : kk === L ? 'Dos de l’album' : `Pages ${2 * kk - 1} – ${2 * kk}`;

  /* ---------- Mise à l'échelle de la scène pour remplir la fenêtre ---------- */
  /* ---------- Zoom sur le livre (précision pour dessiner) ---------- */
  const pz = usePanZoom(4);
  useWheelZoom(pz); // Ctrl/⌘ + molette ou pincement du trackpad ; molette seule = se déplacer
  usePinchZoom(pz, editor.cancelGesture); // écrans tactiles larges (tablette à l'horizontale)
  // Espace maintenu (ou bouton du milieu) : glisser pour se déplacer, même avec le pinceau
  const [spaceHeld, setSpaceHeld] = useState(false);
  useEffect(() => {
    const typing = (e: KeyboardEvent) => (e.target as HTMLElement)?.closest?.('input, textarea, [contenteditable]');
    const down = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !typing(e)) {
        if (pz.zoomed) e.preventDefault();
        setSpaceHeld(true);
      }
    };
    const up = (e: KeyboardEvent) => e.code === 'Space' && setSpaceHeld(false);
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, [pz.zoomed]);

  const [scale, setScale] = useState(1);
  useEffect(() => {
    const fit = () => setScale(Math.min(window.innerWidth / STAGE_W, window.innerHeight / STAGE_H));
    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, []);

  const face = (slot: number, side: 'front' | 'back') => {
    const real = slots[slot];
    const page = real === null ? null : pages[real];
    const isVisible = (slot === leftSlot || slot === rightSlot) && flipping === null;
    const isFront = side === 'front';
    const activeRing =
      dropPage !== null && real === dropPage
        ? ', inset 0 0 0 4px #2d6cc0'
        : !readOnly && isVisible && real === activeIdx
          ? ', inset 0 0 0 3px rgba(246,193,67,.8)'
          : '';
    const shade = isFront
      ? 'inset 20px 0 24px -18px rgba(40,25,10,.4), 0 18px 36px rgba(0,0,0,.35)'
      : 'inset -20px 0 24px -18px rgba(40,25,10,.4), 0 18px 36px rgba(0,0,0,.35)';
    const radius =
      slot === 0 ? '4px 12px 12px 4px' : slot === slots.length - 1 ? '12px 4px 4px 12px' : isFront ? '0 8px 8px 0' : '8px 0 0 8px';
    const inner = real !== null && real !== 0 && real !== n - 1;
    const p = real ?? -1;
    return (
      <PageView
        key={`${slot}-${page?.id ?? 'blank'}`}
        page={page}
        index={p}
        touch={false}
        interactive={!readOnly && isVisible && real !== null}
        tool={tool}
        selId={sel && sel.p === p ? sel.id : null}
        live={editor.live && editor.live.p === p ? { pts: editor.live.pts, color: editor.color, size: editor.size } : null}
        showEmptyHint={!readOnly && inner}
        pageNum={inner ? String(real) : undefined}
        style={{ transform: isFront ? 'none' : 'rotateY(180deg)', boxShadow: shade + activeRing, borderRadius: radius }}
        onPageDown={(e) => {
          // Zoomé : glisser sur la page (hors élément) déplace la vue
          if (pz.zoomed && (readOnly || tool === 'move')) pz.panDown(e);
          if (tool === 'move' && isVisible && real !== null) {
            setActive(real);
            editor.setSel(null);
          }
        }}
        onItemDown={(e, id, mode) => {
          if (readOnly || tool !== 'move' || flipping !== null || real === null) return;
          if (editor.itemDown(e, real, id, mode)) setActive(real);
        }}
        onPhotoClick={readOnly && isVisible ? onPhotoClick : undefined}
        onInkDown={(e) => {
          if (readOnly || flipping !== null || real === null || tool === 'move') return;
          setActive(real);
          editor.inkDown(e, real, tool);
        }}
      />
    );
  };

  const leaves = [];
  for (let j = 0; j < L; j++) {
    leaves.push(
      <div
        key={j}
        className="leaf"
        style={{ transform: `rotateY(${j < kk ? -180 : 0}deg)`, zIndex: flipping === j ? L + 10 : j < kk ? j + 1 : L - j }}
      >
        {face(2 * j, 'front')}
        {face(2 * j + 1, 'back')}
      </div>,
    );
  }

  const activeBg = pages[activeIdx]?.bg ?? 'creme';
  const hasSel = !!selected && tool === 'move';
  const hasClip = useHasClipboard();
  const locked = !!selected?.locked;

  /* ---------- Raccourcis clavier (mode modification) ---------- */
  const keysRef = useRef({ editor, activeIdx, readOnly, hasSel });
  keysRef.current = { editor, activeIdx, readOnly, hasSel };
  useEffect(() => {
    const typing = (t: EventTarget | null) => !!(t as HTMLElement | null)?.closest?.('input, textarea, [contenteditable]');
    const onKey = (e: KeyboardEvent) => {
      const k = keysRef.current;
      if (k.readOnly || typing(e.target)) return;
      const mod = e.metaKey || e.ctrlKey;
      const key = e.key.toLowerCase();
      if (mod && key === 'z' && !e.shiftKey) {
        e.preventDefault();
        k.editor.undo();
      } else if (mod && key === 'c' && k.hasSel) {
        k.editor.copySel();
      } else if (mod && key === 'd' && k.hasSel) {
        e.preventDefault();
        k.editor.duplicateSel();
      } else if ((e.key === 'Delete' || e.key === 'Backspace') && k.hasSel) {
        e.preventDefault();
        k.editor.delSel();
      }
    };
    // Coller : une image du presse-papiers devient une photo, sinon on colle l'élément copié.
    const onPaste = (e: ClipboardEvent) => {
      const k = keysRef.current;
      if (k.readOnly || typing(e.target)) return;
      const files = Array.from(e.clipboardData?.files ?? []).filter((f) => f.type.startsWith('image/'));
      e.preventDefault();
      if (files.length) void k.editor.addPhotos(k.activeIdx, files);
      else void k.editor.paste(k.activeIdx);
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('paste', onPaste);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('paste', onPaste);
    };
  }, []);

  /* ---------- Glisser-déposer de photos depuis l'ordinateur ---------- */
  const hasFiles = (e: React.DragEvent) => Array.from(e.dataTransfer.types).includes('Files');
  /** Page visible sous le pointeur, et point de dépôt en coordonnées de page */
  const pageAt = (x: number, y: number): { p: number; pt: { x: number; y: number } } | null => {
    for (const el of document.elementsFromPoint(x, y)) {
      const pg = (el as HTMLElement).closest?.('[data-page]') as HTMLElement | null;
      const p = pg ? Number(pg.dataset.page) : -1;
      if (p >= 0 && visible.includes(p)) {
        const r = pg!.getBoundingClientRect();
        const sc = r.width / 460 || 1;
        return { p, pt: { x: (x - r.left) / sc, y: (y - r.top) / sc } };
      }
    }
    return null;
  };
  const dropHandlers = {
    onDragOver: (e: React.DragEvent) => {
      if (!hasFiles(e)) return;
      e.preventDefault(); // sinon le navigateur ouvrirait l'image à la place de l'album
      const hit = readOnly ? null : pageAt(e.clientX, e.clientY);
      e.dataTransfer.dropEffect = hit ? 'copy' : 'none';
      setDropPage(hit?.p ?? null);
    },
    onDragLeave: (e: React.DragEvent) => {
      if (!e.currentTarget.contains(e.relatedTarget as Node)) setDropPage(null);
    },
    onDrop: (e: React.DragEvent) => {
      if (!hasFiles(e)) return;
      e.preventDefault();
      setDropPage(null);
      const hit = readOnly ? null : pageAt(e.clientX, e.clientY);
      if (!hit) return;
      setTool('move');
      setActive(hit.p);
      void editor.addPhotos(hit.p, Array.from(e.dataTransfer.files), hit.pt);
    },
  };
  const pageTitle = (i: number) => (i === 0 ? 'Couverture' : i === n - 1 ? 'Dos' : `Page ${i}`);

  return (
    <div className="desk" style={{ backgroundColor: deskColor }} {...dropHandlers}>
      <div className="stage-fit" style={{ width: STAGE_W * scale, height: STAGE_H * scale }}>
        <div className="stage" style={{ transform: `scale(${scale})` }}>
          {/* En-tête */}
          <button type="button" className="btn ghost" onClick={onBack} style={{ position: 'absolute', left: 20, top: 26, width: 108, justifyContent: 'center', padding: 0 }}>
            <IconBack size={16} />
            {backLabel}
          </button>
          <div className="d-head">
            <div className="d-title">
              <span className="serif">{title}</span>
              {subtitle && <span className="hand">{subtitle}</span>}
              {owner && <span className="by">par {owner}</span>}
              <LiveBadge viewers={viewers} lastEditor={lastEditor} />
            </div>
            {readOnly && onToggleMode && (
              <button type="button" className="btn" onClick={onToggleMode}>
                <IconPencil />
                Modifier
              </button>
            )}
            {readOnly && !onToggleMode && loginHref && (
              <Link href={loginHref} className="btn">
                Se connecter pour modifier
              </Link>
            )}
            {!readOnly && (
            <div className="row">
              {onToggleMode && (
                <button type="button" className="btn ghost" onClick={onToggleMode}>
                  <IconEye />
                  Aperçu
                </button>
              )}
              <label className="btn">
                <IconPhoto />
                Ajouter des photos
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="vh"
                  onChange={(e) => {
                    const files = Array.from(e.target.files ?? []);
                    e.target.value = '';
                    setTool('move');
                    void editor.addPhotos(activeIdx, files);
                  }}
                />
              </label>
              <button type="button" className="btn" onClick={() => { setTool('move'); editor.addText(activeIdx); }}>
                <IconText />
                Ajouter un texte
              </button>
              <button type="button" className="btn" onClick={addSpread}>
                <IconPlus />
                Double page
              </button>
              <button type="button" className="btn ghost" onClick={editor.undo} disabled={!editor.canUndo}>
                <IconUndo />
                Annuler
              </button>
            </div>
            )}
          </div>

          {/* Outils */}
          {!readOnly && (
          <div className="card d-tools">
            <div className="h">Outils</div>
            {(
              [
                ['move', 'Déplacer', <IconCursor key="m" size={20} />],
                ['draw', 'Pinceau', <IconBrush key="d" size={20} />],
                ['erase', 'Gomme', <IconEraser key="e" size={20} />],
              ] as const
            ).map(([t, name, icon]) => (
              <button
                key={t}
                type="button"
                className="tool"
                aria-pressed={tool === t}
                onClick={() => chooseTool(t)}
                style={{ background: tool === t ? '#2b3340' : '#efe6d6', color: tool === t ? '#f6efe2' : '#3d2f22' }}
              >
                {icon}
                {name}
              </button>
            ))}
            <div className="h" style={{ marginTop: 8 }}>
              Couleur
            </div>
            <div className="swatches">
              {COLORS.map((c) => (
                <button key={c.c} type="button" className="sw" aria-label={`Couleur ${c.label}`} aria-pressed={editor.color === c.c} onClick={() => pickColor(c.c)}>
                  <span style={{ width: 28, height: 28, borderRadius: '50%', backgroundColor: c.c, boxShadow: editor.color === c.c ? SELECT_RING : IDLE_RING }} />
                </button>
              ))}
            </div>
            <div className="h" style={{ marginTop: 6 }}>
              Épaisseur
            </div>
            <div className="swatches">
              {SIZES.map((z) => (
                <button
                  key={z.s}
                  type="button"
                  className="sw"
                  aria-label={`Épaisseur ${z.label}`}
                  aria-pressed={editor.size === z.s}
                  onClick={() => {
                    editor.setSize(z.s);
                    if (tool === 'move') chooseTool('draw');
                  }}
                  style={{ boxShadow: editor.size === z.s ? 'inset 0 0 0 2px #2d6cc0' : 'none' }}
                >
                  <span style={{ width: Math.max(6, z.s + 4), height: Math.max(6, z.s + 4), borderRadius: '50%', backgroundColor: '#3d2f22' }} />
                </button>
              ))}
            </div>
          </div>
          )}

          {/* Livre */}
          <div
            ref={pz.viewportRef}
            className={`book-wrap${pz.zoomed ? ' zoomed' : ''}${pz.zoomed && spaceHeld ? ' panning' : ''}`}
            onPointerDownCapture={(e) => {
              if (pz.zoomed && (spaceHeld || e.button === 1)) pz.panDown(e);
            }}
          >
            <div
              ref={(el) => {
                pz.contentRef.current = el;
              }}
              className="zoom-layer"
              style={{ transform: pz.transform }}
            >
              <div className="book" style={{ transform: `translateX(${kk === 0 ? -230 : kk === L ? 230 : 0}px)` }}>
                {leaves}
              </div>
            </div>
          </div>

          {/* Zoom */}
          <div className="d-zoom" role="group" aria-label="Zoom">
            <button type="button" onClick={() => pz.zoomBy(1 / 1.5)} disabled={!pz.zoomed} aria-label="Dézoomer">
              <IconZoomOut size={18} />
            </button>
            <button type="button" className="pct" onClick={pz.reset} disabled={!pz.zoomed} aria-label="Taille normale" title="Taille normale">
              {Math.round(pz.s * 100)} %
            </button>
            <button type="button" onClick={() => pz.zoomBy(1.5)} disabled={pz.s >= 4} aria-label="Zoomer">
              <IconZoomIn size={18} />
            </button>
          </div>

          {/* Navigation */}
          <div className="d-nav">
            <button type="button" className="btn ghost" onClick={() => go(-1)} disabled={kk === 0} aria-label="Page précédente">
              <IconChevronLeft size={16} />
              Précédente
            </button>
            <div className="d-label">{label}</div>
            <button type="button" className="btn ghost" onClick={() => go(1)} disabled={kk === L} aria-label="Page suivante">
              Suivante
              <IconChevronRight size={16} />
            </button>
            {canDelSpread && (
              <button type="button" className="btn danger" onClick={delSpread}>
                Supprimer la double page
              </button>
            )}
            {onExportPdf && onExportPage && (
              <ExportMenu
                placement="up"
                disabled={exporting}
                actions={[
                  { label: 'Album complet en PDF', onSelect: onExportPdf },
                  ...visible.map((i) => ({ label: `${pageTitle(i)} en image`, onSelect: () => onExportPage(i) })),
                ]}
              />
            )}
          </div>
          {!readOnly && <SaveStatus className="save d-save" state={editor.saveState} uploading={editor.uploading} />}

          {/* Stickers, fond, sélection */}
          {!readOnly && (
          <div className="card d-side">
            <StickerPalette
              variant="side"
              onPick={(kind) => {
                setTool('move');
                editor.addSticker(activeIdx, kind);
              }}
              onPickCustom={(st) => {
                setTool('move');
                editor.addCustomSticker(activeIdx, st);
              }}
              onError={editor.showError}
            />
            <div className="h" style={{ marginTop: 6 }}>
              Fond de page
            </div>
            <div className="swatches three">
              {BG_ORDER.map((id) => {
                const b = BG_DEFS[id];
                return (
                  <button key={id} type="button" className="sw" aria-label={b.label} aria-pressed={activeBg === id} onClick={() => editor.setBg(activeIdx, id)}>
                    <span
                      style={{
                        width: 30,
                        height: 30,
                        borderRadius: 8,
                        backgroundColor: b.color,
                        backgroundImage: b.img,
                        backgroundSize: b.swatchSize,
                        boxShadow: activeBg === id ? SELECT_RING : IDLE_RING,
                      }}
                    />
                  </button>
                );
              })}
            </div>
            <div className="h" style={{ marginTop: 6 }}>
              Sélection
            </div>
            {!hasSel && <div className="muted">Touche une photo, un sticker ou un texte pour le modifier.</div>}
            {!hasSel && hasClip && (
              <button type="button" className="mini" onClick={() => void editor.paste(activeIdx)} title="Ctrl/⌘ + V">
                <IconPaste />
                Coller ici
              </button>
            )}
            {hasSel && selected && (
              <>
                <div className="sel-actions">
                  <button type="button" className="mini" onClick={editor.duplicateSel} aria-label="Dupliquer" title="Dupliquer (Ctrl/⌘ + D)">
                    <IconDuplicate />
                  </button>
                  <button type="button" className="mini" onClick={editor.copySel} aria-label="Copier" title="Copier (Ctrl/⌘ + C), puis coller sur n'importe quelle page avec Ctrl/⌘ + V">
                    <IconCopy />
                  </button>
                  <button type="button" className="mini" onClick={editor.toggleLock} aria-label={locked ? 'Déverrouiller' : 'Verrouiller'} aria-pressed={locked} title={locked ? 'Déverrouiller' : 'Verrouiller (ne bouge plus)'}>
                    {locked ? <IconUnlock /> : <IconLock />}
                  </button>
                  <button type="button" className="mini" onClick={editor.bringToFront} aria-label="Premier plan" title="Premier plan">
                    <IconToFront />
                  </button>
                  <button type="button" className="mini" onClick={editor.sendToBack} aria-label="Arrière-plan" title="Arrière-plan">
                    <IconToBack />
                  </button>
                  <button type="button" className="mini" onClick={editor.delSel} disabled={locked} aria-label="Supprimer" title={locked ? 'Déverrouille pour supprimer' : 'Supprimer (Suppr)'} style={{ color: '#a8322f' }}>
                    <IconTrash />
                  </button>
                </div>
                {locked && <div className="muted">Verrouillé : déverrouille pour le modifier.</div>}
                {!locked && selected.type === 'text' && (
                  <>
                    <TextArea editor={editor} item={selected} id="album-text" />
                    <FontPicker editor={editor} item={selected} className="mini" />
                  </>
                )}
                {!locked && selected.type === 'photo' && (
                  <button type="button" className="mini" aria-pressed={selected.frame} onClick={() => editor.patchSel({ frame: !selected.frame })}>
                    {selected.frame ? 'Cadre blanc : oui' : 'Cadre blanc : non'}
                  </button>
                )}
                {!locked && (
                  <div className="grid2" style={{ gap: 6 }}>
                    <button type="button" className="mini" onClick={() => editor.rotateSel(-15)} aria-label="Tourner à gauche">
                      <IconUndo />
                    </button>
                    <button type="button" className="mini" onClick={() => editor.rotateSel(15)} aria-label="Tourner à droite">
                      <IconRedoRot />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
          )}
        </div>
      </div>
    </div>
  );
}
