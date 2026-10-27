import { useEffect, useState } from 'react';

const useHasElapsed = (delayMs: number): boolean => {
  const [hasElapsed, setHasElapsed] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setHasElapsed(true), delayMs);

    return () => clearTimeout(timer);
  }, [delayMs]);

  return hasElapsed;
};

export { useHasElapsed };
