export type BgId = 'creme' | 'kraft' | 'blanc' | 'quadrille' | 'ligne' | 'toile';
export type StickerKind =
  | 'heart' | 'plane' | 'sun' | 'star' | 'camera' | 'flower' | 'post' | 'love' | 'tag' | 'tape'
  | 'suitcase' | 'palm' | 'pin' | 'ticket' | 'compass' | 'mountain' | 'wave' | 'icecream'
  | 'coffee' | 'moon' | 'cloud' | 'rainbow' | 'butterfly' | 'sparkle' | 'souvenir' | 'bisous';
export type Font = 'hand' | 'serif';
export type Tool = 'move' | 'draw' | 'erase';
export type DragMode = 'move' | 'size' | 'rot';

interface ItemBase {
  id: string;
  x: number;
  y: number;
  w: number;
  r: number;
  /** Verrouillé : ni déplacement, ni redimensionnement, ni rotation, ni suppression */
  locked?: boolean;
}

export interface PhotoItem extends ItemBase {
  type: 'photo';
  h: number;
  photoId: string;
  frame: boolean;
}

export interface StickerItem extends ItemBase {
  type: 'sticker';
  h: number;
  kind: StickerKind;
}

/** Sticker personnalisé, créé par quelqu'un à partir de sa propre image */
export interface CustomItem extends ItemBase {
  type: 'custom';
  h: number;
  stickerId: string;
}

export interface TextItem extends ItemBase {
  type: 'text';
  text: string;
  fs: number;
  color: string;
  font: Font;
}

export type Item = PhotoItem | StickerItem | CustomItem | TextItem;

export interface Point {
  x: number;
  y: number;
}

export interface Stroke {
  id: string;
  color: string;
  size: number;
  pts: Point[];
}

export interface Page {
  id: string;
  bg: BgId;
  items: Item[];
  strokes: Stroke[];
}

export interface Selection {
  p: number;
  id: string;
}

/** Dimensions logiques d'une page (toutes les coordonnées sont exprimées dans ce repère). */
export const PAGE_W = 460;
export const PAGE_H = 600;
