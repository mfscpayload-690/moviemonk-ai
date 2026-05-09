export class ApiError extends Error {
  public code: string;
  public status: number;
  public details?: any;

  constructor(status: number, code: string, message: string, details?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

import { API_BASE_URL } from './config';

const API_BASE = API_BASE_URL || '';

export function getApiUrl(path: string): string {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost';
  const url = new URL(`${API_BASE}${path}`, origin);
  return API_BASE.startsWith('http') ? url.toString() : `${url.pathname}${url.search}`;
}

async function fetchWithHandler<T>(url: string, options: RequestInit): Promise<T> {
  const reqId = crypto.randomUUID().substring(0, 12);
  const headers = new Headers(options.headers || {});
  headers.set('X-Client-Request-Id', reqId);

  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  try {
    const response = await fetch(url, { ...options, headers });

    let data;
    const contentType = response.headers?.get?.('content-type');
    const text = await response.text();
    
    if (contentType && contentType.includes('application/json')) {
      try {
        data = JSON.parse(text);
      } catch (e) {
        data = text;
      }
    } else {
      // Fallback for environments/mocks without proper headers
      try {
        data = JSON.parse(text);
      } catch {
        data = text;
      }
    }

    if (!response.ok || (data && typeof data === 'object' && data.ok === false)) {
      const errorBody = data?.error || {};
      throw new ApiError(
        response.status,
        errorBody.code || 'unknown_error',
        errorBody.message || response.statusText,
        errorBody.details
      );
    }

    // Sometimes the backend wraps successful responses in an { ok: true, ...data } envelope.
    // If we're expecting the raw data, this might be tricky, but we usually return the whole envelope 
    // or the caller destructures it. For now, we return `data as T`.
    return data as T;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    // Handle network errors (CORS, offline, etc.)
    throw new ApiError(
      0,
      'network_error',
      error instanceof Error ? error.message : 'Network request failed'
    );
  }
}

export async function apiGet<T>(
  path: string,
  params?: Record<string, string | number | boolean | null | undefined>,
  signal?: AbortSignal
): Promise<T> {
  // Use a dummy base if API_BASE is relative or empty, to parse URL properly
  const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost';
  const url = new URL(`${API_BASE}${path}`, origin);

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.append(key, String(value));
      }
    });
  }

  // If API_BASE is relative (e.g. proxy), return relative URL, else absolute
  const finalUrl = API_BASE.startsWith('http') ? url.toString() : `${url.pathname}${url.search}`;

  return fetchWithHandler<T>(finalUrl, { method: 'GET', signal });
}

export async function apiPost<T>(
  path: string,
  body: unknown,
  signal?: AbortSignal,
  additionalHeaders?: Record<string, string>
): Promise<T> {
  const url = `${API_BASE}${path}`;
  const headers = new Headers(additionalHeaders || {});

  return fetchWithHandler<T>(url, {
    method: 'POST',
    body: JSON.stringify(body),
    headers,
    signal,
  });
}
