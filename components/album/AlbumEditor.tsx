'use client';

import { useEffect, useState } from 'react';
import { DesktopEditor } from './DesktopEditor';
import { MobileEditor } from './MobileEditor';
import { useAlbumEditor } from './useAlbumEditor';
import type { Page } from './types';

/** Le livre ouvert en double page demande de la place ; sinon on passe en mode page par page. */
function useWideLayout() {
  const [wide, setWide] = useState<boolean | null>(null);
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1100px) and (min-height: 620px)');
    const update = () => setWide(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);
  return wide;
}

interface Props {
  albumId: string;
  title: string;
  subtitle: string;
  deskColor: string;
  initialPages: Page[];
  onBack: (flush: () => Promise<void>) => void;
  /** Lecture seule : on feuillette l'album sans pouvoir le modifier (visiteur). */
  readOnly?: boolean;
  /** Auteur affiché en lecture seule */
  owner?: string;
  backLabel?: string;
}

export function AlbumEditor({ albumId, title, subtitle, deskColor, initialPages, onBack, readOnly = false, owner, backLabel }: Props) {
  const wide = useWideLayout();
  const editor = useAlbumEditor(albumId, initialPages, wide === false);

  if (wide === null) return null;

  const props = { editor, title, subtitle, deskColor, readOnly, owner, backLabel, onBack: () => onBack(editor.flush) };
  return (
    <>
      {wide ? <DesktopEditor {...props} /> : <MobileEditor {...props} />}
      {editor.error && (
        <div className="toast" role="alert">
          <span>{editor.error}</span>
          <button type="button" onClick={editor.clearError} aria-label="Fermer">
            ×
          </button>
        </div>
      )}
    </>
  );
}
