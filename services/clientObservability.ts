import { apiPost, getApiUrl } from '../lib/apiClient';
import { IS_DEV, ENABLE_OBSERVABILITY_API } from '../lib/config';

type ObservabilityLevel = 'info' | 'warn' | 'error';

export type ClientObservabilityEvent = {
  event: string;
  level?: ObservabilityLevel;
  data?: Record<string, unknown>;
};

function toEndpoint(): string {
  return '/api/observability';
}

function observabilityApiEnabled(): boolean {
  return ENABLE_OBSERVABILITY_API;
}

function nowIso(): string {
  return new Date().toISOString();
}

function safeJson(value: unknown): string | null {
  try {
    return JSON.stringify(value);
  } catch {
    return null;
  }
}

function canUseBeacon(): boolean {
  return typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function' && typeof Blob !== 'undefined';
}

function devLog(event: ClientObservabilityEvent): void {
  if (IS_DEV) {
    const payload = {
      ts: nowIso(),
      source: 'client',
      ...event
    };
    const serialized = safeJson(payload);
    if (!serialized) return;
    if (event.level === 'error') console.error(serialized);
    else if (event.level === 'warn') console.warn(serialized);
    else console.log(serialized);
  }
}

export function emitClientEvent(input: ClientObservabilityEvent): void {
  if (typeof window === 'undefined') return;
  const event = { ...input, level: input.level || 'info' as ObservabilityLevel };
  devLog(event);
  if (!observabilityApiEnabled()) return;

  const payload = safeJson({
    ts: nowIso(),
    source: 'client',
    event: event.event,
    level: event.level,
    data: event.data || {}
  });
  if (!payload) return;

  if (canUseBeacon()) {
    const body = new Blob([payload], { type: 'application/json' });
    navigator.sendBeacon(getApiUrl(toEndpoint()), body);
    return;
  }

  void apiPost(toEndpoint(), JSON.parse(payload), undefined, { keepalive: 'true' } as any).catch((error) => {
    if (IS_DEV) {
      console.warn('observability_transport_failed', error);
    }
  });
}

export function emitClientError(error: unknown, context: Record<string, unknown> = {}): void {
  const message = error instanceof Error ? error.message : String(error);
  emitClientEvent({
    event: 'client_error',
    level: 'error',
    data: {
      message,
      ...context
    }
  });
}
