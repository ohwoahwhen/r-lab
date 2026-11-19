/** Draw webR plot ImageBitmaps into canvases. */

export function drawImages(container, images, { label } = {}) {
  container.innerHTML = '';
  if (!images || !images.length) return false;
  if (label) {
    const l = document.createElement('div');
    l.className = 'plotpair__label';
    l.textContent = label;
    container.appendChild(l);
  }
  for (const img of images) {
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    canvas.style.width = '100%';
    canvas.setAttribute('role', 'img');
    canvas.setAttribute('aria-label', 'R plot output');
    const ctx = canvas.getContext('2d');
    try {
      ctx.drawImage(img, 0, 0);
    } catch (err) {
      // Some bitmaps are single-use; a failed draw is not fatal.
      console.warn('plot draw failed', err);
    }
    container.appendChild(canvas);
  }
  return true;
}
