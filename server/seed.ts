import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import type { Db } from "./db";
import { documents, documentShares, users } from "./schema";

export const DEMO_PASSWORD = "demo1234";
export const DEMO_USERS = [
  { email: "alice@ajaia.test", name: "Alice Chen" },
  { email: "bob@ajaia.test", name: "Bob Okafor" },
  { email: "carol@ajaia.test", name: "Carol Diaz" },
] as const;

const PLANNING_DOC = `<h1>Q4 Planning</h1><p>This document is <strong>owned by Alice</strong>, shared with <em>Bob as an editor</em> and <u>Carol as a viewer</u>.</p><h2>Goals</h2><ol><li><p>Ship the collaborative editor beta</p></li><li><p>Reduce onboarding time by 30%</p></li></ol><h2>Open questions</h2><ul><li><p>Do we need offline support?</p></li><li><p>Which teams pilot first?</p></li></ul>`;

/** Idempotent: safe to run on every deploy. Only creates what's missing. */
export async function seed(db: Db) {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);
  for (const u of DEMO_USERS) {
    await db.insert(users).values({ ...u, passwordHash }).onConflictDoNothing({ target: users.email });
  }
  const byEmail = Object.fromEntries(
    (await db.select().from(users)).map((u) => [u.email, u] as const),
  );
  const alice = byEmail["alice@ajaia.test"];
  const bob = byEmail["bob@ajaia.test"];
  const carol = byEmail["carol@ajaia.test"];

  const aliceDocs = await db.select({ id: documents.id }).from(documents).where(eq(documents.ownerId, alice.id)).limit(1);
  if (aliceDocs.length === 0) {
    const [doc] = await db
      .insert(documents)
      .values({ ownerId: alice.id, title: "Q4 Planning", contentHtml: PLANNING_DOC })
      .returning();
    await db.insert(documentShares).values([
      { documentId: doc.id, userId: bob.id, role: "editor", createdBy: alice.id },
      { documentId: doc.id, userId: carol.id, role: "viewer", createdBy: alice.id },
    ]);
  }

  const bobDocs = await db.select({ id: documents.id }).from(documents).where(eq(documents.ownerId, bob.id)).limit(1);
  if (bobDocs.length === 0) {
    await db.insert(documents).values({
      ownerId: bob.id,
      title: "Bob's private notes",
      contentHtml: "<p>Only Bob can see this document — it isn't shared with anyone.</p>",
    });
  }
}
