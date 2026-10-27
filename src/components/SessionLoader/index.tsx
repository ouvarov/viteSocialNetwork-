import type { FC } from 'react';

import { Loader } from '@/components/common/Loader';
import { useHasElapsed } from '@/hooks/useHasElapsed.ts';

const SLOW_START_MS = 3000;

const SessionLoader: FC = () => {
  const isSlow = useHasElapsed(SLOW_START_MS);

  return (
    <Loader
      fullScreen
      label="Starting Pulse"
      message={
        isSlow &&
        'Waking up the server. The free demo host sleeps when idle, so this can take up to a minute.'
      }
    />
  );
};

export { SessionLoader };
