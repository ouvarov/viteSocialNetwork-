import React, { FC, useState } from 'react';
import { Link } from 'react-router-dom';

import { loginPage } from '@/routes/routePaths';

import Input from '@/components/common/Input';
import { Button } from '@/components/common/Button';
import { useAuth } from '@/providers/AuthProvider';

import { createUser } from '@/components/Auth/api';

import styles from './registration.module.scss';

const Registration: FC = () => {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [userName, setUserName] = useState<string>('');

  const { login } = useAuth();

  const isDisabled = ![email, password, userName].every(Boolean);

  const handleOneSubmit = (e: React.FormEvent<HTMLFormElement>): void => {
    e.preventDefault();

    createUser({ email, password, userName }).then((res) => {
      login({ user: res.data.userData, access_token: res.data.access_token });
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
          id="pasword"
          type="password"
          name="password"
          value={password}
          label="Your password"
          onChange={onChangePassword}
          placeholder="Enter your pasword"
        />
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
