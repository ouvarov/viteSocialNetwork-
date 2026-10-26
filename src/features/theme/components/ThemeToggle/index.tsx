import type { FC } from 'react';

import { useTheme } from '@/features/theme/useTheme.ts';

import styles from './theme_toggle.module.scss';

const ThemeToggle: FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button type="button" className={styles.toggle} onClick={toggleTheme}>
      {theme === 'dark' ? 'Light theme' : 'Dark theme'}
    </button>
  );
};

export { ThemeToggle };
