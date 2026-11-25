'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { BG_DEFS, BG_ORDER, COLORS, IDLE_RING, SELECT_RING, SIZES, STICKERS } from './constants';
import { IconBack, IconBrush, IconChevronLeft, IconChevronRight, IconCursor, IconEraser, IconEye, IconPencil, IconPhoto, IconPlus, IconRedoRot, IconText, IconUndo } from './Icons';
import { PageView } from './PageView';
import { SaveStatus } from './SaveStatus';
import { StickerArt } from './Sticker';
import { FontPicker, TextArea } from './TextEditor';
import { blankPage, type AlbumEditor } from './useAlbumEditor';
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
export function DesktopEditor({ editor, title, subtitle, deskColor, onBack, readOnly = false, owner, backLabel = 'Albums', loginHref, viewers = 1, lastEditor = null, onToggleMode, onPhotoClick }: Props) {
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
    const activeRing = !readOnly && isVisible && real === activeIdx ? ', inset 0 0 0 3px rgba(246,193,67,.8)' : '';
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
        onPageDown={() => {
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

  return (
    <div className="desk" style={{ backgroundColor: deskColor }}>
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
          <div className="book-wrap">
            <div className="book" style={{ transform: `translateX(${kk === 0 ? -230 : kk === L ? 230 : 0}px)` }}>
              {leaves}
            </div>
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
          </div>
          {!readOnly && <SaveStatus className="save d-save" state={editor.saveState} uploading={editor.uploading} />}

          {/* Stickers, fond, sélection */}
          {!readOnly && (
          <div className="card d-side">
            <div className="h">Stickers</div>
            <div className="grid2" style={{ gap: 6 }}>
              {STICKERS.map((s) => (
                <button
                  key={s.kind}
                  type="button"
                  className="sk"
                  aria-label={s.label}
                  onClick={() => {
                    setTool('move');
                    editor.addSticker(activeIdx, s.kind);
                  }}
                >
                  <StickerArt kind={s.kind} />
                </button>
              ))}
            </div>
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
            {hasSel && selected && (
              <>
                {selected.type === 'text' && (
                  <>
                    <TextArea editor={editor} item={selected} id="album-text" />
                    <FontPicker editor={editor} item={selected} className="mini" />
                  </>
                )}
                {selected.type === 'photo' && (
                  <button type="button" className="mini" aria-pressed={selected.frame} onClick={() => editor.patchSel({ frame: !selected.frame })}>
                    {selected.frame ? 'Cadre blanc : oui' : 'Cadre blanc : non'}
                  </button>
                )}
                <div className="grid2" style={{ gap: 6 }}>
                  <button type="button" className="mini" onClick={() => editor.rotateSel(-15)} aria-label="Tourner à gauche">
                    <IconUndo />
                  </button>
                  <button type="button" className="mini" onClick={() => editor.rotateSel(15)} aria-label="Tourner à droite">
                    <IconRedoRot />
                  </button>
                </div>
                <button type="button" className="mini" onClick={editor.delSel} style={{ color: '#a8322f' }}>
                  Supprimer
                </button>
              </>
            )}
          </div>
          )}
        </div>
      </div>
    </div>
  );
}
