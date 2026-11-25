'use client';

import { useEffect, useState, type ChangeEvent } from 'react';
import { ApiError, stickersApi, stickerUrl, type CustomSticker } from '@/lib/api';
import { STICKERS } from './constants';
import { IconClose, IconPlus } from './Icons';
import { prepareSticker } from './image';
import { StickerArt } from './Sticker';
import type { StickerKind } from './types';

interface Props {
  onPick: (kind: StickerKind) => void;
  onPickCustom: (sticker: CustomSticker) => void;
  onError: (message: string) => void;
  /** Disposition : colonne étroite (ordinateur) ou tiroir du bas (téléphone) */
  variant: 'side' | 'sheet';
}

/** Stickers dessinés + « Mes stickers » créés à partir de ses propres images. */
export function StickerPalette({ onPick, onPickCustom, onError, variant }: Props) {
  const [tab, setTab] = useState<'builtin' | 'mine'>('builtin');
  const [mine, setMine] = useState<CustomSticker[] | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (tab !== 'mine' || mine) return;
    stickersApi
      .list()
      .then((r) => setMine(r.stickers))
      .catch(() => setMine([]));
  }, [tab, mine]);

  const create = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = '';
    if (!files.length) return;
    setBusy(true);
    try {
      for (const file of files) {
        const img = await prepareSticker(file);
        if (!img) throw new Error("Impossible de lire l'image");
        const { sticker } = await stickersApi.create(img.blob, img.width, img.height);
        setMine((list) => [sticker, ...(list ?? [])]);
      }
    } catch (err) {
      onError(err instanceof ApiError || err instanceof Error ? err.message : 'Création du sticker impossible');
    } finally {
      setBusy(false);
    }
  };

  const remove = async (st: CustomSticker) => {
    if (!window.confirm('Retirer ce sticker de ta palette ? Il reste là où il est déjà collé.')) return;
    try {
      await stickersApi.remove(st.id);
      setMine((list) => list?.filter((x) => x.id !== st.id) ?? null);
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Suppression impossible');
    }
  };

  return (
    <div className={`stk-palette ${variant}`}>
      <div className="stk-tabs" role="tablist">
        <button type="button" role="tab" aria-selected={tab === 'builtin'} onClick={() => setTab('builtin')}>
          Stickers
        </button>
        <button type="button" role="tab" aria-selected={tab === 'mine'} onClick={() => setTab('mine')}>
          Mes stickers
        </button>
      </div>

      {tab === 'builtin' && (
        <div className="stk-grid">
          {STICKERS.map((s) => (
            <button key={s.kind} type="button" className="sk" aria-label={s.label} title={s.label.replace(/^Ajouter /, '')} onClick={() => onPick(s.kind)}>
              <StickerArt kind={s.kind} />
            </button>
          ))}
        </div>
      )}

      {tab === 'mine' && (
        <div className="stk-grid">
          <label className="sk sk-add" aria-label="Créer un sticker à partir d'une image" title="Créer un sticker à partir d'une image (PNG transparent idéal)">
            {busy ? <span className="spin" aria-hidden="true" /> : <IconPlus size={22} />}
            <input type="file" accept="image/*" multiple className="vh" onChange={create} disabled={busy} />
          </label>
          {mine === null && <div className="muted">Chargement…</div>}
          {mine?.map((st) => (
            <div key={st.id} className="sk-wrap">
              <button type="button" className="sk" aria-label="Ajouter ce sticker" onClick={() => onPickCustom(st)}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={stickerUrl(st.id)} alt="" className="custom-stk" draggable={false} />
              </button>
              <button type="button" className="sk-del" aria-label="Retirer ce sticker de ma palette" onClick={() => remove(st)}>
                <IconClose size={12} />
              </button>
            </div>
          ))}
          {mine?.length === 0 && <div className="muted stk-hint">Ajoute une image (un PNG détouré rend le mieux) pour en faire un sticker.</div>}
        </div>
      )}
    </div>
  );
}
