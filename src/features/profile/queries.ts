import { useMutation, useQueryClient } from '@tanstack/react-query';

import { client } from '@/api/client.ts';
import { unwrap } from '@/api/errors.ts';
import { queryKeys } from '@/api/query-keys.ts';
import type { Schemas } from '@/api/schemas.ts';
import { uploadImage } from '@/api/upload.ts';
import { useAuth } from '@/features/auth/useAuth.ts';
import type { ProfileTypes } from '@/features/follows/types.ts';

type ProfilePatch = Schemas['UpdateProfileDto'];
type AvatarChange =
  { kind: 'keep' } | { kind: 'remove' } | { kind: 'replace'; image: Blob };
type ProfileUpdate = {
  fields: Omit<ProfilePatch, 'avatarUploadId'>;
  avatar: AvatarChange;
};

const resolveAvatarUploadId = async (
  avatar: AvatarChange,
): Promise<ProfilePatch['avatarUploadId']> => {
  if (avatar.kind === 'keep') return undefined;
  if (avatar.kind === 'remove') return null;

  const { id } = await uploadImage(avatar.image);
  return id;
};

const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  const { updateUser } = useAuth();

  return useMutation({
    mutationFn: async ({ fields, avatar }: ProfileUpdate) => {
      const avatarUploadId = await resolveAvatarUploadId(avatar);
      const body: ProfilePatch = { ...fields, avatarUploadId };

      return unwrap(client.PATCH('/api/users/me', { body }));
    },
    onSuccess: (user) => {
      queryClient.setQueryData<ProfileTypes>(
        queryKeys.user(user.id),
        (profile) => (profile ? { ...profile, ...user } : profile),
      );
      void queryClient.invalidateQueries({
        queryKey: queryKeys.users(),
        exact: true,
      });
      void queryClient.invalidateQueries({ queryKey: queryKeys.chats() });
      updateUser(user);
    },
  });
};

export { useUpdateProfile };
export type { AvatarChange };
