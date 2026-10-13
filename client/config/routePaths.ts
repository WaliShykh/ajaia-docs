/**
 * Single source of truth for every URL the frontend touches.
 * Components never hand-build paths — rename a route here and the compiler finds every caller.
 */
export const routePaths = {
  home: "/",
  login: "/login",
  document: (id: string) => `/docs/${encodeURIComponent(id)}`,
} as const;

export const apiPaths = {
  auth: {
    login: "/api/auth/login",
    logout: "/api/auth/logout",
  },
  documents: {
    list: (params: { scope: "owned" | "shared"; cursor?: string | null }) => {
      const q = new URLSearchParams({ scope: params.scope });
      if (params.cursor) q.set("cursor", params.cursor);
      return `/api/documents?${q}`;
    },
    create: "/api/documents",
    import: "/api/documents/import",
    byId: (id: string) => `/api/documents/${encodeURIComponent(id)}`,
    shares: (id: string) => `/api/documents/${encodeURIComponent(id)}/shares`,
    share: (id: string, userId: string) =>
      `/api/documents/${encodeURIComponent(id)}/shares/${encodeURIComponent(userId)}`,
  },
} as const;
