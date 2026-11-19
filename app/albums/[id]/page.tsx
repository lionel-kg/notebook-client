'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { api, ApiError, type Album } from '@/lib/api';
import { useRequireUser } from '@/lib/useRequireUser';
import { AlbumEditor } from '@/components/album/AlbumEditor';
import type { Page } from '@/components/album/types';

export default function AlbumPage() {
  const user = useRequireUser();
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<{ album: Album; pages: Page[] } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !id) return;
    api
      .getAlbum(id)
      .then(setData)
      .catch((e) => setError(e instanceof ApiError ? e.message : 'Chargement impossible'));
  }, [user, id]);

  if (error) {
    return (
      <main className="shelf">
        <p className="form-error on-dark" role="alert">
          {error}
        </p>
        <Link href="/albums" className="btn">
          Retour à mes albums
        </Link>
      </main>
    );
  }

  if (!data) return <div className="desk-fill" />;

  return (
    <AlbumEditor
      albumId={data.album.id}
      title={data.album.title}
      subtitle={data.album.subtitle}
      deskColor={data.album.deskColor}
      initialPages={data.pages}
      onBack={async (flush) => {
        await flush();
        router.push('/albums');
      }}
    />
  );
}
