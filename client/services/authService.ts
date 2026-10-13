import { api } from "./http";
import { apiPaths } from "@/client/config/routePaths";
import type { UserDTO } from "@/shared/types";

export const authService = {
  login: (email: string, password: string) =>
    api<{ user: UserDTO }>(apiPaths.auth.login, { method: "POST", json: { email, password } }),
  signup: (name: string, email: string, password: string) =>
    api<{ user: UserDTO }>(apiPaths.auth.signup, { method: "POST", json: { name, email, password } }),
  logout: () => api<{ ok: true }>(apiPaths.auth.logout, { method: "POST" }),
};
