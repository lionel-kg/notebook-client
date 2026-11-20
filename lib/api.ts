import type { Page } from '@/components/album/types';

export interface User {
  id: string;
  username: string;
}

export interface AlbumSummary {
  id: string;
  title: string;
  subtitle: string;
  deskColor: string;
  createdAt: string;
  updatedAt: string;
  pageCount: number;
  photoCount: number;
}

export interface Album {
  id: string;
  title: string;
  subtitle: string;
  deskColor: string;
  updatedAt: string;
}

export interface PublicAlbumSummary {
  id: string;
  title: string;
  subtitle: string;
  deskColor: string;
  updatedAt: string;
  owner: string;
  pageCount: number;
  photoCount: number;
}

export interface PublicAlbum extends Album {
  owner: string;
}

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body && !(init.body instanceof FormData)) headers.set('Content-Type', 'application/json');
  const res = await fetch(`/api${path}`, { ...init, headers, credentials: 'same-origin' });
  if (res.status === 204) return undefined as T;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, data.error ?? 'Erreur réseau');
  return data as T;
}

export const api = {
  me: () => request<{ user: User }>('/auth/me'),
  login: (username: string, password: string) =>
    request<{ user: User }>('/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) }),
  register: (username: string, password: string) =>
    request<{ user: User }>('/auth/register', { method: 'POST', body: JSON.stringify({ username, password }) }),
  logout: () => request<void>('/auth/logout', { method: 'POST' }),

  publicAlbums: () => request<{ albums: PublicAlbumSummary[] }>('/public/albums'),
  publicAlbum: (id: string) =>
    request<{ album: PublicAlbum; pages: Page[]; canEdit: boolean; isOwner: boolean }>(`/public/albums/${encodeURIComponent(id)}`),

  listAlbums: () => request<{ albums: AlbumSummary[] }>('/albums'),
  createAlbum: (title: string, subtitle: string) =>
    request<{ album: Album }>('/albums', { method: 'POST', body: JSON.stringify({ title, subtitle }) }),
  getAlbum: (id: string) => request<{ album: Album; pages: Page[] }>(`/albums/${id}`),
  updateAlbum: (id: string, data: Partial<Pick<Album, 'title' | 'subtitle' | 'deskColor'>>) =>
    request<{ album: Album }>(`/albums/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteAlbum: (id: string) => request<void>(`/albums/${id}`, { method: 'DELETE' }),
  /** `clientId` identifie l'onglet : il ne se renvoie pas à lui-même sa propre modification en temps réel. */
  savePages: (id: string, pages: Page[], clientId?: string) =>
    request<{ ok: true; savedAt: string }>(`/albums/${id}/pages`, {
      method: 'PUT',
      body: JSON.stringify({ pages }),
      headers: clientId ? { 'X-Client-Id': clientId } : undefined,
    }),
  uploadPhoto: (albumId: string, blob: Blob, width: number, height: number) => {
    const fd = new FormData();
    fd.append('width', String(width));
    fd.append('height', String(height));
    fd.append('photo', blob, 'photo.jpg');
    return request<{ photo: { id: string; width: number; height: number } }>(`/albums/${albumId}/photos`, {
      method: 'POST',
      body: fd,
    });
  },
};

export const photoUrl = (photoId: string) => `/api/photos/${photoId}`;
