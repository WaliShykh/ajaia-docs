import { api } from "./http";
import { apiPaths } from "@/client/config/routePaths";
import type { ShareRole } from "@/shared/policy";
import type { ShareDTO } from "@/shared/types";

export const shareService = {
  list: (documentId: string) =>
    api<{ shares: ShareDTO[] }>(apiPaths.documents.shares(documentId)).then((r) => r.shares),
  add: (documentId: string, email: string, role: ShareRole) =>
    api<{ share: ShareDTO }>(apiPaths.documents.shares(documentId), {
      method: "POST",
      json: { email, role },
    }).then((r) => r.share),
  changeRole: (documentId: string, userId: string, role: ShareRole) =>
    api<{ ok: true }>(apiPaths.documents.share(documentId, userId), { method: "PATCH", json: { role } }),
  remove: (documentId: string, userId: string) =>
    api<void>(apiPaths.documents.share(documentId, userId), { method: "DELETE" }),
};
