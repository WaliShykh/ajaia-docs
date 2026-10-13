// Edge-safe constants shared by proxy.ts and the server session module.
// `__Host-` cookies must be Secure, Path=/ and have no Domain — browsers enforce it,
// which blocks subdomain cookie injection. Plain name on http://localhost in dev.
export const SESSION_COOKIE =
  process.env.NODE_ENV === "production" ? "__Host-ajaia_session" : "ajaia_session";
export const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;
