import "server-only";
import { and, desc, eq, sql, type SQL } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import type { Db } from "../db";
import { documents, documentShares, users } from "../schema";
import type { Role, ShareRole } from "@/shared/policy";

const owner = alias(users, "owner");

// Metadata only — list queries never load document bodies.
const summaryColumns = {
  id: documents.id,
  title: documents.title,
  updatedAt: documents.updatedAt,
  ownerId: owner.id,
  ownerName: owner.name,
};

export type Cursor = { updatedAt: Date; id: string };

export function encodeCursor(c: Cursor): string {
  return Buffer.from(`${c.updatedAt.toISOString()}|${c.id}`).toString("base64url");
}

export function decodeCursor(raw: string | undefined): Cursor | null {
  if (!raw) return null;
  const [iso, id] = Buffer.from(raw, "base64url").toString("utf8").split("|");
  const updatedAt = new Date(iso);
  if (!id || Number.isNaN(updatedAt.getTime()) || !/^[0-9a-f-]{36}$/i.test(id)) return null;
  return { updatedAt, id };
}

// Keyset pagination: stable and O(limit) regardless of how deep the user pages.
const before = (c: Cursor | null): SQL | undefined =>
  c ? sql`(${documents.updatedAt}, ${documents.id}) < (${c.updatedAt.toISOString()}::timestamptz, ${c.id}::uuid)` : undefined;

export async function listOwned(db: Db, userId: string, cursor: Cursor | null, limit: number) {
  return db
    .select({ ...summaryColumns, role: sql<Role>`'owner'` })
    .from(documents)
    .innerJoin(owner, eq(owner.id, documents.ownerId))
    .where(and(eq(documents.ownerId, userId), before(cursor)))
    .orderBy(desc(documents.updatedAt), desc(documents.id))
    .limit(limit + 1);
}

export async function listShared(db: Db, userId: string, cursor: Cursor | null, limit: number) {
  return db
    .select({ ...summaryColumns, role: sql<Role>`${documentShares.role}::text` })
    .from(documentShares)
    .innerJoin(documents, eq(documents.id, documentShares.documentId))
    .innerJoin(owner, eq(owner.id, documents.ownerId))
    .where(and(eq(documentShares.userId, userId), before(cursor)))
    .orderBy(desc(documents.updatedAt), desc(documents.id))
    .limit(limit + 1);
}

/** The document plus the caller's effective role, in one indexed query. */
export async function findWithRole(db: Db, documentId: string, userId: string) {
  const [row] = await db
    .select({
      doc: documents,
      ownerName: owner.name,
      shareRole: documentShares.role,
    })
    .from(documents)
    .innerJoin(owner, eq(owner.id, documents.ownerId))
    .leftJoin(
      documentShares,
      and(eq(documentShares.documentId, documents.id), eq(documentShares.userId, userId)),
    )
    .where(eq(documents.id, documentId))
    .limit(1);
  if (!row) return null;
  const role: Role | null =
    row.doc.ownerId === userId ? "owner" : ((row.shareRole as ShareRole | null) ?? null);
  return { ...row, role };
}

export async function insertDocument(
  db: Db,
  values: { ownerId: string; title: string; contentHtml: string },
) {
  const [row] = await db.insert(documents).values(values).returning();
  return row;
}

/** Compare-and-swap on `version`; returns null when the caller's version is stale. */
export async function updateDocumentIfVersion(
  db: Db,
  id: string,
  expectedVersion: number,
  patch: { title?: string; contentHtml?: string },
) {
  const [row] = await db
    .update(documents)
    .set({ ...patch, version: sql`${documents.version} + 1`, updatedAt: sql`now()` })
    .where(and(eq(documents.id, id), eq(documents.version, expectedVersion)))
    .returning();
  return row ?? null;
}

export async function deleteDocumentById(db: Db, id: string) {
  await db.delete(documents).where(eq(documents.id, id));
}
