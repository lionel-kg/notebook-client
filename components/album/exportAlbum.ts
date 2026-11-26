import { getFontEmbedCSS, toJpeg, toSvg } from 'html-to-image';
import { PDFDocument } from 'pdf-lib';
import { PAGE_H, PAGE_W } from './types';

/** Nom de fichier lisible à partir du titre : « Nos escapades » → « nos-escapades » */
export function slugify(title: string) {
  return (
    title
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) || 'album'
  );
}

/**
 * Safari (et tous les navigateurs sur iPhone/iPad, qui utilisent son moteur) dessine parfois
 * une capture avant d'avoir peint les images qu'elle contient : les photos manquent.
 */
const isWebKit = () => typeof navigator !== 'undefined' && /AppleWebKit/i.test(navigator.userAgent) && !/(Chrome|Chromium|Edg|OPR|Android)\//i.test(navigator.userAgent);

const blobToDataUrl = (blob: Blob) =>
  new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = reject;
    r.readAsDataURL(blob);
  });

/**
 * Prépare les pages à capturer : chaque image (photos, stickers perso) est intégrée directement
 * dans la page (data URL) puis décodée, pour qu'aucune ne soit encore « en chargement » à la capture.
 */
export async function waitForContent(root: HTMLElement) {
  await document.fonts.ready;
  const imgs = Array.from(root.querySelectorAll('img'));
  await Promise.all(
    imgs.map(async (img) => {
      if (img.src.startsWith('data:')) return;
      try {
        const res = await fetch(img.src);
        if (!res.ok) return;
        img.src = await blobToDataUrl(await res.blob());
      } catch {
        // on garde l'image d'origine
      }
    }),
  );
  await Promise.all(
    imgs.map((img) => {
      if (img.complete) return img.decode().catch(() => undefined);
      return new Promise<void>((resolve) => {
        img.addEventListener('load', () => resolve(), { once: true });
        img.addEventListener('error', () => resolve(), { once: true });
      });
    }),
  );
}

/**
 * Polices à intégrer dans l'image. html-to-image ne détecte que les polices écrites en toutes lettres :
 * les textes de l'album passent par des variables CSS (var(--font-serif)…) qu'il ne reconnaît pas.
 * On lui donne donc un petit élément témoin qui utilise les trois polices de l'app sous leur vrai nom
 * (cela couvre aussi le texte des stickers dessinés).
 */
async function albumFontsCSS() {
  const root = getComputedStyle(document.documentElement);
  const probe = document.createElement('div');
  probe.style.cssText = 'position:fixed;left:-100000px;top:0';
  for (const v of ['--font-sans', '--font-serif', '--font-hand']) {
    const span = document.createElement('span');
    span.textContent = 'Aa';
    span.style.fontFamily = root.getPropertyValue(v).trim() || 'inherit';
    probe.appendChild(span);
  }
  document.body.appendChild(probe);
  try {
    return await getFontEmbedCSS(probe);
  } finally {
    probe.remove();
  }
}

/**
 * Prépare la capture : polices intégrées, puis une toute petite capture « pour rien »,
 * la première pouvant être dessinée avant que les polices soient prêtes.
 */
async function warmUp(node: HTMLElement) {
  const fontEmbedCSS = await albumFontsCSS();
  await toJpeg(node, { pixelRatio: 0.2, width: PAGE_W, height: PAGE_H, fontEmbedCSS }).catch(() => undefined);
  return fontEmbedCSS;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => img.decode().catch(() => undefined).then(() => resolve(img));
    img.onerror = reject;
    img.decoding = 'sync';
    img.src = src;
  });
}

/** Empreinte rapide du contenu du canvas, pour savoir si un nouveau dessin a changé quelque chose. */
function fingerprint(ctx: CanvasRenderingContext2D, w: number, h: number) {
  try {
    const d = ctx.getImageData(0, 0, w, h).data;
    let s = 0;
    for (let i = 0; i < d.length; i += 61) s = (s * 31 + d[i]) | 0;
    return s;
  } catch {
    return null;
  }
}

/**
 * Dessine une page dans un canvas.
 * La page est d'abord transformée en image SVG (html-to-image), puis dessinée.
 * Safari (Mac, et tous les navigateurs d'iPhone/iPad) ne décode les photos contenues dans ce SVG
 * qu'après un premier dessin, et parfois bien plus tard sur iPhone : le premier dessin n'a que des cadres vides.
 * Sur ce moteur on redessine donc la page jusqu'à ce que le résultat ne change plus.
 */
async function renderPage(node: HTMLElement, pixelRatio: number, fontEmbedCSS: string | undefined, background?: string) {
  const svg = await toSvg(node, { width: PAGE_W, height: PAGE_H, fontEmbedCSS });
  const img = await loadImage(svg);
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(PAGE_W * pixelRatio);
  canvas.height = Math.round(PAGE_H * pixelRatio);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas indisponible');
  const draw = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (background) {
      ctx.fillStyle = background;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  };
  draw();
  if (isWebKit()) {
    // au moins quelques passages (plus il y a d'images, plus il en faut), puis on attend que 3 dessins de suite soient identiques
    const minDraws = Math.max(4, node.querySelectorAll('img').length + 2);
    let prev = fingerprint(ctx, canvas.width, canvas.height);
    let stable = 0;
    for (let i = 1; i <= 40; i++) {
      await sleep(Math.min(100 + i * 25, 400));
      draw();
      const f = fingerprint(ctx, canvas.width, canvas.height);
      stable = f !== null && f === prev ? stable + 1 : 0;
      prev = f;
      if (i >= minDraws && stable >= 3) break;
    }
  }
  return canvas;
}

/** Libère tout de suite la mémoire du canvas (Safari sur iPhone en a très peu). */
const release = (canvas: HTMLCanvasElement) => {
  canvas.width = 0;
  canvas.height = 0;
};

/** Album complet en PDF : une page du PDF par page de l'album (format 460 × 600 pt, soit ~16 × 21 cm). */
export async function pagesToPdf(nodes: HTMLElement[], title: string, onProgress: (done: number) => void): Promise<Blob> {
  const pdf = await PDFDocument.create();
  pdf.setTitle(title);
  pdf.setCreator('Notre album');
  const fontEmbedCSS = nodes[0] ? await warmUp(nodes[0]) : undefined;
  for (const [i, node] of nodes.entries()) {
    const canvas = await renderPage(node, 2.5, fontEmbedCSS, '#ffffff');
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    release(canvas);
    const jpg = await pdf.embedJpg(dataUrl);
    const page = pdf.addPage([PAGE_W, PAGE_H]);
    page.drawImage(jpg, { x: 0, y: 0, width: PAGE_W, height: PAGE_H });
    onProgress(i + 1);
  }
  const bytes = await pdf.save();
  return new Blob([bytes as BlobPart], { type: 'application/pdf' });
}

/** Une page en image PNG haute définition (1380 × 1800 px). */
export async function pageToPng(node: HTMLElement): Promise<Blob> {
  const fontEmbedCSS = await warmUp(node);
  const canvas = await renderPage(node, 3, fontEmbedCSS);
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
  release(canvas);
  if (!blob) throw new Error("Impossible de créer l'image");
  return blob;
}

/** Télécharge un fichier généré dans le navigateur. */
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

/** Sur téléphone : feuille de partage du système (Enregistrer l'image, WhatsApp, Instagram…). */
export function canShareFile(file: File) {
  return typeof navigator !== 'undefined' && !!navigator.canShare?.({ files: [file] });
}
