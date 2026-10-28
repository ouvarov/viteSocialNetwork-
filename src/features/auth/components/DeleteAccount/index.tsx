import type { FC } from 'react';
import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import { getApiErrorMessage } from '@/api/errors.ts';
import { Button } from '@/components/common/Button';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Input } from '@/components/common/Input';
import { deleteAccount } from '@/features/auth/api.ts';
import { deleteAccountSchema } from '@/features/auth/schemas.ts';
import type { DeleteAccountFormValues } from '@/features/auth/schemas.ts';
import { useAuth } from '@/features/auth/useAuth.ts';

const DeleteAccount: FC = () => {
  const { logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<DeleteAccountFormValues>({
    resolver: zodResolver(deleteAccountSchema),
    defaultValues: { password: '' },
  });

  const onSubmit = async ({
    password,
  }: DeleteAccountFormValues): Promise<void> => {
    if (isSigningOut) return;

    try {
      await deleteAccount(password);
      setIsSigningOut(true);
      logout();
    } catch (deleteError) {
      setError('password', {
        message: getApiErrorMessage(
          deleteError,
          'Could not delete the account',
        ),
      });
    }
  };

  const handleOpen = () => {
    reset();
    setIsOpen(true);
  };

  return (
    <>
      <Button
        variant="danger"
        size="sm"
        aria-haspopup="dialog"
        onClick={handleOpen}
      >
        Delete account
      </Button>
      <ConfirmDialog
        isOpen={isOpen}
        title="Delete your account?"
        confirmLabel="Delete account"
        isConfirming={isSubmitting || isSigningOut}
        onConfirm={() => void handleSubmit(onSubmit)()}
        onClose={() => setIsOpen(false)}
        fields={
          <form noValidate onSubmit={(e) => void handleSubmit(onSubmit)(e)}>
            <Input
              {...register('password')}
              id="delete-account-password"
              type="password"
              autoComplete="current-password"
              required
              label="Your password"
              error={errors.password?.message}
            />
          </form>
        }
      >
        Your profile, posts and likes will be deleted. Your messages stay in
        other people&apos;s chats without your name. This can&apos;t be undone.
      </ConfirmDialog>
    </>
  );
};

export { DeleteAccount };
