import type { FC } from 'react';

import { getApiErrorMessage } from '@/api/errors.ts';
import { Button } from '@/components/common/Button';

import styles from './error_state.module.scss';

type ErrorStateProps = {
  error: unknown;
  title?: string;
  message?: string;
  retryLabel?: string;
  onRetry?: () => void;
};

const ErrorState: FC<ErrorStateProps> = ({
  error,
  title = 'Something went wrong',
  message,
  retryLabel = 'Try again',
  onRetry,
}) => (
  <div className={styles.error_state} role="alert">
    <p className={styles.error_state__title}>{title}</p>
    <p className={styles.error_state__text}>
      {message ??
        getApiErrorMessage(error, 'Check your connection and try again.')}
    </p>
    {onRetry && (
      <Button variant="secondary" onClick={onRetry}>
        {retryLabel}
      </Button>
    )}
  </div>
);

export { ErrorState };
