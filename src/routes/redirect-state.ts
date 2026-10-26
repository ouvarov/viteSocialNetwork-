import type { Location } from 'react-router';

type RedirectState = { from: string };

const redirectStateFrom = ({ pathname, search }: Location): RedirectState => ({
  from: `${pathname}${search}`,
});

const readRedirectPath = (state: unknown): string | undefined => {
  if (typeof state !== 'object' || state === null || !('from' in state)) {
    return undefined;
  }

  return typeof state.from === 'string' ? state.from : undefined;
};

export { readRedirectPath, redirectStateFrom };
