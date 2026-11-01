import type { Area } from 'react-easy-crop';

import { createCanvas, encodeCanvas, loadImage } from '@/lib/image.ts';

const AVATAR_SIDE_PX = 512;

const cropToAvatar = async (sourceUrl: string, area: Area): Promise<Blob> => {
  const image = await loadImage(sourceUrl);
  const { canvas, context } = createCanvas(AVATAR_SIDE_PX, AVATAR_SIDE_PX);

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

  return encodeCanvas(canvas);
};

export { cropToAvatar };
