import type { FC } from 'react';
import type React from 'react';
import { useState } from 'react';
import { Link } from 'react-router';

import { loginPage } from '@/routes/routePaths';

import Input from '@/components/common/Input';
import { Button } from '@/components/common/Button';
import { useAuth } from '@/features/auth/useAuth.ts';

import { getApiErrorMessage } from '@/api/errors.ts';
import { registerUser } from '@/features/auth/api.ts';

import styles from './registration.module.scss';

const Registration: FC = () => {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [userName, setUserName] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const { login } = useAuth();

  const isDisabled = ![email, password, userName].every(Boolean);

  const handleOneSubmit = (e: React.FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    setError(null);

    registerUser({ email, password, userName })
      .then(login)
      .catch((registrationError: unknown) => {
        setError(getApiErrorMessage(registrationError, 'Could not sign up'));
      });
  };

  const onChangeEmail = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setEmail(e.target.value);
  };

  const onChangeName = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setUserName(e.target.value);
  };

  const onChangePassword = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setPassword(e.target.value);
  };

  return (
    <section className={styles.section}>
      <h2 className={styles.title}>Registration</h2>

      <form onSubmit={handleOneSubmit}>
        <Input
          id="userName"
          name="userName"
          value={userName}
          label="Your name"
          onChange={onChangeName}
          placeholder="Enter your name"
        />
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
        <Link className={styles.link} to={loginPage()}>
          Login
        </Link>
      </div>
    </section>
  );
};

export { Registration };
