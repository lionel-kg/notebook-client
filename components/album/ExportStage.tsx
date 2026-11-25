'use client';

import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { PageView } from './PageView';
import { waitForContent } from './exportAlbum';
import type { Page } from './types';

interface Props {
  pages: Page[];
  /** Index des pages à rendre (dans l'album) */
  indices: number[];
  total: number;
  onReady: (nodes: HTMLElement[]) => void;
}

/**
 * Rend les pages à plat, hors de l'écran, pour les capturer en image (export PDF / PNG) :
 * pas de rotation 3D, pas de zoom, pas d'outils.
 */
export function ExportStage({ pages, indices, total, onReady }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const readyRef = useRef(onReady);
  readyRef.current = onReady;

  useEffect(() => {
    let alive = true;
    const root = rootRef.current;
    if (!root) return;
    void waitForContent(root).then(() => {
      if (!alive) return;
      readyRef.current(Array.from(root.querySelectorAll<HTMLElement>('.pg')));
    });
    return () => {
      alive = false;
    };
  }, []);

  return createPortal(
    <div ref={rootRef} className="export-stage" aria-hidden="true">
      {indices.map((i) => {
        const inner = i !== 0 && i !== total - 1;
        return (
          <div key={pages[i].id} className="export-page">
            <PageView
              page={pages[i]}
              index={-100 - i}
              interactive={false}
              tool="move"
              selId={null}
              live={null}
              showEmptyHint={false}
              pageNum={inner ? String(i) : undefined}
              touch={false}
              style={{ boxShadow: 'none', borderRadius: 0 }}
            />
          </div>
        );
      })}
    </div>,
    document.body,
  );
}
