'use client';

import { useSyncExternalStore } from 'react';
import type { Item } from './types';

/**
 * Presse-papiers interne : un élément copié reste disponible pour toute la session de l'onglet,
 * d'une page à l'autre et d'un album à l'autre.
 */
export interface ClipboardEntry {
  albumId: string;
  item: Item;
}

let entry: ClipboardEntry | null = null;
const listeners = new Set<() => void>();

export const clipboard = {
  get: () => entry,
  set(next: ClipboardEntry) {
    entry = { albumId: next.albumId, item: { ...next.item } };
    listeners.forEach((l) => l());
  },
};

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

/** true quand un élément a été copié (pour afficher « Coller ») */
export function useHasClipboard() {
  return useSyncExternalStore(
    subscribe,
    () => entry !== null,
    () => false,
  );
}
