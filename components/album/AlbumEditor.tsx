'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { api } from '@/lib/api';
import { DesktopEditor } from './DesktopEditor';
import { ExportStage } from './ExportStage';
import { canShareFile, downloadBlob, pagesToPdf, pageToPng, slugify } from './exportAlbum';
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

  /* ---------- Export : album en PDF, page en image ---------- */
  type Job = { kind: 'pdf' | 'png'; indices: number[]; done: number };
  const [job, setJob] = useState<Job | null>(null);
  const jobRef = useRef(job);
  jobRef.current = job;
  // Sur téléphone, le fichier prêt est proposé au partage (le geste de l'utilisateur est requis).
  const [readyFile, setReadyFile] = useState<File | null>(null);
  const pageName = (i: number) => (i === 0 ? 'couverture' : i === editor.pages.length - 1 ? 'dos' : `page-${i}`);

  const startExport = (kind: Job['kind'], indices: number[]) => {
    if (jobRef.current) return;
    setReadyFile(null);
    setJob({ kind, indices, done: 0 });
  };
  const onStageReady = async (nodes: HTMLElement[]) => {
    const j = jobRef.current;
    if (!j) return;
    try {
      const name = j.kind === 'pdf' ? `${slugify(title)}.pdf` : `${slugify(title)}-${pageName(j.indices[0])}.png`;
      const blob = j.kind === 'pdf' ? await pagesToPdf(nodes, title, (done) => setJob((cur) => cur && { ...cur, done })) : await pageToPng(nodes[0]);
      const file = new File([blob], name, { type: blob.type });
      if (window.matchMedia('(pointer: coarse)').matches && canShareFile(file)) setReadyFile(file);
      else downloadBlob(blob, name);
    } catch {
      editor.showError("L'export a échoué, réessaie");
    } finally {
      setJob(null);
    }
  };

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
    exporting: !!job,
    onExportPdf: () => startExport('pdf', editor.pages.map((_, i) => i)),
    onExportPage: (i: number) => startExport('png', [i]),
    onBack: () => onBack(editor.flush),
  };
  return (
    <>
      {wide ? <DesktopEditor {...props} /> : <MobileEditor {...props} />}
      {!editing && viewIndex !== -1 && (
        <PhotoLightbox photos={photos} index={viewIndex} onIndex={(i) => setViewing(photos[i])} onClose={() => setViewing(null)} />
      )}
      {job && (
        <>
          <ExportStage pages={editor.pages} indices={job.indices} total={editor.pages.length} onReady={onStageReady} />
          <div className="export-overlay" role="status">
            <span className="spin" aria-hidden="true" />
            {job.kind === 'pdf' ? `Création du PDF… ${job.done} / ${job.indices.length}` : "Création de l'image…"}
          </div>
        </>
      )}
      {readyFile && (
        <div className="toast export-ready" role="dialog" aria-label="Export prêt">
          <span>{readyFile.type === 'application/pdf' ? 'Ton PDF est prêt' : 'Ton image est prête'}</span>
          <button
            type="button"
            className="chip"
            onClick={() => {
              navigator.share({ files: [readyFile], title }).catch(() => undefined);
              setReadyFile(null);
            }}
          >
            Partager
          </button>
          <button
            type="button"
            className="chip"
            onClick={() => {
              downloadBlob(readyFile, readyFile.name);
              setReadyFile(null);
            }}
          >
            Enregistrer
          </button>
          <button type="button" onClick={() => setReadyFile(null)} aria-label="Fermer">
            ×
          </button>
        </div>
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
