import { useState } from 'react';

import { applyTheme, readTheme, type Theme } from './theme.ts';

const useTheme = () => {
  const [theme, setTheme] = useState<Theme>(readTheme);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';

    applyTheme(nextTheme);
    setTheme(nextTheme);
  };

  return { theme, toggleTheme };
};

export { useTheme };
