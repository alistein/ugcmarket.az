import "server-only";
import { NextResponse } from "next/server";
import { z } from "zod";
import { ApiError, errors } from "./errors";
import type { ApiErrorBody } from "@/lib/api-types";

type Ctx<P> = { params: Promise<P> };

/**
 * Wraps every route handler: catches errors and returns `{ error }` JSON.
 * Pattern inside: parse (zod) → auth (requireRole) → service → ok(data).
 */
export function handler<P = Record<string, string>>(
  fn: (req: Request, ctx: Ctx<P>) => Promise<Response>,
) {
  return async (req: Request, ctx: Ctx<P>) => {
    try {
      return await fn(req, ctx);
    } catch (e) {
      const err =
        e instanceof ApiError
          ? e
          : e instanceof z.ZodError
            ? errors.validation(z.flattenError(e))
            : null;
      if (!err) {
        console.error(e);
        return NextResponse.json<ApiErrorBody>(
          { error: { code: "internal", message: "errors.internal" } },
          { status: 500 },
        );
      }
      return NextResponse.json<ApiErrorBody>(
        { error: { code: err.code, message: err.message, details: err.details } },
        { status: err.status },
      );
    }
  };
}

export const ok = <T>(data: T, status = 200) => NextResponse.json({ data }, { status });
export const noContent = () => new NextResponse(null, { status: 204 });

export async function parseBody<S extends z.ZodType>(req: Request, schema: S): Promise<z.infer<S>> {
  const json = await req.json().catch(() => {
    throw errors.validation({ formErrors: ["Invalid JSON"] });
  });
  return schema.parse(json);
}

export function parseQuery<S extends z.ZodType>(req: Request, schema: S): z.infer<S> {
  return schema.parse(Object.fromEntries(new URL(req.url).searchParams));
}
