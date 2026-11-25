'use client';

import { useEffect, useRef } from 'react';
import { photoUrl } from '@/lib/api';
import { IconChevronLeft, IconChevronRight, IconClose } from './Icons';

interface Props {
  /** Toutes les photos de l'album, dans l'ordre des pages */
  photos: string[];
  index: number;
  onIndex: (i: number) => void;
  onClose: () => void;
}

/** Photo en plein écran (mode aperçu). Flèches / glisser pour passer d'une photo à l'autre, Échap pour fermer. */
export function PhotoLightbox({ photos, index, onIndex, onClose }: Props) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const swipe = useRef<{ x: number; y: number } | null>(null);
  const count = photos.length;
  const prev = () => index > 0 && onIndex(index - 1);
  const next = () => index < count - 1 && onIndex(index + 1);

  useEffect(() => {
    closeRef.current?.focus();
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowLeft' && index > 0) onIndex(index - 1);
      else if (e.key === 'ArrowRight' && index < count - 1) onIndex(index + 1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [index, count, onIndex, onClose]);

  return (
    <div
      className="lightbox"
      role="dialog"
      aria-modal="true"
      aria-label={`Photo ${index + 1} sur ${count}`}
      onClick={(e) => e.target === e.currentTarget && onClose()}
      onPointerDown={(e) => (swipe.current = { x: e.clientX, y: e.clientY })}
      onPointerUp={(e) => {
        const s = swipe.current;
        swipe.current = null;
        if (!s || e.pointerType === 'mouse') return;
        const dx = e.clientX - s.x;
        if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(e.clientY - s.y)) {
          if (dx < 0) next();
          else prev();
        }
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img key={photos[index]} src={photoUrl(photos[index])} alt={`Photo ${index + 1} sur ${count}`} draggable={false} />

      <button ref={closeRef} type="button" className="lb-btn lb-close" onClick={onClose} aria-label="Fermer">
        <IconClose size={24} />
      </button>
      {count > 1 && (
        <>
          <button type="button" className="lb-btn lb-prev" onClick={prev} disabled={index === 0} aria-label="Photo précédente">
            <IconChevronLeft size={26} />
          </button>
          <button type="button" className="lb-btn lb-next" onClick={next} disabled={index === count - 1} aria-label="Photo suivante">
            <IconChevronRight size={26} />
          </button>
          <div className="lb-count">
            {index + 1} / {count}
          </div>
        </>
      )}
    </div>
  );
}
