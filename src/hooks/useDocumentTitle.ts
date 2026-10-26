import { useEffect } from 'react';

const APP_NAME = 'Pulse';

const useDocumentTitle = (title: string | undefined): void => {
  useEffect(() => {
    document.title = title ? `${title} · ${APP_NAME}` : APP_NAME;
  }, [title]);
};

export { useDocumentTitle };
