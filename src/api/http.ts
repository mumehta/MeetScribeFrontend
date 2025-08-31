import { logger } from '../lib/logger'

export type FetchOptions = RequestInit & {
  signal?: AbortSignal;
  headers?: Record<string, string>;
};

function getBaseUrl() {
  // Try Vite env
  const vite = (globalThis as any)?.import?.meta?.env?.VITE_API_BASE_URL;
  if (typeof vite === 'string' && vite) return vite;
  // Try Node env (SSR/tests)
  const nodeEnv = (typeof process !== 'undefined' && (process as any)?.env?.VITE_API_BASE_URL) || undefined;
  if (typeof nodeEnv === 'string' && nodeEnv) return nodeEnv;
  // Try window global override
  const win = (typeof window !== 'undefined' && (window as any)?.VITE_API_BASE_URL) || undefined;
  if (typeof win === 'string' && win) return win;
  return 'http://localhost:8000';
}

const BASE_URL = getBaseUrl();

function isFormData(body: unknown): body is FormData {
  return typeof FormData !== 'undefined' && body instanceof FormData;
}

export async function customFetcher<T>(
  url: string,
  options: FetchOptions = {},
): Promise<T> {
  const finalUrl = url.startsWith('http') ? url : `${BASE_URL}${url}`;
  const method = (options.method || 'GET').toUpperCase();
  const started = Date.now();

  const headers: Record<string, string> = {
    ...(options.headers || {}),
  };

  // Only set JSON content-type if not using FormData and if request has a body
  const hasBody = options.body !== undefined && options.body !== null;
  if (hasBody && !isFormData(options.body) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  logger.debug('HTTP request', { method, url: finalUrl });
  const res = await fetch(finalUrl, { ...options, headers });

  if (!res.ok) {
    // Try parse JSON error; if fails, use text
    let detail: unknown;
    try {
      detail = await res.clone().json();
    } catch (_) {
      try {
        detail = await res.text();
      } catch {
        detail = `HTTP ${res.status}`;
      }
    }
    const duration = Date.now() - started;
    logger.error('HTTP error', { method, url: finalUrl, status: res.status, duration, detail });
    throw new Error(typeof detail === 'string' ? detail : JSON.stringify(detail));
  }

  // No content
  if (res.status === 204) return undefined as unknown as T;

  const text = await res.text();
  if (!text) return undefined as unknown as T;

  try {
    const json = JSON.parse(text) as T;
    const duration = Date.now() - started;
    logger.debug('HTTP success', { method, url: finalUrl, status: res.status, duration });
    return json;
  } catch {
    // not JSON, return as-is string
    const duration = Date.now() - started;
    logger.debug('HTTP success (text)', { method, url: finalUrl, status: res.status, duration });
    return text as unknown as T;
  }
}
