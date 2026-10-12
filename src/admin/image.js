// Read an uploaded image, downscale it in the browser and return a data URL.
// Keeps transparency (WebP), passes SVGs and small GIFs through untouched.
export async function imageToDataUrl(file, maxSize = 512, quality = 0.9) {
  if (!file.type.startsWith('image/')) throw new Error('Please choose an image file');
  if (file.type === 'image/svg+xml' || (file.type === 'image/gif' && file.size < 1.5e6)) {
    if (file.size > 2e6) throw new Error('File is too large (max 2 MB for SVG/GIF)');
    return readAsDataUrl(file);
  }
  const src = await readAsDataUrl(file);
  const img = await new Promise((res, rej) => {
    const i = new Image();
    i.onload = () => res(i);
    i.onerror = () => rej(new Error('Could not read that image'));
    i.src = src;
  });
  const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
  const w = Math.round(img.width * scale);
  const h = Math.round(img.height * scale);
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d');
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, w, h);
  let out = c.toDataURL('image/webp', quality);
  if (!out.startsWith('data:image/webp')) out = c.toDataURL('image/png'); // Safari fallback
  return out;
}

function readAsDataUrl(file) {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result);
    r.onerror = () => rej(new Error('Could not read file'));
    r.readAsDataURL(file);
  });
}
