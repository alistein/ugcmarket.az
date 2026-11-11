import type { ApiErrorBody } from "@/lib/api-types";

export class ApiClientError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: unknown,
  ) {
    super(message);
  }
}

/** Typed fetch wrapper for /api. Unwraps `{ data }` and throws ApiClientError on `{ error }`. */
export async function api<T>(path: string, init?: RequestInit & { json?: unknown }): Promise<T> {
  const { json, headers, ...rest } = init ?? {};
  const res = await fetch(`/api${path}`, {
    ...rest,
    headers: { ...(json !== undefined && { "Content-Type": "application/json" }), ...headers },
    body: json !== undefined ? JSON.stringify(json) : rest.body,
  });
  const body = res.status === 204 ? null : await res.json().catch(() => null);
  if (!res.ok) {
    const err = (body as ApiErrorBody | null)?.error;
    throw new ApiClientError(res.status, err?.code ?? "unknown", err?.message ?? "errors.unknown", err?.details);
  }
  return (body as { data: T }).data;
}
