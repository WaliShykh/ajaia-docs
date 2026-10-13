import { apiPaths, routePaths } from "@/client/config/routePaths";
import type { ApiErrorBody } from "@/shared/types";

export class ApiError extends Error {
  constructor(public status: number, public code: string, message: string) {
    super(message);
  }
}

/** Typed fetch wrapper: JSON in/out, throws ApiError with the server's user-facing message. */
export async function api<T>(path: string, init: { method?: string; json?: unknown; body?: BodyInit } = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(path, {
      method: init.method ?? "GET",
      headers: init.json !== undefined ? { "Content-Type": "application/json" } : undefined,
      body: init.json !== undefined ? JSON.stringify(init.json) : init.body,
      credentials: "same-origin",
    });
  } catch {
    throw new ApiError(0, "network", "Can't reach the server. Check your connection and try again.");
  }
  if (res.status === 401 && typeof window !== "undefined" && path !== apiPaths.auth.login) {
    // Session expired or revoked: a full reload drops any client state from the old session.
    window.location.assign(routePaths.login);
  }
  if (res.status === 204) return undefined as T;
  const data = (await res.json().catch(() => null)) as (T & Partial<ApiErrorBody>) | null;
  if (!res.ok) {
    throw new ApiError(res.status, data?.code ?? "unknown", data?.error ?? `Request failed (${res.status}).`);
  }
  return data as T;
}
