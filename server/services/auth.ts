import "server-only";
import { getDb } from "../db";
import { Unauthorized } from "../errors";
import { consumeRateLimit } from "../rate-limit";
import { verifyPassword } from "../auth/password";
import { createSession } from "../auth/session";
import { findUserByEmail } from "../repo/users";
import type { LoginInput } from "@/shared/schemas";
import type { UserDTO } from "@/shared/types";

const WINDOW_MS = 15 * 60 * 1000;

export async function login(input: LoginInput, clientIp: string) {
  // Per account+IP stops password guessing; per IP stops credential stuffing across accounts.
  await consumeRateLimit(`login:${clientIp}:${input.email}`, 5, WINDOW_MS);
  await consumeRateLimit(`login:${clientIp}`, 50, WINDOW_MS);

  const db = await getDb();
  const user = await findUserByEmail(db, input.email);
  const ok = await verifyPassword(input.password, user?.passwordHash ?? null);
  if (!user || !ok) throw new Unauthorized("Invalid email or password.");

  const session = await createSession(user.id);
  const dto: UserDTO = { id: user.id, email: user.email, name: user.name };
  return { user: dto, ...session };
}
