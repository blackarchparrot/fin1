/**
 * Safe fetch utility that guarantees resilient handling of non-JSON responses
 * (such as Nginx warmup HTML, Vite proxy HTML, or Cloud Run 502/504 HTML pages),
 * preventing the uncaught SyntaxError: Unexpected token '<', "<!doctype "...
 */

export interface SafeFetchResult<T> {
  ok: boolean;
  status: number;
  data?: T;
  error?: string;
}

export async function safeFetchJson<T = any>(
  input: RequestInfo | URL,
  init?: RequestInit,
  fallbackErrMsg?: string
): Promise<SafeFetchResult<T>> {
  try {
    const res = await fetch(input, init);
    const contentType = res.headers.get('content-type') || '';

    if (!contentType.includes('application/json')) {
      return {
        ok: false,
        status: res.status,
        error:
          fallbackErrMsg ||
          `Backend service returned non-JSON response (HTTP ${res.status}). Service may still be initializing.`,
      };
    }

    const data = (await res.json()) as T;
    if (!res.ok) {
      const errMessage =
        data && typeof data === 'object' && 'error' in data && typeof (data as any).error === 'string'
          ? (data as any).error
          : fallbackErrMsg || `Request returned status ${res.status}`;

      return {
        ok: false,
        status: res.status,
        error: errMessage,
        data,
      };
    }

    return {
      ok: true,
      status: res.status,
      data,
    };
  } catch (err: unknown) {
    return {
      ok: false,
      status: 0,
      error:
        err instanceof Error
          ? err.message
          : 'Network error connecting to FinPilot server',
    };
  }
}
