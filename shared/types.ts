import type { Role, ShareRole } from "./policy";

/** DTOs sent over the wire. Dates are ISO strings. */
export type UserDTO = { id: string; email: string; name: string };

export type DocumentSummaryDTO = {
  id: string;
  title: string;
  excerpt: string;
  updatedAt: string;
  role: Role;
  owner: { id: string; name: string };
};

/** List rows additionally carry how many people a document is shared with. */
export type DocumentListItemDTO = DocumentSummaryDTO & { shareCount: number };

export type DocumentDTO = DocumentSummaryDTO & {
  contentHtml: string;
  version: number;
  createdAt: string;
};

export type Page<T> = { items: T[]; nextCursor: string | null };

export type ShareDTO = { user: UserDTO; role: ShareRole; createdAt: string };

export type ApiErrorBody = { error: string; code: string };
