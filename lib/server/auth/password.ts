import "server-only";
import bcrypt from "bcryptjs";

const COST = 12;

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, COST);
}

// A real hash of a random value, used to spend the same time on unknown emails
// so response timing doesn't reveal which accounts exist.
let dummyHash: Promise<string> | undefined;

export async function verifyPassword(password: string, hash: string | null): Promise<boolean> {
  if (hash == null) {
    dummyHash ??= bcrypt.hash(crypto.randomUUID(), COST);
    await bcrypt.compare(password, await dummyHash);
    return false;
  }
  return bcrypt.compare(password, hash);
}
