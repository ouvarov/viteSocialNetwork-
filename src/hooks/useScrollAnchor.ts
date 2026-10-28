import type { RefObject } from 'react';
import { useLayoutEffect, useRef } from 'react';

type ScrollSnapshot = {
  oldestId?: string;
  newestId?: string;
  scrollHeight: number;
};

const useScrollAnchor = (
  containerRef: RefObject<HTMLElement | null>,
  oldestId: string | undefined,
  newestId: string | undefined,
) => {
  const snapshot = useRef<ScrollSnapshot>({ scrollHeight: 0 });

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const previous = snapshot.current;

    if (newestId !== previous.newestId) {
      container.scrollTop = container.scrollHeight;
    } else if (oldestId !== previous.oldestId) {
      container.scrollTop += container.scrollHeight - previous.scrollHeight;
    }

    snapshot.current = {
      oldestId,
      newestId,
      scrollHeight: container.scrollHeight,
    };
  });
};

export { useScrollAnchor };
