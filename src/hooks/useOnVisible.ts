import type { RefObject } from 'react';
import { useEffect, useRef } from 'react';

const useOnVisible = <Element extends HTMLElement>(
  onVisible: () => void,
  isEnabled: boolean,
): RefObject<Element | null> => {
  const ref = useRef<Element>(null);
  const callback = useRef(onVisible);

  useEffect(() => {
    callback.current = onVisible;
  });

  useEffect(() => {
    const element = ref.current;
    if (!element || !isEnabled) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) callback.current();
      },
      { rootMargin: '400px 0px' },
    );
    observer.observe(element);

    return () => observer.disconnect();
  }, [isEnabled]);

  return ref;
};

export { useOnVisible };
