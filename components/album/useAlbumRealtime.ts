'use client';

import { useEffect, useRef, useState } from 'react';
import type { Page } from './types';

type ServerEvent =
  | { type: 'presence'; count: number }
  | { type: 'pages'; pages: Page[]; by: string; clientId: string | null }
  | { type: 'deleted'; by: string };

interface Handlers {
  /** Nouvel état de l'album enregistré par quelqu'un d'autre */
  onPages: (pages: Page[], by: string) => void;
  /** L'album vient d'être supprimé par son auteur */
  onDeleted: (by: string) => void;
  /** Reconnexion après une coupure : des changements ont pu être manqués */
  onResync: () => void;
}

/**
 * S'abonne aux changements d'un album via WebSocket (/api/ws, relayé par Next.js vers l'API).
 * Se reconnecte tout seul (attente croissante, jusqu'à 30 s) après une coupure réseau.
 */
export function useAlbumRealtime(albumId: string, clientId: string, handlers: Handlers) {
  const [viewers, setViewers] = useState(1);
  const [lastEditor, setLastEditor] = useState<string | null>(null);
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    let ws: WebSocket | null = null;
    let retry = 0;
    let retryTimer: ReturnType<typeof setTimeout> | undefined;
    let editorTimer: ReturnType<typeof setTimeout> | undefined;
    let stopped = false;
    let everConnected = false;

    const connect = () => {
      const proto = window.location.protocol === 'https:' ? 'wss' : 'ws';
      ws = new WebSocket(`${proto}://${window.location.host}/api/ws?album=${encodeURIComponent(albumId)}`);

      ws.onopen = () => {
        retry = 0;
        // Après une coupure, on recharge l'album pour rattraper les changements manqués.
        if (everConnected) handlersRef.current.onResync();
        everConnected = true;
      };

      ws.onmessage = (ev) => {
        let msg: ServerEvent;
        try {
          msg = JSON.parse(String(ev.data));
        } catch {
          return;
        }
        if (msg.type === 'presence') setViewers(Math.max(1, msg.count));
        else if (msg.type === 'deleted') handlersRef.current.onDeleted(msg.by);
        else if (msg.type === 'pages' && msg.clientId !== clientId) {
          handlersRef.current.onPages(msg.pages, msg.by);
          setLastEditor(msg.by);
          clearTimeout(editorTimer);
          editorTimer = setTimeout(() => setLastEditor(null), 4000);
        }
      };

      ws.onclose = () => {
        if (stopped) return;
        setViewers(1);
        retryTimer = setTimeout(connect, Math.min(30_000, 1000 * 2 ** retry++));
      };
    };

    connect();
    return () => {
      stopped = true;
      clearTimeout(retryTimer);
      clearTimeout(editorTimer);
      ws?.close();
    };
  }, [albumId, clientId]);

  return { viewers, lastEditor };
}
