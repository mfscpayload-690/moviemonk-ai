import { useEffect } from 'react';
import { emitClientError, emitClientEvent } from '../services/clientObservability';

export function ClientObservabilityEffects() {
  useEffect(() => {
    const onError = (event: ErrorEvent) => {
      emitClientError(event.error || event.message, {
        event_type: 'window_error',
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      });
    };

    const onUnhandledRejection = (event: PromiseRejectionEvent) => {
      emitClientError(event.reason, {
        event_type: 'unhandled_rejection'
      });
    };

    emitClientEvent({
      event: 'client_session_start',
      data: {
        user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown'
      }
    });

    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onUnhandledRejection);
    return () => {
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onUnhandledRejection);
    };
  }, []);

  return null;
}

export default ClientObservabilityEffects;
