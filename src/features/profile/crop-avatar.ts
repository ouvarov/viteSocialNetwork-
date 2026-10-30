import type { Area } from 'react-easy-crop';

const AVATAR_SIDE_PX = 512;
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

const cropToAvatar = async (sourceUrl: string, area: Area): Promise<Blob> => {
  const image = await loadImage(sourceUrl);
  const canvas = document.createElement('canvas');
  canvas.width = AVATAR_SIDE_PX;
  canvas.height = AVATAR_SIDE_PX;

  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas is not available');

  context.imageSmoothingQuality = 'high';
  context.drawImage(
    image,
    area.x,
    area.y,
    area.width,
    area.height,
    0,
    0,
    AVATAR_SIDE_PX,
    AVATAR_SIDE_PX,
  );

  const webp = await toBlob(canvas, 'image/webp', WEBP_QUALITY);
  if (webp?.type === 'image/webp') return webp;

  const jpeg = await toBlob(canvas, 'image/jpeg', JPEG_QUALITY);
  if (!jpeg) throw new Error('Could not encode the image');

  return jpeg;
};

export { cropToAvatar };
