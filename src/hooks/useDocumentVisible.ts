import { useSyncExternalStore } from 'react';

const subscribe = (onChange: () => void) => {
  document.addEventListener('visibilitychange', onChange);

  return () => document.removeEventListener('visibilitychange', onChange);
};

const isVisible = () => document.visibilityState === 'visible';

const useDocumentVisible = (): boolean =>
  useSyncExternalStore(subscribe, isVisible);

export { useDocumentVisible };
