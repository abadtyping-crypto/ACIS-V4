import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';

const RecycleBinContext = createContext(null);

export const RecycleBinProvider = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const restoreListeners = useRef(new Set());

  const openRecycleBin = useCallback(() => setIsOpen(true), []);
  const closeRecycleBin = useCallback(() => setIsOpen(false), []);
  const registerRestoreListener = useCallback((listener) => {
    restoreListeners.current.add(listener);
    return () => {
      restoreListeners.current.delete(listener);
    };
  }, []);

  const notifyRestore = useCallback(() => {
    restoreListeners.current.forEach((listener) => {
      try {
        listener();
      } catch (error) {
        console.warn('[RecycleBinContext] restore listener failed', error);
      }
    });
  }, []);

  const value = useMemo(
    () => ({
      isOpen,
      openRecycleBin,
      closeRecycleBin,
      registerRestoreListener,
      notifyRestore,
    }),
    [isOpen, openRecycleBin, closeRecycleBin, registerRestoreListener, notifyRestore],
  );

  return <RecycleBinContext.Provider value={value}>{children}</RecycleBinContext.Provider>;
};

export const useRecycleBin = () => {
  const context = useContext(RecycleBinContext);
  if (!context) {
    throw new Error('useRecycleBin must be used within a RecycleBinProvider');
  }
  return context;
};
