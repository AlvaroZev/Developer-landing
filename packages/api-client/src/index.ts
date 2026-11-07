import type { ApiError } from "@triunder/contracts";

/**
 * @triunder/api-client
 *
 * Browser and test client for the Go API. The base URL comes from configuration.
 * An empty base URL means "same origin", which is what the production web
 * container uses behind its reverse proxy. Do not put a default host here.
 *
 * Mutating calls send `X-Triunder-Client` so the API can reject cross-site
 * form posts that would otherwise ride a session cookie.
 */
export interface ClientOptions {
  baseUrl?: string;
  fetch?: typeof fetch;
}

export class ApiClientError extends Error {
  code: string;
  fields?: Record<string, string>;
  status: number;

  constructor(status: number, body: ApiError["error"] | undefined) {
    super(body?.message || "Request failed");
    this.code = body?.code || "request_failed";
    this.fields = body?.fields;
    this.status = status;
  }
}

export function createClient(options: ClientOptions = {}) {
  const base = (options.baseUrl ?? "").replace(/\/$/, "");
  const fetcher = options.fetch ?? fetch;

  async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const headers = new Headers(init.headers);
    headers.set("X-Triunder-Client", "web");
    if (init.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
    const response = await fetcher(`${base}${path}`, { ...init, headers, credentials: "include" });
    if (response.status === 204) return undefined as T;
    const payload = (await response.json().catch(() => ({}))) as T & ApiError;
    if (!response.ok) throw new ApiClientError(response.status, payload.error);
    return payload;
  }

  return {
    request,
    me: () => request<unknown>("/api/v1/auth/me"),
    platform: () => request<unknown>("/api/v1/platform/configuration"),
  };
}
