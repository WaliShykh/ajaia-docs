import "server-only";
import { and, asc, eq } from "drizzle-orm";
import type { Db } from "../db";
import { documentShares, users } from "../schema";
import type { ShareRole } from "@/shared/policy";

export async function listSharesForDocument(db: Db, documentId: string) {
  return db
    .select({
      userId: users.id,
      email: users.email,
      name: users.name,
      role: documentShares.role,
      createdAt: documentShares.createdAt,
    })
    .from(documentShares)
    .innerJoin(users, eq(users.id, documentShares.userId))
    .where(eq(documentShares.documentId, documentId))
    .orderBy(asc(documentShares.createdAt));
}

/** Insert or change a collaborator's role (idempotent). */
export async function upsertShare(
  db: Db,
  values: { documentId: string; userId: string; role: ShareRole; createdBy: string },
) {
  const [row] = await db
    .insert(documentShares)
    .values(values)
    .onConflictDoUpdate({
      target: [documentShares.documentId, documentShares.userId],
      set: { role: values.role },
    })
    .returning();
  return row;
}

export async function updateShareRole(db: Db, documentId: string, userId: string, role: ShareRole) {
  const [row] = await db
    .update(documentShares)
    .set({ role })
    .where(and(eq(documentShares.documentId, documentId), eq(documentShares.userId, userId)))
    .returning();
  return row ?? null;
}

export async function deleteShare(db: Db, documentId: string, userId: string) {
  const rows = await db
    .delete(documentShares)
    .where(and(eq(documentShares.documentId, documentId), eq(documentShares.userId, userId)))
    .returning({ userId: documentShares.userId });
  return rows.length > 0;
}
