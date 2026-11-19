'use client';

import { useRef } from 'react';
import type { AlbumEditor } from './useAlbumEditor';
import type { TextItem } from './types';

/** Zone de saisie du texte sélectionné : une seule entrée d'historique par séance de frappe. */
export function TextArea({ editor, item, id }: { editor: AlbumEditor; item: TextItem; id: string }) {
  const typedRef = useRef(false);
  return (
    <>
      <label className="vh" htmlFor={id}>
        Texte
      </label>
      <textarea
        id={id}
        className="txt"
        value={item.text}
        onFocus={() => {
          typedRef.current = false;
        }}
        onChange={(e) => {
          editor.patchSel({ text: e.target.value }, !typedRef.current);
          typedRef.current = true;
        }}
      />
    </>
  );
}

export function FontPicker({ editor, item, className }: { editor: AlbumEditor; item: TextItem; className: string }) {
  const ring = 'inset 0 0 0 2px #2d6cc0';
  return (
    <div className="grid2">
      <button
        type="button"
        className={className}
        aria-pressed={item.font !== 'serif'}
        onClick={() => editor.patchSel({ font: 'hand' })}
        style={{ fontFamily: 'var(--font-hand)', fontSize: 19, boxShadow: item.font !== 'serif' ? ring : 'none' }}
      >
        Manuscrit
      </button>
      <button
        type="button"
        className={className}
        aria-pressed={item.font === 'serif'}
        onClick={() => editor.patchSel({ font: 'serif' })}
        style={{ fontFamily: 'var(--font-serif)', fontSize: 14, boxShadow: item.font === 'serif' ? ring : 'none' }}
      >
        Élégant
      </button>
    </div>
  );
}
