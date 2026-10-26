import type { FC } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router';

import { loginPage } from '@/routes/routePaths';

import { Input } from '@/components/common/Input';
import { Button } from '@/components/common/Button';
import { useAuth } from '@/features/auth/useAuth.ts';
import { useDocumentTitle } from '@/hooks/useDocumentTitle.ts';

import { getApiErrorMessage } from '@/api/errors.ts';
import { registerUser } from '@/features/auth/api.ts';
import { signUpSchema } from '@/features/auth/schemas.ts';
import type { SignUpFormValues } from '@/features/auth/schemas.ts';

import styles from './registration.module.scss';

const Registration: FC = () => {
  const { login } = useAuth();
  useDocumentTitle('Create account');

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),
    mode: 'onTouched',
    defaultValues: { userName: '', email: '', password: '' },
  });

  const onSubmit = async (values: SignUpFormValues): Promise<void> => {
    try {
      login(await registerUser(values));
    } catch (registrationError) {
      setError('root.server', {
        message: getApiErrorMessage(registrationError, 'Could not sign up'),
      });
    }
  };

  return (
    <section className={styles.section}>
      <h1 className={styles.title}>Create account</h1>
      <p className={styles.subtitle}>Join Pulse in a few seconds.</p>

      <form noValidate onSubmit={(e) => void handleSubmit(onSubmit)(e)}>
        <Input
          {...register('userName')}
          id="userName"
          autoComplete="name"
          required
          label="Your name"
          placeholder="Enter your name"
          error={errors.userName?.message}
        />
        <Input
          {...register('email')}
          id="email"
          type="email"
          autoComplete="email"
          required
          label="Your email"
          placeholder="Enter your email"
          error={errors.email?.message}
        />
        <Input
          {...register('password')}
          id="password"
          type="password"
          autoComplete="new-password"
          required
          label="Your password"
          placeholder="Enter your password"
          error={errors.password?.message}
        />
        {errors.root?.server && (
          <p className={styles.error} role="alert">
            {errors.root.server.message}
          </p>
        )}
        <Button
          className={styles.submit}
          isLoading={isSubmitting}
          type="submit"
        >
          Sign up
        </Button>
      </form>

      <p className={styles.switch}>
        Already have an account? <Link to={loginPage()}>Sign in</Link>
      </p>
    </section>
  );
};

export { Registration };
