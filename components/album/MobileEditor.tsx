'use client';

import Link from 'next/link';
import { useEffect, useLayoutEffect, useRef, useState, type ChangeEvent } from 'react';
import { BG_DEFS, BG_ORDER, COLORS, IDLE_RING, SELECT_RING, SIZES, STICKERS } from './constants';
import {
  IconBack,
  IconBrush,
  IconCamera,
  IconChevronLeft,
  IconChevronRight,
  IconEraser,
  IconEye,
  IconFrame,
  IconHeart,
  IconPage,
  IconPencil,
  IconPhoto,
  IconPlus,
  IconRedoRot,
  IconText,
  IconTrash,
  IconUndo,
} from './Icons';
import { LiveBadge } from './DesktopEditor';
import { PageView } from './PageView';
import { SaveStatus } from './SaveStatus';
import { StickerArt } from './Sticker';
import { FontPicker, TextArea } from './TextEditor';
import { blankPage, type AlbumEditor } from './useAlbumEditor';
import { PAGE_H, PAGE_W } from './types';
import type { Tool } from './types';

type Tab = 'photos' | 'stickers' | 'dessin' | 'texte' | 'page';
const FLIP_MS = 820;

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

/** Vue téléphone / tablette : une page à la fois, on glisse pour tourner, panneau d'outils en bas. */
export function MobileEditor({ editor, title, subtitle, deskColor, onBack, readOnly = false, owner, backLabel = 'Albums', loginHref, viewers = 1, lastEditor = null, onToggleMode, onPhotoClick }: Props) {
  const { pages, sel, selected } = editor;
  const n = pages.length;

  const [pi, setPi] = useState(0);
  const [flipping, setFlipping] = useState<number | null>(null);
  const [tab, setTabState] = useState<Tab>('photos');
  const [pen, setPen] = useState<'draw' | 'erase'>('draw');
  const flipTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // En aperçu, on ne dessine pas : la page se tourne en glissant.
  const tool: Tool = !readOnly && tab === 'dessin' ? pen : 'move';
  const cur = Math.min(pi, n - 1);

  useEffect(() => {
    if (pi > n - 1) setPi(n - 1);
  }, [pi, n]);
  useEffect(() => () => {
    if (flipTimer.current) clearTimeout(flipTimer.current);
  }, []);

  /* ---------- Taille de la page selon l'espace disponible ---------- */
  const stageRef = useRef<HTMLDivElement>(null);
  const [s, setS] = useState(0.8);
  useLayoutEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setS(Math.max(0.3, Math.min((width - 16) / PAGE_W, (height - 10) / PAGE_H)));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const startFlip = (page: number | null) => {
    setFlipping(page);
    if (flipTimer.current) clearTimeout(flipTimer.current);
    flipTimer.current = setTimeout(() => setFlipping(null), FLIP_MS);
  };

  const go = (dir: 1 | -1) => {
    if (flipping !== null) return;
    const np = cur + dir;
    if (np < 0 || np > n - 1) return;
    setPi(np);
    editor.setSel(null);
    startFlip(dir > 0 ? cur : np);
  };

  const setTab = (t: Tab) => {
    if (t === 'dessin' || !selected) editor.setSel(null);
    setTabState(t);
  };

  const addPage = () => {
    if (flipping !== null) return;
    const ins = cur >= n - 1 ? n - 1 : cur + 1;
    editor.insertPages(ins, [blankPage()]);
    setPi(ins);
    if (ins > cur) startFlip(cur);
  };

  const canDelPage = cur !== 0 && cur !== n - 1 && n > 3;
  const delPage = () => {
    if (!canDelPage) return;
    if (!window.confirm('Supprimer cette page et tout son contenu ?')) return;
    editor.removePages([cur]);
    setPi(Math.min(cur, n - 3));
  };

  const onFiles = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = '';
    void editor.addPhotos(cur, files);
  };

  const curColor = tab === 'texte' && selected?.type === 'text' ? selected.color : editor.color;
  const pickColor = (c: string) => {
    editor.setColor(c, tab === 'texte');
    if (tab === 'dessin') setPen('draw');
  };

  const hasSel = !!selected && tool === 'move';
  const label = cur === 0 ? 'Couverture' : cur === n - 1 ? 'Dos de l’album' : `Page ${cur} / ${n - 2}`;
  const tabColor = (t: Tab) => (tab === t ? '#7a2238' : '#6b5a48');

  const colorRow = (sizePx: number) => (
    <div className="m-colors">
      {COLORS.map((c) => (
        <button key={c.c} type="button" className="sw" aria-label={`Couleur ${c.label}`} aria-pressed={curColor === c.c} onClick={() => pickColor(c.c)}>
          <span style={{ width: sizePx, height: sizePx, borderRadius: '50%', backgroundColor: c.c, boxShadow: curColor === c.c ? SELECT_RING : IDLE_RING }} />
        </button>
      ))}
    </div>
  );

  return (
    <div className={readOnly ? 'm-root ro' : 'm-root'} style={{ backgroundColor: deskColor }}>
      <header className="m-head">
        <button type="button" className="ic" onClick={onBack} aria-label={backLabel === 'Galerie' ? 'Retour à la galerie' : 'Retour à mes albums'}>
          <IconBack size={22} />
        </button>
        <div className="m-title">
          <span className="serif">{title}</span>
          {subtitle && <span className="hand">{subtitle}</span>}
          {owner && <span className="by">par {owner}</span>}
        </div>
        {!readOnly && (
          <>
            {onToggleMode && (
              <button type="button" className="ic" onClick={onToggleMode} aria-label="Passer en mode aperçu">
                <IconEye size={22} />
              </button>
            )}
            <SaveStatus className="save m-save" state={editor.saveState} uploading={editor.uploading} />
            <button type="button" className="ic" onClick={editor.undo} disabled={!editor.canUndo} aria-label="Annuler la dernière action">
              <IconUndo size={22} />
            </button>
          </>
        )}
      </header>

      <div className="m-stage" ref={stageRef}>
        <div className="m-book" style={{ width: PAGE_W * s + 6, height: PAGE_H * s + 6 }}>
          <div className="m-book-inner" style={{ transform: `scale(${s})` }}>
            <div className="m-depth" style={{ left: 6, top: 6, background: '#e2d6c0', boxShadow: '0 14px 30px rgba(0,0,0,.35)' }} />
            <div className="m-depth" style={{ left: 3, top: 3, background: '#ece2cf' }} />
            {pages.map((page, i) => {
              const isVisible = i === cur && flipping === null;
              const inner = i !== 0 && i !== n - 1;
              return (
                <PageView
                  key={page.id}
                  page={page}
                  index={i}
                  touch
                  interactive={!readOnly && isVisible}
                  tool={tool}
                  selId={sel && sel.p === i ? sel.id : null}
                  live={editor.live && editor.live.p === i ? { pts: editor.live.pts, color: editor.color, size: editor.size } : null}
                  showEmptyHint={!readOnly && inner}
                  style={{
                    transform: `rotateY(${i < cur ? -180 : 0}deg)`,
                    zIndex: flipping === i ? n + 10 : i < cur ? i + 1 : n - i,
                    transformOrigin: 'left center',
                    transition: 'transform .8s cubic-bezier(.645,.045,.355,1)',
                    touchAction: 'none',
                    boxShadow: 'inset 14px 0 18px -14px rgba(40,25,10,.35), 0 10px 24px rgba(0,0,0,.3)',
                    borderRadius: '4px 12px 12px 4px',
                  }}
                  onPageDown={(e) => {
                    if (tool !== 'move' || flipping !== null || i !== cur) return;
                    editor.setSel(null);
                    editor.swipeDown(e, go);
                  }}
                  onPhotoClick={readOnly && isVisible ? onPhotoClick : undefined}
                  onItemDown={(e, id, mode) => {
                    if (readOnly || tool !== 'move' || flipping !== null) return;
                    const it = editor.itemDown(e, i, id, mode);
                    if (it?.type === 'text') setTabState('texte');
                  }}
                  onInkDown={(e) => {
                    if (readOnly || flipping !== null || tool === 'move') return;
                    editor.inkDown(e, i, pen);
                  }}
                />
              );
            })}
          </div>
        </div>
      </div>

      <div className="m-nav">
        {!hasSel ? (
          <div className="m-nav-row">
            <button type="button" className="ic soft" onClick={() => go(-1)} disabled={cur === 0} aria-label="Page précédente">
              <IconChevronLeft size={22} />
            </button>
            <div className="m-label">
              <span>{label}</span>
              {lastEditor || viewers > 1 ? (
                <LiveBadge viewers={viewers} lastEditor={lastEditor} />
              ) : (
                <small>glisse la page pour tourner</small>
              )}
            </div>
            <button type="button" className="ic soft" onClick={() => go(1)} disabled={cur === n - 1} aria-label="Page suivante">
              <IconChevronRight size={22} />
            </button>
          </div>
        ) : (
          <div className="m-selbar">
            <button type="button" className="ic" onClick={() => editor.rotateSel(-15)} aria-label="Tourner à gauche">
              <IconUndo size={20} />
            </button>
            <button type="button" className="ic" onClick={() => editor.rotateSel(15)} aria-label="Tourner à droite">
              <IconRedoRot size={20} />
            </button>
            {selected?.type === 'photo' && (
              <button
                type="button"
                className="ic"
                onClick={() => editor.patchSel({ frame: !selected.frame })}
                aria-label={selected.frame ? 'Retirer le cadre blanc' : 'Ajouter un cadre blanc'}
                aria-pressed={selected.frame}
                style={{ background: selected.frame ? '#e6d9c2' : 'transparent' }}
              >
                <IconFrame size={20} />
              </button>
            )}
            <button type="button" className="ic" onClick={editor.delSel} aria-label="Supprimer l'élément" style={{ color: '#a8322f' }}>
              <IconTrash size={20} />
            </button>
            <button type="button" className="chip" onClick={() => editor.setSel(null)} style={{ background: '#2b3340', color: '#f6efe2' }}>
              OK
            </button>
          </div>
        )}
      </div>

      {readOnly && (onToggleMode || loginHref) && (
        <div className="m-login">
          {onToggleMode ? (
            <button type="button" className="btn" onClick={onToggleMode}>
              <IconPencil />
              Modifier l&apos;album
            </button>
          ) : (
            <Link href={loginHref!} className="btn">
              Se connecter pour modifier
            </Link>
          )}
        </div>
      )}

      {!readOnly && (
      <div className="m-sheet">
        <div className="m-drawer">
          {tab === 'photos' && (
            <>
              <div className="h">Ajouter sur la page affichée</div>
              <div className="grid2" style={{ gap: 10 }}>
                <label className="big">
                  <IconPhoto size={22} />
                  Galerie
                  <input type="file" accept="image/*" multiple className="vh" onChange={onFiles} />
                </label>
                <label className="big light">
                  <IconCamera size={22} />
                  Appareil photo
                  <input type="file" accept="image/*" capture="environment" className="vh" onChange={onFiles} />
                </label>
              </div>
              <div className="muted">Choisis plusieurs photos d&apos;un coup. Touche une photo pour la déplacer, l&apos;agrandir ou la tourner.</div>
            </>
          )}

          {tab === 'stickers' && (
            <>
              <div className="h">Touche un sticker pour le coller</div>
              <div className="m-stickers">
                {STICKERS.map((st) => (
                  <button key={st.kind} type="button" className="sk" aria-label={st.label} onClick={() => editor.addSticker(cur, st.kind)}>
                    <StickerArt kind={st.kind} />
                  </button>
                ))}
              </div>
            </>
          )}

          {tab === 'dessin' && (
            <>
              <div className="m-row-between">
                <div className="row" style={{ gap: 6 }}>
                  {(
                    [
                      ['draw', 'Pinceau', <IconBrush key="b" />],
                      ['erase', 'Gomme', <IconEraser key="e" />],
                    ] as const
                  ).map(([p, name, icon]) => (
                    <button
                      key={p}
                      type="button"
                      className="chip"
                      aria-pressed={pen === p}
                      onClick={() => setPen(p)}
                      style={{ background: pen === p ? '#2b3340' : '#efe6d6', color: pen === p ? '#f6efe2' : '#3d2f22' }}
                    >
                      {icon}
                      {name}
                    </button>
                  ))}
                </div>
                <div className="row">
                  {SIZES.map((z) => (
                    <button
                      key={z.s}
                      type="button"
                      className="sw"
                      aria-label={`Trait ${z.label.toLowerCase()}`}
                      aria-pressed={editor.size === z.s}
                      onClick={() => {
                        editor.setSize(z.s);
                        setPen('draw');
                      }}
                      style={{ boxShadow: editor.size === z.s ? 'inset 0 0 0 2px #2d6cc0' : 'none' }}
                    >
                      <span style={{ width: Math.max(6, z.s + 4), height: Math.max(6, z.s + 4), borderRadius: '50%', backgroundColor: '#3d2f22' }} />
                    </button>
                  ))}
                </div>
              </div>
              {colorRow(30)}
              <div className="muted">Dessine directement sur la page, même par-dessus les photos.</div>
            </>
          )}

          {tab === 'texte' && (
            <>
              {selected?.type === 'text' ? (
                <>
                  <TextArea editor={editor} item={selected} id="m-text" />
                  {colorRow(28)}
                  <FontPicker editor={editor} item={selected} className="chip" />
                </>
              ) : (
                <>
                  <button type="button" className="big" onClick={() => editor.addText(cur)}>
                    <IconText size={22} />
                    Ajouter un texte
                  </button>
                  <div className="muted">Touche un texte de la page pour le réécrire, changer sa couleur ou son style.</div>
                </>
              )}
            </>
          )}

          {tab === 'page' && (
            <>
              <div className="h">Fond de la page</div>
              <div className="m-colors">
                {BG_ORDER.map((id) => {
                  const b = BG_DEFS[id];
                  const on = pages[cur]?.bg === id;
                  return (
                    <button key={id} type="button" className="sw" aria-label={b.label} aria-pressed={on} onClick={() => editor.setBg(cur, id)}>
                      <span
                        style={{
                          width: 34,
                          height: 34,
                          borderRadius: 9,
                          backgroundColor: b.color,
                          backgroundImage: b.img,
                          backgroundSize: b.swatchSize,
                          boxShadow: on ? SELECT_RING : IDLE_RING,
                        }}
                      />
                    </button>
                  );
                })}
              </div>
              <div className="grid2" style={{ gap: 10 }}>
                <button type="button" className="big" onClick={addPage}>
                  <IconPlus size={22} />
                  Nouvelle page
                </button>
                <button type="button" className="big light" onClick={delPage} disabled={!canDelPage} style={{ color: '#a8322f' }}>
                  Supprimer la page
                </button>
              </div>
            </>
          )}
        </div>

        <nav className="m-tabs" aria-label="Outils">
          {(
            [
              ['photos', 'Photos', <IconPhoto key="p" size={24} />],
              ['stickers', 'Stickers', <IconHeart key="s" size={24} />],
              ['dessin', 'Dessin', <IconBrush key="d" size={24} />],
              ['texte', 'Texte', <IconText key="t" size={24} />],
              ['page', 'Page', <IconPage key="g" size={24} />],
            ] as const
          ).map(([t, name, icon]) => (
            <button key={t} type="button" className="tab" aria-pressed={tab === t} onClick={() => setTab(t)} style={{ color: tabColor(t) }}>
              {icon}
              {name}
            </button>
          ))}
        </nav>
      </div>
      )}
    </div>
  );
}
