import type { FC } from 'react';

import styles from './about_pulse.module.scss';

const SOURCE_LINKS = [
  {
    id: 'web',
    label: 'Web code',
    href: 'https://github.com/ouvarov/viteSocialNetwork-',
  },
  {
    id: 'api',
    label: 'API code',
    href: 'https://github.com/ouvarov/nestSocialNetwork',
  },
];

const STACK = ['React 19', 'TanStack Query', 'NestJS', 'Postgres', 'Socket.IO'];

const AboutPulse: FC = () => (
  <section className={styles.about} aria-labelledby="about-pulse-title">
    <h1 id="about-pulse-title" className={styles.title}>
      Pulse is a full-stack social network demo
    </h1>
    <p className={styles.text}>
      Write posts, like them and chat one-to-one in real time. Try it with the
      demo account, no sign-up needed.
    </p>
    <ul className={styles.stack} aria-label="Built with">
      {STACK.map((name) => (
        <li key={name} className={styles.stack_item}>
          {name}
        </li>
      ))}
    </ul>
    <p className={styles.links}>
      {SOURCE_LINKS.map(({ id, label, href }) => (
        <a key={id} href={href} target="_blank" rel="noreferrer">
          {label}
        </a>
      ))}
    </p>
  </section>
);

export { AboutPulse };
