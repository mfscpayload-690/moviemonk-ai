import { AIProvider } from '../types';

type ProviderStats = {
  calls: number;
  errors: number;
  totalLatencyMs: number;
  fallbackCount: number;
  lastError?: string;
  lastUsedAt?: string;
};

const metrics: Record<AIProvider, ProviderStats> = {
  groq: { calls: 0, errors: 0, totalLatencyMs: 0, fallbackCount: 0 },
  perplexity: { calls: 0, errors: 0, totalLatencyMs: 0, fallbackCount: 0 }
};

const shouldLogInfo = (): boolean => {
  return typeof process !== 'undefined' ? process.env.NODE_ENV !== 'production' : false;
};

function log(event: string, data: Record<string, unknown>, level: 'info' | 'warn' | 'error' = 'info') {
  if (level === 'info' && !shouldLogInfo()) return;
  const line = JSON.stringify({
    ts: new Date().toISOString(),
    source: 'ai_provider_runtime',
    event,
    ...data
  });
  if (level === 'error') console.error(line);
  else if (level === 'warn') console.warn(line);
  else console.log(line);
}

export function startProviderTimer(): number {
  return Date.now();
}

export function recordProviderSuccess(provider: AIProvider, startedAt: number, requestId: string): void {
  const elapsed = Date.now() - startedAt;
  metrics[provider].calls += 1;
  metrics[provider].totalLatencyMs += elapsed;
  metrics[provider].lastUsedAt = new Date().toISOString();

  log('provider_success', {
    request_id: requestId,
    provider,
    latency_ms: elapsed,
    avg_latency_ms: Math.round(metrics[provider].totalLatencyMs / Math.max(metrics[provider].calls, 1))
  });
}

export function recordProviderError(provider: AIProvider, startedAt: number, requestId: string, error: string): void {
  const elapsed = Date.now() - startedAt;
  metrics[provider].calls += 1;
  metrics[provider].errors += 1;
  metrics[provider].totalLatencyMs += elapsed;
  metrics[provider].lastError = error;
  metrics[provider].lastUsedAt = new Date().toISOString();

  log(
    'provider_error',
    {
      request_id: requestId,
      provider,
      latency_ms: elapsed,
      error
    },
    'warn'
  );
}

export function recordFallback(
  fromProvider: AIProvider,
  toProvider: AIProvider,
  requestId: string,
  reason: string
): void {
  metrics[toProvider].fallbackCount += 1;
  log('provider_fallback', { request_id: requestId, from_provider: fromProvider, to_provider: toProvider, reason }, 'warn');
}

export function recordFinalProvider(provider: AIProvider, requestId: string): void {
  log('provider_final_choice', { request_id: requestId, final_provider: provider });
}

export function getProviderMetricsSnapshot(): Record<AIProvider, ProviderStats> {
  return {
    groq: { ...metrics.groq },
    perplexity: { ...metrics.perplexity }
  };
}

const discoveryEventDedupe = new Set<string>();

function shouldEmitDiscoveryEvent(dedupeKey: string): boolean {
  if (discoveryEventDedupe.has(dedupeKey)) return false;
  discoveryEventDedupe.add(dedupeKey);
  return true;
}

export function recordDiscoverySectionRendered(sectionKey: string, title: string, itemCount: number): void {
  if (!shouldEmitDiscoveryEvent(`section:render:${sectionKey}`)) return;
  log('discovery_section_rendered', {
    section_key: sectionKey,
    section_title: title,
    item_count: itemCount
  });
}

export function recordDiscoverySectionSkipped(sectionKey: string, title: string, itemCount: number): void {
  if (!shouldEmitDiscoveryEvent(`section:skip:${sectionKey}`)) return;
  log('discovery_section_skipped', {
    section_key: sectionKey,
    section_title: title,
    item_count: itemCount
  }, 'warn');
}

export function recordDiscoveryCardViewed(sectionKey: string, title: string, position: number): void {
  if (!shouldEmitDiscoveryEvent(`card:view:${sectionKey}:${title}:${position}`)) return;
  log('discovery_card_viewed', {
    section_key: sectionKey,
    title,
    position
  });
}

export function recordDiscoveryCardOpened(sectionKey: string, title: string, position: number): void {
  log('discovery_card_opened', {
    section_key: sectionKey,
    title,
    position
  });
}