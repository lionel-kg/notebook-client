'use client';

import { useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/api';
import { DesktopEditor } from './DesktopEditor';
import { MobileEditor } from './MobileEditor';
import { PhotoLightbox } from './PhotoLightbox';
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
  /** La personne connectée peut modifier l'album (sinon : aperçu uniquement) */
  canEdit: boolean;
  /** Ouvrir directement en mode modification (ex. album tout juste créé) */
  startInEdit?: boolean;
  /** Auteur affiché quand l'album appartient à quelqu'un d'autre */
  owner?: string;
  backLabel?: string;
  /** Lien « Se connecter pour modifier » proposé aux visiteurs */
  loginHref?: string;
}

export function AlbumEditor({ albumId, title, subtitle, deskColor, initialPages, onBack, onDeleted, canEdit, startInEdit = false, owner, backLabel, loginHref }: Props) {
  const wide = useWideLayout();
  const editor = useAlbumEditor(albumId, initialPages, wide === false);

  // Aperçu par défaut ; le mode modification est réservé aux personnes connectées.
  const [mode, setMode] = useState<'preview' | 'edit'>(startInEdit && canEdit ? 'edit' : 'preview');
  const editing = canEdit && mode === 'edit';
  const toggleMode = () => {
    editor.setSel(null);
    setViewing(null);
    setMode((m) => (m === 'edit' ? 'preview' : 'edit'));
  };

  // Photo affichée en plein écran (aperçu), parmi toutes les photos de l'album dans l'ordre des pages
  const [viewing, setViewing] = useState<string | null>(null);
  const photos = useMemo(() => editor.pages.flatMap((p) => p.items.flatMap((it) => (it.type === 'photo' ? [it.photoId] : []))), [editor.pages]);
  const viewIndex = viewing ? photos.indexOf(viewing) : -1;

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
    readOnly: !editing,
    owner,
    backLabel,
    loginHref: canEdit ? undefined : loginHref,
    viewers: live.viewers,
    lastEditor: live.lastEditor,
    onToggleMode: canEdit ? toggleMode : undefined,
    onPhotoClick: setViewing,
    onBack: () => onBack(editor.flush),
  };
  return (
    <>
      {wide ? <DesktopEditor {...props} /> : <MobileEditor {...props} />}
      {!editing && viewIndex !== -1 && (
        <PhotoLightbox photos={photos} index={viewIndex} onIndex={(i) => setViewing(photos[i])} onClose={() => setViewing(null)} />
      )}
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
