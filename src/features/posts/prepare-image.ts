import { createCanvas, encodeCanvas, loadImage } from '@/lib/image.ts';

const MAX_SIDE_PX = 2048;
const KEPT_AS_IS = new Set(['image/gif']);

const scaledSize = (width: number, height: number) => {
  const scale = Math.min(1, MAX_SIDE_PX / Math.max(width, height));

  return {
    width: Math.round(width * scale),
    height: Math.round(height * scale),
  };
};

const prepareImage = async (file: File): Promise<Blob> => {
  if (KEPT_AS_IS.has(file.type)) return file;

  const sourceUrl = URL.createObjectURL(file);
  try {
    const image = await loadImage(sourceUrl).catch(() => null);
    if (!image?.naturalWidth || !image.naturalHeight) return file;

    const { width, height } = scaledSize(
      image.naturalWidth,
      image.naturalHeight,
    );
    const { canvas, context } = createCanvas(width, height);
    context.drawImage(image, 0, 0, width, height);

    return await encodeCanvas(canvas);
  } finally {
    URL.revokeObjectURL(sourceUrl);
  }
};

export { MAX_SIDE_PX, prepareImage, scaledSize };
