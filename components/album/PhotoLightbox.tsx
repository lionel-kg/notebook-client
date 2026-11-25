'use client';

import { useEffect, useRef } from 'react';
import { photoUrl } from '@/lib/api';
import { IconChevronLeft, IconChevronRight, IconClose, IconZoomIn, IconZoomOut } from './Icons';
import { usePanZoom, usePinchZoom, useWheelZoom } from './usePanZoom';

interface Props {
  /** Toutes les photos de l'album, dans l'ordre des pages */
  photos: string[];
  index: number;
  onIndex: (i: number) => void;
  onClose: () => void;
}

const DOUBLE_ZOOM = 2.5;

/**
 * Photo en plein écran (mode aperçu).
 * Zoom : pincement, molette, double-clic / double-tap, boutons −/+ ou touches + / − / 0.
 * Zoomé, on glisse pour se déplacer ; sinon on glisse pour passer à la photo suivante.
 */
export function PhotoLightbox({ photos, index, onIndex, onClose }: Props) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const pz = usePanZoom(4);
  const { zoomed, zoomBy, reset, panDown } = pz;
  useWheelZoom(pz, true);
  const pinching = usePinchZoom(pz);

  const gesture = useRef<{ x: number; y: number; moved: boolean } | null>(null);
  const lastTap = useRef<{ t: number; x: number; y: number } | null>(null);
  const count = photos.length;
  const prev = () => index > 0 && onIndex(index - 1);
  const next = () => index < count - 1 && onIndex(index + 1);

  useEffect(() => {
    closeRef.current?.focus();
  }, []);

  // Nouvelle photo : on repart sans zoom.
  useEffect(() => {
    reset();
  }, [index, reset]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowLeft' && index > 0 && !zoomed) onIndex(index - 1);
      else if (e.key === 'ArrowRight' && index < count - 1 && !zoomed) onIndex(index + 1);
      else if (e.key === '+' || e.key === '=') zoomBy(1.5);
      else if (e.key === '-') zoomBy(1 / 1.5);
      else if (e.key === '0') reset();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [index, count, onIndex, onClose, zoomed, zoomBy, reset]);

  const toggleZoomAt = (x: number, y: number) => (zoomed ? reset() : zoomBy(DOUBLE_ZOOM, x, y));

  return (
    <div
      ref={pz.viewportRef}
      className="lightbox"
      role="dialog"
      aria-modal="true"
      aria-label={`Photo ${index + 1} sur ${count}`}
      style={{ cursor: zoomed ? 'grab' : undefined }}
      onPointerDown={(e) => {
        if ((e.target as HTMLElement).closest('button')) return;
        gesture.current = { x: e.clientX, y: e.clientY, moved: false };
        // Zoomé : glisser déplace la photo (souris ou doigt).
        if (zoomed) {
          const g = gesture.current;
          panDown(e);
          const watch = (ev: PointerEvent) => {
            if (Math.hypot(ev.clientX - g.x, ev.clientY - g.y) > 6) g.moved = true;
          };
          window.addEventListener('pointermove', watch);
          window.addEventListener('pointerup', () => window.removeEventListener('pointermove', watch), { once: true });
        }
      }}
      onPointerUp={(e) => {
        const g = gesture.current;
        gesture.current = null;
        if (!g || pinching) return;
        const dx = e.clientX - g.x;
        const dy = e.clientY - g.y;
        const moved = g.moved || Math.hypot(dx, dy) > 10;
        // Pas zoomé + glissement horizontal au doigt : photo précédente / suivante
        if (!zoomed && e.pointerType !== 'mouse' && Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
          if (dx < 0) next();
          else prev();
          return;
        }
        if (moved || e.pointerType === 'mouse') return;
        // Double-tap au doigt
        const now = Date.now();
        const lt = lastTap.current;
        if (lt && now - lt.t < 300 && Math.hypot(e.clientX - lt.x, e.clientY - lt.y) < 30) {
          lastTap.current = null;
          toggleZoomAt(e.clientX, e.clientY);
        } else {
          lastTap.current = { t: now, x: e.clientX, y: e.clientY };
        }
      }}
      onClick={(e) => {
        // Clic sur le fond (hors photo) pour fermer, seulement sans zoom
        if (e.target === e.currentTarget && !zoomed && e.detail === 1) onClose();
      }}
      onDoubleClick={(e) => {
        if ((e.target as HTMLElement).closest('button')) return;
        toggleZoomAt(e.clientX, e.clientY);
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={(el) => {
          pz.contentRef.current = el;
        }}
        key={photos[index]}
        src={photoUrl(photos[index])}
        alt={`Photo ${index + 1} sur ${count}`}
        draggable={false}
        style={{ transform: pz.transform, cursor: zoomed ? 'grab' : 'zoom-in' }}
      />

      <div className="lb-zoom">
        <button type="button" className="lb-btn" onClick={() => zoomBy(1 / 1.5)} disabled={!zoomed} aria-label="Dézoomer">
          <IconZoomOut size={22} />
        </button>
        <button type="button" className="lb-btn" onClick={() => zoomBy(1.5)} disabled={pz.s >= 4} aria-label="Zoomer">
          <IconZoomIn size={22} />
        </button>
      </div>
      <button ref={closeRef} type="button" className="lb-btn lb-close" onClick={onClose} aria-label="Fermer">
        <IconClose size={24} />
      </button>
      {count > 1 && !zoomed && (
        <>
          <button type="button" className="lb-btn lb-prev" onClick={prev} disabled={index === 0} aria-label="Photo précédente">
            <IconChevronLeft size={26} />
          </button>
          <button type="button" className="lb-btn lb-next" onClick={next} disabled={index === count - 1} aria-label="Photo suivante">
            <IconChevronRight size={26} />
          </button>
        </>
      )}
      <div className="lb-count">{zoomed ? `${Math.round(pz.s * 100)} %` : count > 1 ? `${index + 1} / ${count}` : ''}</div>
    </div>
  );
}
