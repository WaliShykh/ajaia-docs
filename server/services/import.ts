import "server-only";
import { convertFileToHtml, titleFromFilename } from "../importers";
import { ValidationError } from "../errors";
import { sanitizeDocumentHtml } from "../sanitize";
import { createDocument } from "./documents";
import { LIMITS } from "@/shared/limits";
import type { DocumentDTO, UserDTO } from "@/shared/types";

/** Turns an uploaded file into a new document owned by `user`. Nothing is written to disk. */
export async function importDocument(
  user: UserDTO,
  file: { name: string; bytes: Uint8Array },
): Promise<DocumentDTO> {
  const html = sanitizeDocumentHtml(await convertFileToHtml(file.name, file.bytes));
  if (new TextEncoder().encode(html).length > LIMITS.contentMaxBytes) {
    throw new ValidationError("The converted document is too large (1 MB max).");
  }
  return createDocument(user, { title: titleFromFilename(file.name), contentHtml: html });
}
