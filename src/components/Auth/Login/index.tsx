import type { FC } from 'react';
import type React from 'react';
import { useState } from 'react';
import { Link } from 'react-router-dom';

import { signUpPage } from '@/routes/routePaths';

import Input from '@/components/common/Input';
import { Button } from '@/components/common/Button';
import { useAuth } from '@/providers/useAuth.ts';

import { getApiErrorMessage } from '@/api/errors.ts';
import { loginUser } from '@/components/Auth/api';

import styles from './login.module.scss';

const Login: FC = () => {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const { login } = useAuth();

  const isDisabled = ![email, password].every(Boolean);

  const handleOneSubmit = (e: React.FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    setError(null);

    loginUser({ email, password })
      .then((res) => {
        login({ user: res.data.userData, access_token: res.data.access_token });
      })
      .catch((loginError: unknown) => {
        setError(getApiErrorMessage(loginError, 'Could not log in'));
      });
  };

  const onChangeEmail = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setEmail(e.target.value);
  };
  const onChangePassword = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setPassword(e.target.value);
  };

  return (
    <section className={styles.section}>
      <h2 className={styles.title}>Login</h2>

      <form onSubmit={handleOneSubmit}>
        <Input
          id="email"
          name="email"
          value={email}
          type="email"
          label="Your email"
          onChange={onChangeEmail}
          placeholder="Enter your email"
        />
        <Input
          id="password"
          type="password"
          name="password"
          value={password}
          label="Your password"
          onChange={onChangePassword}
          placeholder="Enter your password"
        />
        {error && (
          <p className={styles.error} role="alert">
            {error}
          </p>
        )}
        <Button isDisabled={isDisabled} type="submit">
          Submit
        </Button>
      </form>
      <div className={styles.link_wrap}>
        <Link className={styles.link} to={signUpPage()}>
          Registration
        </Link>
      </div>
    </section>
  );
};

export { Login };
