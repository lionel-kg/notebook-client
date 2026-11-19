'use client';

import { useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from 'react';
import { photoUrl } from '@/lib/api';
import { BG_DEFS } from './constants';
import { eraserRadius } from './eraser';
import { StickerArt } from './Sticker';
import { PAGE_H, PAGE_W } from './types';
import type { DragMode, Page, Point, Tool } from './types';

function pathD(pts: Point[]): string {
  const f = (n: number) => Math.round(n * 10) / 10;
  if (!pts.length) return '';
  if (pts.length === 1) return `M${f(pts[0].x)} ${f(pts[0].y)} L${f(pts[0].x + 0.1)} ${f(pts[0].y + 0.1)}`;
  let d = `M${f(pts[0].x)} ${f(pts[0].y)}`;
  for (let i = 1; i < pts.length - 1; i++) {
    const mx = (pts[i].x + pts[i + 1].x) / 2;
    const my = (pts[i].y + pts[i + 1].y) / 2;
    d += ` Q${f(pts[i].x)} ${f(pts[i].y)} ${f(mx)} ${f(my)}`;
  }
  const l = pts[pts.length - 1];
  return `${d} L${f(l.x)} ${f(l.y)}`;
}

export interface PageViewProps {
  /** null : face vierge (complète une double page quand le nombre de pages est impair) */
  page: Page | null;
  index: number;
  style?: CSSProperties;
  /** La page est visible et manipulable */
  interactive: boolean;
  tool: Tool;
  selId: string | null;
  live: { pts: Point[]; color: string; size: number } | null;
  showEmptyHint: boolean;
  pageNum?: string;
  touch: boolean;
  onPageDown?: (e: ReactPointerEvent) => void;
  onItemDown?: (e: ReactPointerEvent, id: string, mode: DragMode) => void;
  onInkDown?: (e: ReactPointerEvent) => void;
}

export function PageView({
  page,
  index,
  style,
  interactive,
  tool,
  selId,
  live,
  showEmptyHint,
  pageNum,
  touch,
  onPageDown,
  onItemDown,
  onInkDown,
}: PageViewProps) {
  const bg = BG_DEFS[page?.bg ?? 'creme'];
  const hintColor = bg.dark ? 'rgba(246,239,226,.75)' : '#7a6650';
  const items = page?.items ?? [];
  const strokes = page?.strokes ?? [];
  const empty = showEmptyHint && items.length === 0 && strokes.length === 0 && !live;
  const pad = touch ? 12 : 10;

  // Cercle qui montre la taille de la gomme sous le pointeur.
  const [eraserAt, setEraserAt] = useState<Point | null>(null);
  const erasing = interactive && tool === 'erase';
  const trackEraser = (e: ReactPointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const sc = rect.width / PAGE_W || 1;
    setEraserAt({ x: (e.clientX - rect.left) / sc, y: (e.clientY - rect.top) / sc });
  };

  return (
    <div
      className="pg"
      data-page={index}
      onPointerDown={onPageDown}
      style={{
        backgroundColor: bg.color,
        backgroundImage: bg.img,
        backgroundSize: bg.size,
        ...style,
      }}
    >
      {empty && (
        <div className="pg-empty" style={{ color: hintColor }}>
          <div className="pg-empty-k">PAGE VIDE</div>
          <div className="pg-empty-t">ajoute des photos, des stickers, ou dessine</div>
        </div>
      )}

      {items.map((it, n) => {
        const isSel = it.id === selId && tool === 'move';
        return (
          <div
            key={it.id}
            className="item"
            onPointerDown={(e) => onItemDown?.(e, it.id, 'move')}
            style={{
              left: it.x,
              top: it.y,
              width: it.w,
              height: it.type === 'text' ? 'auto' : it.h,
              transform: `rotate(${it.r}deg)`,
              zIndex: n + 1,
              outline: isSel ? `${touch ? 3 : 2}px dashed #2d6cc0` : 'none',
              outlineOffset: 5,
              pointerEvents: interactive && tool === 'move' ? 'auto' : 'none',
            }}
          >
            {it.type === 'photo' && (
              <div className="photo" style={{ padding: it.frame ? pad : 0, backgroundColor: it.frame ? '#ffffff' : 'transparent' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photoUrl(it.photoId)} alt="Photo de l'album" draggable={false} />
              </div>
            )}
            {it.type === 'text' && (
              <div
                className="txt-item"
                style={{
                  fontFamily: it.font === 'serif' ? 'var(--font-serif)' : 'var(--font-hand)',
                  fontSize: it.fs,
                  color: it.color,
                }}
              >
                {it.text}
              </div>
            )}
            {it.type === 'sticker' && <StickerArt kind={it.kind} className="stk" />}
            {isSel && (
              <>
                <button
                  type="button"
                  className="handle rot"
                  aria-label="Tourner"
                  onPointerDown={(e) => onItemDown?.(e, it.id, 'rot')}
                >
                  <span />
                </button>
                <button
                  type="button"
                  className="handle size"
                  aria-label="Redimensionner"
                  onPointerDown={(e) => onItemDown?.(e, it.id, 'size')}
                >
                  <span />
                </button>
              </>
            )}
          </div>
        );
      })}

      <div
        className="ink"
        onPointerDown={(e) => {
          if (erasing) trackEraser(e);
          onInkDown?.(e);
        }}
        onPointerMove={erasing ? trackEraser : undefined}
        onPointerLeave={() => setEraserAt(null)}
        onPointerUp={(e) => e.pointerType !== 'mouse' && setEraserAt(null)}
        style={{
          pointerEvents: interactive && tool !== 'move' ? 'auto' : 'none',
          cursor: tool === 'erase' ? 'none' : 'crosshair',
        }}
      >
        {erasing && eraserAt && (
          <div
            className="eraser-ring"
            aria-hidden="true"
            style={{
              left: eraserAt.x - eraserRadius(touch),
              top: eraserAt.y - eraserRadius(touch),
              width: eraserRadius(touch) * 2,
              height: eraserRadius(touch) * 2,
            }}
          />
        )}
        {(strokes.length > 0 || live) && (
          <svg width={PAGE_W} height={PAGE_H} viewBox={`0 0 ${PAGE_W} ${PAGE_H}`} aria-hidden="true">
            {strokes.map((s) => (
              <path key={s.id} d={pathD(s.pts)} stroke={s.color} strokeWidth={s.size} fill="none" strokeLinecap="round" strokeLinejoin="round" />
            ))}
            {live && <path d={pathD(live.pts)} stroke={live.color} strokeWidth={live.size} fill="none" strokeLinecap="round" strokeLinejoin="round" />}
          </svg>
        )}
      </div>

      {pageNum && (
        <div className="pg-num" style={{ color: hintColor }}>
          {pageNum}
        </div>
      )}
    </div>
  );
}
