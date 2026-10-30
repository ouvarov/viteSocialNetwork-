import { fireEvent, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { queryKeys } from '@/api/query-keys.ts';
import type { UserDataTypes } from '@/features/users/types.ts';
import { renderWithProviders } from '@/test/render.tsx';
import { API, http, HttpResponse, server, USER } from '@/test/server.ts';

import { EditProfileDialog } from './index.tsx';

vi.mock('@/features/profile/crop-avatar.ts', () => ({
  cropToAvatar: () =>
    Promise.resolve(new Blob(['avatar'], { type: 'image/webp' })),
}));

vi.mock('@/features/profile/components/AvatarCropper', () => ({
  AvatarCropper: ({
    onConfirm,
  }: {
    onConfirm: (area: {
      x: number;
      y: number;
      width: number;
      height: number;
    }) => void;
  }) => (
    <button
      type="button"
      onClick={() => onConfirm({ x: 0, y: 0, width: 10, height: 10 })}
    >
      Use photo
    </button>
  ),
}));

const UPLOAD_ID = '33333333-3333-4333-8333-333333333333';
const ADA_WITH_PHOTO: UserDataTypes = {
  ...USER,
  imageUrl: 'https://cdn.test/ada.webp',
};

const recordRequests = () => {
  const requests: { path: string; body: unknown }[] = [];

  server.use(
    http.post(`${API}/upload`, () => {
      requests.push({ path: '/upload', body: null });
      return HttpResponse.json(
        {
          id: UPLOAD_ID,
          url: 'https://cdn.test/new.webp',
          width: 512,
          height: 512,
        },
        { status: 201 },
      );
    }),
    http.patch(`${API}/users/me`, async ({ request }) => {
      const body = (await request.json()) as Record<string, unknown>;
      requests.push({ path: '/users/me', body });
      return HttpResponse.json({ ...USER, ...body });
    }),
  );

  return requests;
};

const renderDialog = (profile: UserDataTypes = USER) => {
  const onClose = vi.fn();
  const rendered = renderWithProviders(
    <EditProfileDialog profile={profile} onClose={onClose} />,
  );

  return { ...rendered, onClose };
};

describe('EditProfileDialog', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'URL',
      Object.assign(URL, {
        createObjectURL: vi.fn(() => 'blob:preview'),
        revokeObjectURL: vi.fn(),
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('sends only the fields that changed', async () => {
    const requests = recordRequests();
    const { user, auth, onClose } = renderDialog();

    await user.type(screen.getByLabelText(/About/), 'Mathematician');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    await vi.waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(requests).toEqual([
      { path: '/users/me', body: { description: 'Mathematician' } },
    ]);
    expect(auth.updateUser).toHaveBeenCalledWith(
      expect.objectContaining({ description: 'Mathematician' }),
    );
  });

  it('refreshes cached posts so they show the new name', async () => {
    recordRequests();
    const { user, queryClient, onClose } = renderDialog();
    queryClient.setQueryData(queryKeys.feed(), { pages: [], pageParams: [] });
    queryClient.setQueryData(queryKeys.userPosts(USER.id), {
      pages: [],
      pageParams: [],
    });

    await user.type(screen.getByLabelText('Name'), ' L.');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    await vi.waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(queryClient.getQueryState(queryKeys.feed())?.isInvalidated).toBe(
      true,
    );
    expect(
      queryClient.getQueryState(queryKeys.userPosts(USER.id))?.isInvalidated,
    ).toBe(true);
  });

  it('removes the photo', async () => {
    const requests = recordRequests();
    const { user, onClose } = renderDialog(ADA_WITH_PHOTO);

    await user.click(screen.getByRole('button', { name: 'Remove photo' }));
    await user.click(screen.getByRole('button', { name: 'Save' }));

    await vi.waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(requests).toEqual([
      { path: '/users/me', body: { avatarUploadId: null } },
    ]);
  });

  it('uploads the cropped photo before saving the profile', async () => {
    const requests = recordRequests();
    const { user, onClose } = renderDialog();

    await user.upload(
      screen.getByLabelText('Profile photo'),
      new File(['photo'], 'photo.png', { type: 'image/png' }),
    );
    await user.click(await screen.findByRole('button', { name: 'Use photo' }));
    await user.click(await screen.findByRole('button', { name: 'Save' }));

    await vi.waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(requests).toEqual([
      { path: '/upload', body: null },
      { path: '/users/me', body: { avatarUploadId: UPLOAD_ID } },
    ]);
  });

  it('refuses a file that is not an image', () => {
    renderDialog();

    fireEvent.change(screen.getByLabelText('Profile photo'), {
      target: {
        files: [new File(['%PDF'], 'cv.pdf', { type: 'application/pdf' })],
      },
    });

    expect(screen.getByRole('alert')).toHaveTextContent(
      "This file type isn't supported",
    );
  });

  it('keeps an empty name from being sent', async () => {
    const requests = recordRequests();
    const { user } = renderDialog();

    await user.clear(screen.getByLabelText('Name'));
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(await screen.findByText('Enter your name')).toBeInTheDocument();
    expect(requests).toEqual([]);
  });

  it('stays open and explains a refused save', async () => {
    server.use(
      http.patch(`${API}/users/me`, () =>
        HttpResponse.json(
          { message: 'avatarUploadId must be an image you uploaded' },
          { status: 400 },
        ),
      ),
    );
    const { user, onClose } = renderDialog();

    await user.type(screen.getByLabelText('Name'), ' L.');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'avatarUploadId must be an image you uploaded',
    );
    expect(onClose).not.toHaveBeenCalled();
  });
});
