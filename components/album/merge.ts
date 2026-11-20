import type { Page } from './types';

/**
 * Fusion à trois voies, utilisée quand une modification arrive d'une autre personne
 * alors qu'on a soi-même des changements pas encore enregistrés.
 *
 * - base   : dernier état connu du serveur (point de départ de nos changements locaux)
 * - local  : notre état actuel
 * - remote : le nouvel état reçu du serveur
 *
 * Les éléments que l'on n'a pas touchés (même objet que dans `base`) prennent la version distante ;
 * ceux que l'on a modifiés gardent la nôtre. Les ajouts des deux côtés sont conservés.
 */
export function mergePages(base: Page[], local: Page[], remote: Page[]): Page[] {
  if (local === base) return remote;
  return mergeList(base, local, remote, (b, l, r) => ({
    ...l,
    bg: l.bg !== b.bg ? l.bg : r.bg,
    items: mergeList(b.items, l.items, r.items),
    strokes: mergeList(b.strokes, l.strokes, r.strokes),
  }));
}

function mergeList<T extends { id: string }>(
  base: T[],
  local: T[],
  remote: T[],
  mergeBoth?: (b: T, l: T, r: T) => T,
): T[] {
  if (local === base) return remote;
  const baseMap = new Map(base.map((x) => [x.id, x]));
  const localMap = new Map(local.map((x) => [x.id, x]));
  const remoteIds = new Set(remote.map((x) => x.id));

  // 1. On part de l'ordre distant.
  const out: T[] = [];
  for (const r of remote) {
    const l = localMap.get(r.id);
    const b = baseMap.get(r.id);
    if (l === undefined) {
      if (b === undefined) out.push(r); // ajouté par quelqu'un d'autre
      // sinon : supprimé localement → on le retire
    } else if (l === b) {
      out.push(r); // pas touché chez nous → version distante
    } else {
      out.push(b && mergeBoth ? mergeBoth(b, l, r) : l); // modifié chez nous → notre version
    }
  }

  // 2. Éléments présents chez nous mais plus côté serveur.
  local.forEach((l, i) => {
    if (remoteIds.has(l.id)) return;
    const b = baseMap.get(l.id);
    if (b !== undefined && l === b) return; // supprimé par quelqu'un d'autre et pas touché chez nous
    // Ajouté (ou modifié) chez nous : on le replace après son voisin local précédent.
    let at = 0;
    for (let j = i - 1; j >= 0; j--) {
      const k = out.findIndex((x) => x.id === local[j].id);
      if (k !== -1) {
        at = k + 1;
        break;
      }
    }
    out.splice(at, 0, l);
  });

  return out;
}
