import { useEffect, useState } from 'react';
import { SHELL_MODE_DESKTOP, getUiShellMode } from '../lib/uiShellMode';

const readDesktopMode = () => {
  return getUiShellMode() === SHELL_MODE_DESKTOP;
};

const useIsDesktopLayout = () => {
  const [isDesktop, setIsDesktop] = useState(() => readDesktopMode());

  useEffect(() => {
    setIsDesktop(readDesktopMode());
    const onPopState = () => setIsDesktop(readDesktopMode());
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  return isDesktop;
};

export default useIsDesktopLayout;
