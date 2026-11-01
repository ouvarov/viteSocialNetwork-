const WEBP_QUALITY = 0.85;
const JPEG_QUALITY = 0.9;

const toBlob = (
  canvas: HTMLCanvasElement,
  type: string,
  quality: number,
): Promise<Blob | null> =>
  new Promise((resolve) => canvas.toBlob(resolve, type, quality));

const loadImage = (sourceUrl: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Could not read the image'));
    image.src = sourceUrl;
  });

const createCanvas = (width: number, height: number) => {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas is not available');

  context.imageSmoothingQuality = 'high';
  return { canvas, context };
};

const encodeCanvas = async (canvas: HTMLCanvasElement): Promise<Blob> => {
  const webp = await toBlob(canvas, 'image/webp', WEBP_QUALITY);
  if (webp?.type === 'image/webp') return webp;

  const jpeg = await toBlob(canvas, 'image/jpeg', JPEG_QUALITY);
  if (!jpeg) throw new Error('Could not encode the image');

  return jpeg;
};

export { createCanvas, encodeCanvas, loadImage };
