import type { FC } from 'react';

import { ErrorState } from '@/components/common/ErrorState';

import styles from './session_error.module.scss';

type SessionErrorProps = {
  onRetry: () => void;
};

const SessionError: FC<SessionErrorProps> = ({ onRetry }) => (
  <main className={styles.session_error}>
    <ErrorState
      error={undefined}
      title="Pulse can't reach its server"
      message="Your session is safe. Check your connection and try again."
      onRetry={onRetry}
    />
  </main>
);

export { SessionError };
