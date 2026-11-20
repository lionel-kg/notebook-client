'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { api, ApiError, type PublicAlbumSummary, type User } from '@/lib/api';

/** Galerie publique : tous les albums, consultables sans compte. */
export default function GalleryPage() {
  const [albums, setAlbums] = useState<PublicAlbumSummary[] | null>(null);
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .publicAlbums()
      .then((r) => setAlbums(r.albums))
      .catch((e) => setError(e instanceof ApiError ? e.message : 'Chargement impossible'));
    api
      .me()
      .then((r) => setUser(r.user))
      .catch(() => setUser(null));
  }, []);

  return (
    <main className="shelf">
      <header className="shelf-head">
        <div className="d-title">
          <span className="serif">Les albums</span>
          <span className="hand">à feuilleter librement</span>
        </div>
        {user === undefined ? null : user ? (
          <Link href="/albums" className="btn">
            Mes albums
          </Link>
        ) : (
          <div className="row">
            <Link href="/login" className="btn ghost">
              Se connecter
            </Link>
            <Link href="/register" className="btn">
              Créer mon album
            </Link>
          </div>
        )}
      </header>

      {error && (
        <p className="form-error on-dark" role="alert">
          {error}
        </p>
      )}

      {albums === null && !error && <div className="muted on-dark">Chargement…</div>}
      {albums?.length === 0 && <div className="muted on-dark">Aucun album pour le moment.</div>}

      <div className="shelf-grid">
        {albums?.map((a) => (
          <article key={a.id} className="album-card">
            <Link href={`/albums/${a.id}`} className="album-cover">
              <span className="serif">{a.title}</span>
              {a.subtitle && <span className="hand">{a.subtitle}</span>}
            </Link>
            <div className="album-meta">
              <div>
                <strong>par {a.owner}</strong> · {a.photoCount} photo{a.photoCount > 1 ? 's' : ''}
                <br />
                <small>Mis à jour le {new Date(a.updatedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</small>
              </div>
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}
