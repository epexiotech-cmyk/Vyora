import { useEffect } from 'react';

export function useHotkeys(
  key: string,
  callback: (e: KeyboardEvent) => void,
  ctrlKey = true,
  shiftKey = false,
) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.key.toLowerCase() === key.toLowerCase() &&
        event.ctrlKey === ctrlKey &&
        event.shiftKey === shiftKey
      ) {
        event.preventDefault();
        callback(event);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [key, callback, ctrlKey, shiftKey]);
}
