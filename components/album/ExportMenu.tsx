'use client';

import { useEffect, useRef, useState } from 'react';
import { IconDownload } from './Icons';

export interface ExportAction {
  label: string;
  onSelect: () => void;
}

interface Props {
  actions: ExportAction[];
  disabled?: boolean;
  /** Bouton texte (ordinateur) ou icône seule (téléphone) */
  compact?: boolean;
  /** Le menu s'ouvre au-dessus du bouton (barre du bas) ou en dessous (en-tête) */
  placement?: 'up' | 'down';
}

/** Bouton « Exporter » et son menu (album en PDF, page en image…). */
export function ExportMenu({ actions, disabled, compact, placement = 'down' }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: PointerEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === 'Escape' : !ref.current?.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener('pointerdown', close);
    window.addEventListener('keydown', close);
    return () => {
      window.removeEventListener('pointerdown', close);
      window.removeEventListener('keydown', close);
    };
  }, [open]);

  return (
    <div className="export-menu" ref={ref}>
      <button
        type="button"
        className={compact ? 'ic' : 'btn ghost'}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Exporter"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
      >
        <IconDownload size={compact ? 22 : 18} />
        {!compact && 'Exporter'}
      </button>
      {open && (
        <div className={`export-pop ${placement}`} role="menu">
          {actions.map((a) => (
            <button
              key={a.label}
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                a.onSelect();
              }}
            >
              {a.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
