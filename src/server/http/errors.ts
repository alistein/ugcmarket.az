/** Throw from services/guards; the handler wrapper turns it into a JSON error. `message` is an i18n key. */
export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: unknown,
  ) {
    super(message);
  }
}

export const errors = {
  unauthorized: () => new ApiError(401, "unauthorized", "errors.unauthorized"),
  forbidden: () => new ApiError(403, "forbidden", "errors.forbidden"),
  notFound: (what = "resource") => new ApiError(404, "not_found", `errors.notFound.${what}`),
  conflict: (code: string) => new ApiError(409, code, `errors.${code}`),
  validation: (details: unknown) => new ApiError(422, "validation", "errors.validation", details),
  notImplemented: () => new ApiError(501, "not_implemented", "errors.notImplemented"),
};
