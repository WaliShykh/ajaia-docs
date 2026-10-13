import { api } from "./http";
import { apiPaths } from "@/client/config/routePaths";
import type { DocumentDTO, DocumentSummaryDTO, Page } from "@/shared/types";

type Doc = { document: DocumentDTO };

export const documentService = {
  list: (scope: "owned" | "shared", cursor?: string | null) =>
    api<Page<DocumentSummaryDTO>>(apiPaths.documents.list({ scope, cursor })),
  create: (input: { title?: string; contentHtml?: string } = {}) =>
    api<Doc>(apiPaths.documents.create, { method: "POST", json: input }).then((r) => r.document),
  update: (id: string, patch: { version: number; title?: string; contentHtml?: string }) =>
    api<Doc>(apiPaths.documents.byId(id), { method: "PATCH", json: patch }).then((r) => r.document),
  remove: (id: string) => api<void>(apiPaths.documents.byId(id), { method: "DELETE" }),
  import: (file: File) => {
    const body = new FormData();
    body.append("file", file);
    return api<Doc>(apiPaths.documents.import, { method: "POST", body }).then((r) => r.document);
  },
};
