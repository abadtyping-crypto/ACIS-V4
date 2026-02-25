import { useEffect, useState } from 'react';

const DESKTOP_MIN_WIDTH = 1024;

const readDesktopMode = () => {
  if (typeof window === 'undefined') return true;
  return window.innerWidth >= DESKTOP_MIN_WIDTH;
};

const useIsDesktopLayout = () => {
  const [isDesktop, setIsDesktop] = useState(readDesktopMode);

  useEffect(() => {
    const mediaQuery = window.matchMedia(`(min-width: ${DESKTOP_MIN_WIDTH}px)`);
    const onChange = () => setIsDesktop(mediaQuery.matches);
    onChange();
    mediaQuery.addEventListener('change', onChange);
    return () => mediaQuery.removeEventListener('change', onChange);
  }, []);

  return isDesktop;
};

export default useIsDesktopLayout;
