import "server-only";
import { getDb } from "../db";
import { authorize } from "../authorize";
import { Conflict, ValidationError } from "../errors";
import { excerptFromHtml, sanitizeDocumentHtml } from "../sanitize";
import * as repo from "../repo/documents";
import { DEFAULT_TITLE, LIMITS } from "@/shared/limits";
import type { Role } from "@/shared/policy";
import type { CreateDocumentInput, UpdateDocumentInput } from "@/shared/schemas";
import type { DocumentDTO, DocumentListItemDTO, Page, UserDTO } from "@/shared/types";

type DocRow = Awaited<ReturnType<typeof repo.insertDocument>>;

function toDTO(doc: DocRow, role: Role, ownerName: string): DocumentDTO {
  return {
    id: doc.id,
    title: doc.title,
    excerpt: doc.excerpt,
    contentHtml: doc.contentHtml,
    version: doc.version,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
    role,
    owner: { id: doc.ownerId, name: ownerName },
  };
}

export async function listDocuments(
  user: UserDTO,
  scope: "owned" | "shared",
  opts: { cursor?: string; limit?: number } = {},
): Promise<Page<DocumentListItemDTO>> {
  const db = await getDb();
  const limit = opts.limit ?? LIMITS.pageSize;
  const cursor = repo.decodeCursor(opts.cursor);
  if (opts.cursor && !cursor) throw new ValidationError("Invalid cursor.");
  const rows =
    scope === "owned"
      ? await repo.listOwned(db, user.id, cursor, limit)
      : await repo.listShared(db, user.id, cursor, limit);
  const items = rows.slice(0, limit);
  const last = items.at(-1);
  return {
    items: items.map((r) => ({
      id: r.id,
      title: r.title,
      excerpt: r.excerpt,
      updatedAt: r.updatedAt.toISOString(),
      role: r.role,
      owner: { id: r.ownerId, name: r.ownerName },
      shareCount: r.shareCount,
    })),
    nextCursor: rows.length > limit && last ? repo.encodeCursor(last) : null,
  };
}

export async function createDocument(user: UserDTO, input: CreateDocumentInput): Promise<DocumentDTO> {
  const db = await getDb();
  const contentHtml = sanitizeDocumentHtml(input.contentHtml ?? "");
  const doc = await repo.insertDocument(db, {
    ownerId: user.id,
    title: input.title ?? DEFAULT_TITLE,
    contentHtml,
    excerpt: excerptFromHtml(contentHtml),
  });
  return toDTO(doc, "owner", user.name);
}

export async function getDocument(user: UserDTO, id: string): Promise<DocumentDTO> {
  const db = await getDb();
  const found = await repo.findWithRole(db, id, user.id);
  const role = found?.role ?? null;
  authorize(role, "read");
  return toDTO(found!.doc, role, found!.ownerName);
}

export async function updateDocument(
  user: UserDTO,
  id: string,
  input: UpdateDocumentInput,
): Promise<DocumentDTO> {
  const db = await getDb();
  const found = await repo.findWithRole(db, id, user.id);
  const role = found?.role ?? null;
  authorize(role, "edit");
  const contentHtml = input.contentHtml === undefined ? undefined : sanitizeDocumentHtml(input.contentHtml);
  const updated = await repo.updateDocumentIfVersion(db, id, input.version, {
    title: input.title,
    contentHtml,
    excerpt: contentHtml === undefined ? undefined : excerptFromHtml(contentHtml),
  });
  if (!updated) {
    throw new Conflict("This document was changed somewhere else. Reload to get the latest version.");
  }
  return toDTO(updated, role, found!.ownerName);
}

export async function deleteDocument(user: UserDTO, id: string): Promise<void> {
  const db = await getDb();
  const found = await repo.findWithRole(db, id, user.id);
  authorize(found?.role ?? null, "delete");
  await repo.deleteDocumentById(db, id);
}
