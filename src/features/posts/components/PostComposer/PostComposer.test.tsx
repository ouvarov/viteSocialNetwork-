import { fireEvent, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { renderWithProviders } from '@/test/render.tsx';
import { API, http, HttpResponse, server } from '@/test/server.ts';

import { PostComposer } from './index.tsx';

const REJECTED_MESSAGE = 'Choose one JPEG, PNG, WebP or GIF image';

const serveUpload = () => {
  const onUpload = vi.fn();

  server.use(
    http.post(`${API}/upload`, () => {
      onUpload();
      return HttpResponse.json({
        id: '44444444-4444-4444-8444-444444444444',
        url: 'https://example.com/image.gif',
      });
    }),
  );

  return onUpload;
};

const chooseFile = (file: File) =>
  fireEvent.change(screen.getByLabelText('Post image'), {
    target: { files: [file] },
  });

const PDF = new File(['%PDF'], 'scan.pdf', { type: 'application/pdf' });
const GIF = new File(['GIF89a'], 'cat.gif', { type: 'image/gif' });

describe('PostComposer', () => {
  it('explains a rejected file and does not upload it', async () => {
    const onUpload = serveUpload();
    renderWithProviders(<PostComposer />);

    chooseFile(PDF);

    expect(await screen.findByRole('alert')).toHaveTextContent(
      REJECTED_MESSAGE,
    );
    expect(onUpload).not.toHaveBeenCalled();
  });

  it('clears the rejection once a valid image is chosen', async () => {
    const onUpload = serveUpload();
    renderWithProviders(<PostComposer />);

    chooseFile(PDF);
    await screen.findByText(REJECTED_MESSAGE);

    chooseFile(GIF);

    await waitFor(() => expect(onUpload).toHaveBeenCalledOnce());
    expect(screen.queryByText(REJECTED_MESSAGE)).not.toBeInTheDocument();
  });
});
