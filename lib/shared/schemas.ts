import { z } from "zod";
import { LIMITS } from "./limits";
import { SHARE_ROLES } from "./policy";

const email = z
  .string()
  .trim()
  .toLowerCase()
  .max(254)
  .pipe(z.email({ message: "Enter a valid email address." }));

const title = z
  .string()
  .trim()
  .min(1, "Title can't be empty.")
  .max(LIMITS.titleMax, `Title must be ${LIMITS.titleMax} characters or fewer.`);

const contentHtml = z
  .string()
  .refine(
    (s) => new TextEncoder().encode(s).length <= LIMITS.contentMaxBytes,
    "Document is too large (1 MB max).",
  );

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Enter your password.").max(LIMITS.passwordMax),
});

export const createDocumentSchema = z.object({
  title: title.optional(),
  contentHtml: contentHtml.optional(),
});

export const updateDocumentSchema = z
  .object({
    version: z.number().int().positive(),
    title: title.optional(),
    contentHtml: contentHtml.optional(),
  })
  .refine((v) => v.title !== undefined || v.contentHtml !== undefined, "Nothing to update.");

export const shareRoleSchema = z.enum(SHARE_ROLES);

export const createShareSchema = z.object({ email, role: shareRoleSchema });
export const updateShareSchema = z.object({ role: shareRoleSchema });

export const listQuerySchema = z.object({
  scope: z.enum(["owned", "shared"]),
  cursor: z.string().max(200).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(LIMITS.pageSize),
});

export const uuidSchema = z.uuid({ message: "Invalid id." });

export type LoginInput = z.infer<typeof loginSchema>;
export type CreateDocumentInput = z.infer<typeof createDocumentSchema>;
export type UpdateDocumentInput = z.infer<typeof updateDocumentSchema>;
export type CreateShareInput = z.infer<typeof createShareSchema>;
