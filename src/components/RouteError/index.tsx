import type { FC } from 'react';
import { isRouteErrorResponse, useRouteError } from 'react-router';

import { ErrorState } from '@/components/common/ErrorState';
import { useDocumentTitle } from '@/hooks/useDocumentTitle.ts';

const reloadPage = () => window.location.reload();

const RouteError: FC = () => {
  const error = useRouteError();
  useDocumentTitle('Something went wrong');

  return (
    <ErrorState
      error={error}
      title="This page could not be shown"
      message={
        isRouteErrorResponse(error)
          ? `${error.status} ${error.statusText}`
          : 'Something broke on our side. Reloading the page usually helps.'
      }
      retryLabel="Reload page"
      onRetry={reloadPage}
    />
  );
};

export { RouteError };
