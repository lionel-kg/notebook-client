'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { DesktopEditor } from './DesktopEditor';
import { MobileEditor } from './MobileEditor';
import { useAlbumEditor } from './useAlbumEditor';
import { useAlbumRealtime } from './useAlbumRealtime';
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
  /** L'album a été supprimé pendant qu'on le regardait */
  onDeleted: (by: string) => void;
  /** Lecture seule : on feuillette l'album sans pouvoir le modifier (visiteur). */
  readOnly?: boolean;
  /** Auteur affiché quand l'album appartient à quelqu'un d'autre */
  owner?: string;
  backLabel?: string;
  /** Lien « Se connecter pour modifier » proposé aux visiteurs */
  loginHref?: string;
}

export function AlbumEditor({ albumId, title, subtitle, deskColor, initialPages, onBack, onDeleted, readOnly = false, owner, backLabel, loginHref }: Props) {
  const wide = useWideLayout();
  const editor = useAlbumEditor(albumId, initialPages, wide === false);

  // Changements des autres personnes en temps réel
  const live = useAlbumRealtime(albumId, editor.clientId, {
    onPages: (pages) => editor.applyRemote(pages),
    onDeleted,
    onResync: () => {
      api
        .publicAlbum(albumId)
        .then((r) => editor.applyRemote(r.pages))
        .catch(() => undefined);
    },
  });

  if (wide === null) return null;

  const props = {
    editor,
    title,
    subtitle,
    deskColor,
    readOnly,
    owner,
    backLabel,
    loginHref,
    viewers: live.viewers,
    lastEditor: live.lastEditor,
    onBack: () => onBack(editor.flush),
  };
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
