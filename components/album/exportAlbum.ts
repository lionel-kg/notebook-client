import { getFontEmbedCSS, toBlob, toJpeg } from 'html-to-image';
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

/**
 * Capture d'une page. Sur Safari, une ou deux captures « à blanc » d'abord : elles forcent le navigateur
 * à peindre les images, la capture suivante les contient.
 */
async function capture<T>(render: () => Promise<T>, prime: () => Promise<unknown>): Promise<T> {
  if (isWebKit()) {
    await prime().catch(() => undefined);
    await prime().catch(() => undefined);
  }
  return render();
}

/** Album complet en PDF : une page du PDF par page de l'album (format 460 × 600 pt, soit ~16 × 21 cm). */
export async function pagesToPdf(nodes: HTMLElement[], title: string, onProgress: (done: number) => void): Promise<Blob> {
  const pdf = await PDFDocument.create();
  pdf.setTitle(title);
  pdf.setCreator('Notre album');
  const fontEmbedCSS = nodes[0] ? await warmUp(nodes[0]) : undefined;
  for (const [i, node] of nodes.entries()) {
    const opts = { width: PAGE_W, height: PAGE_H, fontEmbedCSS };
    const dataUrl = await capture(
      () => toJpeg(node, { ...opts, pixelRatio: 2.5, quality: 0.9 }),
      () => toJpeg(node, { ...opts, pixelRatio: 1, quality: 0.5 }),
    );
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
  const opts = { width: PAGE_W, height: PAGE_H, fontEmbedCSS };
  const blob = await capture(
    () => toBlob(node, { ...opts, pixelRatio: 3 }),
    () => toJpeg(node, { ...opts, pixelRatio: 1, quality: 0.5 }),
  );
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
