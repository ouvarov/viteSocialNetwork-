import type { FC } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router';

import { signUpPage } from '@/routes/routePaths';

import { Input } from '@/components/common/Input';
import { Button } from '@/components/common/Button';
import { useAuth } from '@/features/auth/useAuth.ts';
import { useDocumentTitle } from '@/hooks/useDocumentTitle.ts';

import { getApiErrorMessage } from '@/api/errors.ts';
import { loginUser } from '@/features/auth/api.ts';
import { loginSchema } from '@/features/auth/schemas.ts';
import type { LoginFormValues } from '@/features/auth/schemas.ts';

import styles from './login.module.scss';

const Login: FC = () => {
  const { login } = useAuth();
  useDocumentTitle('Sign in');

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    mode: 'onTouched',
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (values: LoginFormValues): Promise<void> => {
    try {
      login(await loginUser(values));
    } catch (loginError) {
      setError('root.server', {
        message: getApiErrorMessage(loginError, 'Could not log in'),
      });
    }
  };

  return (
    <section className={styles.section}>
      <h1 className={styles.title}>Sign in</h1>
      <p className={styles.subtitle}>Welcome back to Pulse.</p>

      <form noValidate onSubmit={(e) => void handleSubmit(onSubmit)(e)}>
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
          autoComplete="current-password"
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
          Sign in
        </Button>
      </form>
      <p className={styles.switch}>
        New here? <Link to={signUpPage()}>Create an account</Link>
      </p>
    </section>
  );
};

export { Login };
