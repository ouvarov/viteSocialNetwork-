import { client } from './client.ts';
import { unwrap } from './errors.ts';

const uploadImage = (image: Blob) =>
  unwrap(
    client.POST('/api/upload', {
      body: { image },
      bodySerializer: (body) => {
        const formData = new FormData();
        formData.append('image', body.image);
        return formData;
      },
    }),
  );

export { uploadImage };
