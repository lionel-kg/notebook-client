'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState, type FormEvent } from 'react';
import { api, ApiError, type AlbumSummary } from '@/lib/api';
import { useRequireUser } from '@/lib/useRequireUser';
import { IconPlus, IconTrash } from '@/components/album/Icons';

export default function AlbumsPage() {
  const user = useRequireUser();
  const router = useRouter();
  const [albums, setAlbums] = useState<AlbumSummary[] | null>(null);
  const [title, setTitle] = useState('Nos escapades');
  const [subtitle, setSubtitle] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user) return;
    api
      .listAlbums()
      .then((r) => setAlbums(r.albums))
      .catch((e) => setError(e instanceof ApiError ? e.message : 'Chargement impossible'));
  }, [user]);

  const create = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const { album } = await api.createAlbum(title, subtitle);
      router.push(`/albums/${album.id}?edit=1`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Création impossible');
      setBusy(false);
    }
  };

  const remove = async (a: AlbumSummary) => {
    if (!window.confirm(`Supprimer définitivement « ${a.title} » et toutes ses photos ?`)) return;
    try {
      await api.deleteAlbum(a.id);
      setAlbums((list) => list?.filter((x) => x.id !== a.id) ?? null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Suppression impossible');
    }
  };

  const logout = async () => {
    await api.logout().catch(() => undefined);
    router.replace('/login');
  };

  if (!user) return <div className="desk-fill" />;

  return (
    <main className="shelf">
      <header className="shelf-head">
        <div className="d-title">
          <span className="serif">Mes albums</span>
          <span className="hand">bonjour {user.username}</span>
        </div>
        <div className="row">
          <Link href="/" className="btn ghost">
            Galerie publique
          </Link>
          <button type="button" className="btn ghost" onClick={logout}>
            Se déconnecter
          </button>
        </div>
      </header>

      {error && (
        <p className="form-error on-dark" role="alert">
          {error}
        </p>
      )}

      <div className="shelf-grid">
        <form className="card new-album" onSubmit={create}>
          <div className="h">Nouvel album</div>
          <div className="field">
            <label htmlFor="title">Titre de la couverture</label>
            <input id="title" required maxLength={80} value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="subtitle">Sous-titre (facultatif)</label>
            <input id="subtitle" maxLength={80} placeholder="Prénom & Prénom" value={subtitle} onChange={(e) => setSubtitle(e.target.value)} />
          </div>
          <button type="submit" className="big" disabled={busy || !title.trim()}>
            <IconPlus size={20} />
            {busy ? 'Création…' : "Créer l'album"}
          </button>
        </form>

        {albums === null && !error && <div className="muted on-dark">Chargement…</div>}

        {albums?.map((a) => (
          <article key={a.id} className="album-card">
            <Link href={`/albums/${a.id}`} className="album-cover">
              <span className="serif">{a.title}</span>
              {a.subtitle && <span className="hand">{a.subtitle}</span>}
            </Link>
            <div className="album-meta">
              <div>
                <strong>{a.pageCount} pages</strong> · {a.photoCount} photo{a.photoCount > 1 ? 's' : ''}
                <br />
                <small>Modifié le {new Date(a.updatedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</small>
              </div>
              <button type="button" className="ic" onClick={() => remove(a)} aria-label={`Supprimer l'album ${a.title}`} style={{ color: '#a8322f' }}>
                <IconTrash size={20} />
              </button>
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}
