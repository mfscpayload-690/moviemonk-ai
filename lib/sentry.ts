/**
 * Sentry initialization and configuration for MovieMonk AI frontend.
 * Provides error monitoring, session replay, and distributed tracing.
 */

import * as Sentry from '@sentry/react';
import { API_BASE_URL, IS_PROD } from './config';

export function initSentry(): void {
  // @ts-ignore - Vite uses import.meta.env
  const dsn = typeof import.meta !== 'undefined' && import.meta.env
    ? import.meta.env.VITE_SENTRY_DSN
    : process.env.VITE_SENTRY_DSN;

  if (!dsn) {
    return;
  }

  // @ts-ignore
  const env = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SENTRY_ENVIRONMENT) ||
    (IS_PROD ? 'production' : 'development');

  // @ts-ignore
  const tracesSampleRate = Number(
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SENTRY_TRACES_SAMPLE_RATE) || 0.2
  );

  const tracePropagationTargets: (string | RegExp)[] = [
    'localhost',
    /^\//,
    /https:\/\/.*\.hf\.space/,
    /https:\/\/huggingface\.co/,
  ];

  if (API_BASE_URL) {
    try {
      const parsedUrl = new URL(API_BASE_URL);
      tracePropagationTargets.push(parsedUrl.origin);
    } catch {
      tracePropagationTargets.push(API_BASE_URL);
    }
  }

  Sentry.init({
    dsn,
    environment: env,
    tracesSampleRate,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
    tracePropagationTargets,
    replaysSessionSampleRate: 0.05,
    replaysOnErrorSampleRate: 1.0,
    beforeSend(event) {
      // 1. Scrub user PII
      if (event.user) {
        delete event.user.ip_address;
        delete event.user.email;
        delete event.user.username;
      }

      // 2. Scrub sensitive request headers / breadcrumbs
      if (event.request?.headers) {
        for (const key of Object.keys(event.request.headers)) {
          if (/auth|token|secret|key|cookie/i.test(key)) {
            event.request.headers[key] = '[REDACTED]';
          }
        }
      }

      return event;
    },
  });
}

export { Sentry };

