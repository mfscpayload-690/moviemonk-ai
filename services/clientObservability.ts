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
  return typeof import.meta !== 'undefined' && import.meta.env?.VITE_ENABLE_OBSERVABILITY_API === 'true';
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
  if (typeof import.meta !== 'undefined' && import.meta.env?.DEV) {
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
    navigator.sendBeacon(toEndpoint(), body);
    return;
  }

  void fetch(toEndpoint(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: payload,
    keepalive: true
  }).catch((error) => {
    if (typeof import.meta !== 'undefined' && import.meta.env?.DEV) {
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
