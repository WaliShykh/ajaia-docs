import { getDb } from "@/server/db";
import { findUserByEmail } from "@/server/repo/users";
import type { UserDTO } from "@/shared/types";

/** Loads a seeded demo user (alice | bob | carol) as the DTO services expect. */
export async function demoUser(name: "alice" | "bob" | "carol"): Promise<UserDTO> {
  const row = await findUserByEmail(await getDb(), `${name}@ajaia.test`);
  if (!row) throw new Error(`seed user ${name} missing`);
  return { id: row.id, email: row.email, name: row.name };
}
