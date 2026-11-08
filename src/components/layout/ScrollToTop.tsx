import { useEffect, useRef } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';
import { getRestoredScrollPosition } from '@/lib/route-scroll';

export function ScrollToTop() {
  const location = useLocation();
  const navigationType = useNavigationType();
  const scrollPositions = useRef(new Map<string, number>());
  const currentKey = useRef(location.key);
  const restoring = useRef(false);

  useEffect(() => {
    const previousRestoration = window.history.scrollRestoration;
    window.history.scrollRestoration = 'manual';
    return () => {
      window.history.scrollRestoration = previousRestoration;
    };
  }, []);

  useEffect(() => {
    const saveCurrentPosition = () => {
      if (!restoring.current) {
        scrollPositions.current.set(currentKey.current, window.scrollY);
      }
    };

    window.addEventListener('scroll', saveCurrentPosition, { passive: true });
    return () => window.removeEventListener('scroll', saveCurrentPosition);
  }, []);

  useEffect(() => {
    // Capture the page being left even if its latest scroll event has not fired yet.
    scrollPositions.current.set(currentKey.current, window.scrollY);
    currentKey.current = location.key;

    const targetPosition = getRestoredScrollPosition(
      navigationType,
      scrollPositions.current.get(location.key),
    );
    if (targetPosition === null) {
      restoring.current = false;
      window.scrollTo(0, 0);
      return;
    }

    restoring.current = true;
    let attempts = 0;
    let retryTimer: ReturnType<typeof setTimeout> | undefined;
    const restorePosition = () => {
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      if (maxScroll >= targetPosition || attempts >= 40) {
        window.scrollTo(0, targetPosition);
        restoring.current = false;
        return;
      }
      attempts += 1;
      retryTimer = setTimeout(restorePosition, 50);
    };

    // Let the outgoing page transition finish before restoring the destination's scroll.
    retryTimer = setTimeout(restorePosition, 250);
    return () => {
      if (retryTimer) clearTimeout(retryTimer);
      restoring.current = false;
    };
  }, [location.key, navigationType]);

  return null;
}
