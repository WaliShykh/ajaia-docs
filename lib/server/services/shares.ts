import "server-only";
import { getDb } from "../db";
import { authorize } from "../authorize";
import { NotFound, ValidationError } from "../errors";
import { findWithRole } from "../repo/documents";
import { findUserByEmail } from "../repo/users";
import * as repo from "../repo/shares";
import type { ShareRole } from "@/lib/shared/policy";
import type { CreateShareInput } from "@/lib/shared/schemas";
import type { ShareDTO, UserDTO } from "@/lib/shared/types";

type ShareRow = Awaited<ReturnType<typeof repo.listSharesForDocument>>[number];

const toDTO = (r: ShareRow): ShareDTO => ({
  user: { id: r.userId, email: r.email, name: r.name },
  role: r.role,
  createdAt: r.createdAt.toISOString(),
});

async function requireShareAccess(user: UserDTO, documentId: string) {
  const db = await getDb();
  const found = await findWithRole(db, documentId, user.id);
  authorize(found?.role ?? null, "share");
  return { db, doc: found!.doc };
}

export async function listShares(user: UserDTO, documentId: string): Promise<ShareDTO[]> {
  const { db } = await requireShareAccess(user, documentId);
  return (await repo.listSharesForDocument(db, documentId)).map(toDTO);
}

export async function shareDocument(
  user: UserDTO,
  documentId: string,
  input: CreateShareInput,
): Promise<ShareDTO> {
  const { db, doc } = await requireShareAccess(user, documentId);
  const target = await findUserByEmail(db, input.email);
  // Tradeoff: this tells a signed-in owner whether an account exists. Acceptable for an
  // internal tool; a public product would send an invite email instead.
  if (!target) throw new ValidationError(`No user found with the email ${input.email}.`);
  if (target.id === doc.ownerId) throw new ValidationError("You already own this document.");
  const row = await repo.upsertShare(db, {
    documentId,
    userId: target.id,
    role: input.role,
    createdBy: user.id,
  });
  return toDTO({ ...row, userId: target.id, email: target.email, name: target.name });
}

export async function changeShareRole(
  user: UserDTO,
  documentId: string,
  targetUserId: string,
  role: ShareRole,
): Promise<void> {
  const { db } = await requireShareAccess(user, documentId);
  const row = await repo.updateShareRole(db, documentId, targetUserId, role);
  if (!row) throw new NotFound("That person doesn't have access to this document.");
}

export async function removeShare(user: UserDTO, documentId: string, targetUserId: string) {
  const { db } = await requireShareAccess(user, documentId);
  const removed = await repo.deleteShare(db, documentId, targetUserId);
  if (!removed) throw new NotFound("That person doesn't have access to this document.");
}
