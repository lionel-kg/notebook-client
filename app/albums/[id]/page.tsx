'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { api, ApiError, type PublicAlbum } from '@/lib/api';
import { AlbumEditor } from '@/components/album/AlbumEditor';
import type { Page } from '@/components/album/types';

/** Album public : l'auteur le modifie, tout le monde peut le feuilleter sans compte. */
export default function AlbumPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<{ album: PublicAlbum; pages: Page[]; canEdit: boolean } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    api
      .publicAlbum(id)
      .then(setData)
      .catch((e) => setError(e instanceof ApiError ? e.message : 'Chargement impossible'));
  }, [id]);

  if (error) {
    return (
      <main className="shelf">
        <p className="form-error on-dark" role="alert">
          {error}
        </p>
        <Link href="/" className="btn">
          Retour à la galerie
        </Link>
      </main>
    );
  }

  if (!data) return <div className="desk-fill" />;

  const { album, pages, canEdit } = data;
  return (
    <AlbumEditor
      albumId={album.id}
      title={album.title}
      subtitle={album.subtitle}
      deskColor={album.deskColor}
      initialPages={pages}
      readOnly={!canEdit}
      owner={album.owner}
      backLabel={canEdit ? 'Albums' : 'Galerie'}
      onBack={async (flush) => {
        if (canEdit) await flush();
        router.push(canEdit ? '/albums' : '/');
      }}
    />
  );
}
