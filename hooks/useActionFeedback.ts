import { useCallback, useEffect, useRef, useState } from 'react';

export function useActionFeedback(durationMs = 520) {
  const [activeKeys, setActiveKeys] = useState<Record<string, boolean>>({});
  const timeoutMapRef = useRef<Record<string, number>>({});

  const triggerFeedback = useCallback((key = 'default') => {
    const existingTimeout = timeoutMapRef.current[key];
    if (existingTimeout) {
      window.clearTimeout(existingTimeout);
    }

    setActiveKeys((previous) => ({ ...previous, [key]: false }));

    window.requestAnimationFrame(() => {
      setActiveKeys((previous) => ({ ...previous, [key]: true }));
      timeoutMapRef.current[key] = window.setTimeout(() => {
        setActiveKeys((previous) => ({ ...previous, [key]: false }));
        delete timeoutMapRef.current[key];
      }, durationMs);
    });
  }, [durationMs]);

  const isFeedbackActive = useCallback((key = 'default') => Boolean(activeKeys[key]), [activeKeys]);

  useEffect(() => () => {
    Object.values(timeoutMapRef.current).forEach((timeoutId) => window.clearTimeout(timeoutId));
    timeoutMapRef.current = {};
  }, []);

  return { triggerFeedback, isFeedbackActive };
}

