import { describe, expect, it } from 'vitest';

import { MAX_SIDE_PX, prepareImage, scaledSize } from './prepare-image.ts';

describe('scaledSize', () => {
  it('fits the longer side of a landscape photo into the limit', () => {
    expect(scaledSize(4096, 3072)).toEqual({
      width: MAX_SIDE_PX,
      height: 1536,
    });
  });

  it('fits the longer side of a portrait photo into the limit', () => {
    expect(scaledSize(3000, 6000)).toEqual({
      width: 1024,
      height: MAX_SIDE_PX,
    });
  });

  it('keeps a photo that already fits at its size', () => {
    expect(scaledSize(1200, 800)).toEqual({ width: 1200, height: 800 });
  });
});

describe('prepareImage', () => {
  it('keeps a gif untouched so its animation survives', async () => {
    const gif = new File(['GIF89a'], 'cat.gif', { type: 'image/gif' });

    await expect(prepareImage(gif)).resolves.toBe(gif);
  });
});
