import type { BgId, StickerKind } from './types';

export interface BgDef {
  color: string;
  img: string;
  size: string;
  /** Taille du motif dans la petite pastille de choix */
  swatchSize: string;
  dark: boolean;
  label: string;
}

export const BG_DEFS: Record<BgId, BgDef> = {
  creme: { color: '#f6efe2', img: 'none', size: 'auto', swatchSize: 'auto', dark: false, label: 'Fond crème' },
  kraft: {
    color: '#d6bd94',
    img: 'radial-gradient(rgba(90,60,30,.14) 1px, transparent 1.4px)',
    size: '7px 7px',
    swatchSize: '7px 7px',
    dark: false,
    label: 'Fond kraft',
  },
  blanc: { color: '#ffffff', img: 'none', size: 'auto', swatchSize: 'auto', dark: false, label: 'Fond blanc' },
  quadrille: {
    color: '#fdfbf6',
    img: 'linear-gradient(rgba(70,110,170,.16) 1px, transparent 1px), linear-gradient(90deg, rgba(70,110,170,.16) 1px, transparent 1px)',
    size: '22px 22px',
    swatchSize: '8px 8px',
    dark: false,
    label: 'Fond quadrillé',
  },
  ligne: {
    color: '#f6efe2',
    img: 'repeating-linear-gradient(transparent 0 27px, rgba(80,60,40,.18) 27px 28px)',
    size: 'auto',
    swatchSize: 'auto',
    dark: false,
    label: 'Fond ligné',
  },
  toile: {
    color: '#5c1b27',
    img: 'radial-gradient(rgba(255,255,255,.05) 1px, transparent 1.2px)',
    size: '5px 5px',
    swatchSize: '5px 5px',
    dark: true,
    label: 'Fond toile bordeaux',
  },
};

export const BG_ORDER: BgId[] = ['creme', 'kraft', 'blanc', 'quadrille', 'ligne', 'toile'];

export const COLORS: { c: string; label: string }[] = [
  { c: '#2b2b2b', label: 'Noir' },
  { c: '#ffffff', label: 'Blanc' },
  { c: '#c8323c', label: 'Rouge' },
  { c: '#e57fa0', label: 'Rose' },
  { c: '#e9a23b', label: 'Or' },
  { c: '#2f8a57', label: 'Vert' },
  { c: '#2d6cc0', label: 'Bleu' },
  { c: '#7a4fb5', label: 'Violet' },
];

export const SIZES: { s: number; label: string }[] = [
  { s: 3, label: 'Fin' },
  { s: 7, label: 'Moyen' },
  { s: 14, label: 'Épais' },
];

export const STICKERS: { kind: StickerKind; label: string }[] = [
  { kind: 'heart', label: 'Ajouter un cœur' },
  { kind: 'plane', label: 'Ajouter un avion' },
  { kind: 'sun', label: 'Ajouter un soleil' },
  { kind: 'star', label: 'Ajouter une étoile' },
  { kind: 'camera', label: 'Ajouter un appareil photo' },
  { kind: 'flower', label: 'Ajouter une fleur' },
  { kind: 'post', label: 'Ajouter un timbre' },
  { kind: 'tape', label: 'Ajouter du washi tape' },
  { kind: 'love', label: "Ajouter l'étiquette je t'aime" },
  { kind: 'tag', label: "Ajouter l'étiquette on y retourne" },
  { kind: 'suitcase', label: 'Ajouter une valise' },
  { kind: 'palm', label: 'Ajouter un palmier' },
  { kind: 'pin', label: 'Ajouter un repère de carte' },
  { kind: 'ticket', label: 'Ajouter un billet' },
  { kind: 'compass', label: 'Ajouter une boussole' },
  { kind: 'mountain', label: 'Ajouter une montagne' },
  { kind: 'wave', label: 'Ajouter une vague' },
  { kind: 'icecream', label: 'Ajouter une glace' },
  { kind: 'coffee', label: 'Ajouter un café' },
  { kind: 'moon', label: 'Ajouter une lune' },
  { kind: 'cloud', label: 'Ajouter un nuage' },
  { kind: 'rainbow', label: 'Ajouter un arc-en-ciel' },
  { kind: 'butterfly', label: 'Ajouter un papillon' },
  { kind: 'sparkle', label: 'Ajouter des étincelles' },
  { kind: 'souvenir', label: "Ajouter l'étiquette souvenir" },
  { kind: 'bisous', label: "Ajouter l'étiquette bisous" },
];

const STICKER_SIZES: Record<StickerKind, [number, number]> = {
  heart: [80, 80],
  plane: [80, 80],
  sun: [80, 80],
  star: [80, 80],
  camera: [80, 80],
  flower: [80, 80],
  post: [64, 78],
  love: [132, 46],
  tag: [140, 46],
  tape: [120, 32],
  suitcase: [80, 80],
  palm: [84, 84],
  pin: [70, 70],
  ticket: [120, 64],
  compass: [76, 76],
  mountain: [84, 84],
  wave: [100, 50],
  icecream: [70, 70],
  coffee: [76, 76],
  moon: [76, 76],
  cloud: [84, 84],
  rainbow: [96, 60],
  butterfly: [80, 80],
  sparkle: [72, 72],
  souvenir: [132, 46],
  bisous: [112, 46],
};

/** Sur téléphone/tablette les stickers sont un peu plus grands pour être faciles à attraper. */
export function stickerSize(kind: StickerKind, touch: boolean): [number, number] {
  const [w, h] = STICKER_SIZES[kind];
  return touch ? [Math.round(w * 1.125), Math.round(h * 1.125)] : [w, h];
}

export const SELECT_RING = '0 0 0 2px #fbf8f2, 0 0 0 4px #2d6cc0';
export const IDLE_RING = 'inset 0 0 0 1px rgba(0,0,0,.18)';
