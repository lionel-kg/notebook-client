import type { SaveState } from './useAlbumEditor';

const LABELS: Record<SaveState, string> = {
  saved: 'Enregistré',
  pending: 'Modifications…',
  saving: 'Enregistrement…',
  error: 'Non enregistré',
};

export function SaveStatus({ state, uploading, className }: { state: SaveState; uploading: number; className?: string }) {
  const text = uploading > 0 ? `Envoi de ${uploading} photo${uploading > 1 ? 's' : ''}…` : LABELS[state];
  return (
    <div className={className} role="status" aria-live="polite" data-state={uploading > 0 ? 'saving' : state}>
      <span className="dot" aria-hidden="true" />
      {text}
    </div>
  );
}
