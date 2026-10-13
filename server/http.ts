import "server-only";
import { NextResponse, type NextRequest } from "next/server";
import type { z } from "zod";
import { AppError, Forbidden, NotFound, PayloadTooLarge, Unauthorized, ValidationError } from "./errors";
import { SESSION_COOKIE, validateSessionToken } from "./auth/session";
import { uuidSchema } from "@/shared/schemas";
import type { UserDTO } from "@/shared/types";

type Ctx<P> = { params: Promise<P> };
type HandlerArgs<P> = { req: NextRequest; params: P; user: UserDTO };

const MUTATING = new Set(["POST", "PUT", "PATCH", "DELETE"]);

/**
 * CSRF defence in depth (on top of SameSite=Lax cookies): state-changing requests
 * must come from our own origin. Browsers always send Origin on these methods.
 */
function assertSameOrigin(req: NextRequest) {
  if (!MUTATING.has(req.method)) return;
  const origin = req.headers.get("origin");
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  if (!origin || !host || new URL(origin).host !== host) {
    throw new Forbidden("Cross-origin request blocked.");
  }
}

export function clientIp(req: NextRequest): string {
  return (
    req.headers.get("x-real-ip") ??
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown"
  );
}

export function errorResponse(err: unknown): NextResponse {
  if (err instanceof AppError) {
    return NextResponse.json({ error: err.message, code: err.code }, { status: err.status, headers: err.headers });
  }
  console.error(err);
  return NextResponse.json({ error: "Something went wrong. Please try again.", code: "internal" }, { status: 500 });
}

function wrap<P>(fn: (req: NextRequest, params: P) => Promise<Response>) {
  return async (req: NextRequest, ctx: Ctx<P>) => {
    try {
      assertSameOrigin(req);
      const res = await fn(req, await ctx.params);
      res.headers.set("Cache-Control", "no-store");
      return res;
    } catch (err) {
      return errorResponse(err);
    }
  };
}

/** Route wrapper for public endpoints (login). */
export const publicRoute = wrap;

/** Route wrapper that requires a valid session. Every authenticated API route goes through here. */
export function authedRoute<P = Record<string, never>>(fn: (args: HandlerArgs<P>) => Promise<Response>) {
  return wrap<P>(async (req, params) => {
    const user = await validateSessionToken(req.cookies.get(SESSION_COOKIE)?.value);
    if (!user) throw new Unauthorized();
    return fn({ req, params, user });
  });
}

const JSON_BODY_MAX = 1_100_000;

export async function parseJson<S extends z.ZodType>(req: NextRequest, schema: S): Promise<z.infer<S>> {
  if (!req.headers.get("content-type")?.includes("application/json")) {
    throw new ValidationError("Expected a JSON request body.");
  }
  const text = await req.text();
  if (text.length > JSON_BODY_MAX) throw new PayloadTooLarge("Request body is too large.");
  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    throw new ValidationError("Malformed JSON.");
  }
  return parseWith(schema, body);
}

export function parseWith<S extends z.ZodType>(schema: S, value: unknown): z.infer<S> {
  const result = schema.safeParse(value);
  if (!result.success) throw new ValidationError(result.error.issues[0]?.message ?? "Invalid input.");
  return result.data;
}

/** Path ids must be UUIDs; anything else is indistinguishable from a missing resource. */
export function parseId(value: string): string {
  const r = uuidSchema.safeParse(value);
  if (!r.success) throw new NotFound("Document not found.");
  return r.data;
}
