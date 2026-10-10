// Image measurements done in the browser (canvas pixels), so the engine needs no image library.
import { readFileSync } from 'node:fs';
import { extname } from 'node:path';
import { newPage } from './browser.mjs';

const MIME = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp' };
export const dataUrl = (file) => `data:${MIME[extname(file).toLowerCase()] || 'image/png'};base64,${readFileSync(file).toString('base64')}`;

// PNG width/height from the IHDR chunk.
export function pngSize(file) {
  const b = readFileSync(file);
  if (b.readUInt32BE(0) !== 0x89504e47) throw new Error(`${file} is not a PNG`);
  return { width: b.readUInt32BE(16), height: b.readUInt32BE(20) };
}

// Runs fn(pixelsA, pixelsB?, width, height) inside a page with the decoded RGBA arrays.
export async function withPixels(browser, files, fn, arg) {
  const { page, context } = await newPage(browser, { width: 16, height: 16, fonts: false });
  try {
    return await page.evaluate(async ({ urls, fnSrc, arg }) => {
      const load = async (u) => { const img = new Image(); img.src = u; await img.decode(); const c = document.createElement('canvas'); c.width = img.naturalWidth; c.height = img.naturalHeight; const g = c.getContext('2d', { willReadFrequently: true }); g.drawImage(img, 0, 0); return { data: g.getImageData(0, 0, c.width, c.height).data, width: c.width, height: c.height }; };
      const imgs = await Promise.all(urls.map(load));
      // eslint-disable-next-line no-new-func
      return new Function('imgs', 'arg', `return (${fnSrc})(imgs, arg);`)(imgs, arg);
    }, { urls: files.map(dataUrl), fnSrc: fn.toString(), arg });
  } finally {
    await context.close();
  }
}

// PSNR over RGB (alpha composited on white) plus the count of pixels that differ by more than tol.
export async function compareImages(browser, a, b, { tol = 16 } = {}) {
  return withPixels(browser, [a, b], (imgs, tolArg) => {
    const [A, B] = imgs;
    if (A.width !== B.width || A.height !== B.height) return { sameSize: false, a: [A.width, A.height], b: [B.width, B.height], psnr: 0, identical: false };
    let se = 0, diff = 0, max = 0;
    const n = A.width * A.height;
    for (let i = 0; i < n * 4; i += 4) {
      const aa = A.data[i + 3] / 255, ba = B.data[i + 3] / 255;
      let px = 0;
      for (let c = 0; c < 3; c++) {
        const va = A.data[i + c] * aa + 255 * (1 - aa), vb = B.data[i + c] * ba + 255 * (1 - ba);
        const d = va - vb; se += d * d; const ad = Math.abs(d); if (ad > px) px = ad;
      }
      if (px > tolArg) diff++;
      if (px > max) max = px;
    }
    const mse = se / (n * 3);
    return { sameSize: true, width: A.width, height: A.height, psnr: mse === 0 ? Infinity : 10 * Math.log10((255 * 255) / mse), maxDiff: Math.round(max), diffPixels: diff, diffRatio: diff / n, identical: se === 0 };
  }, tol);
}
