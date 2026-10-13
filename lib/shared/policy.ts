/**
 * Declarative access policy. Adding a role (e.g. "commenter") or an action is a
 * one-line change here; services only ever ask `can(role, action)`.
 * Shared with the client purely for UI affordances — the server re-checks everything.
 */
export const ROLES = ["owner", "editor", "viewer"] as const;
export type Role = (typeof ROLES)[number];
export type ShareRole = Exclude<Role, "owner">;
export const SHARE_ROLES = ["viewer", "editor"] as const satisfies readonly ShareRole[];

export type Action = "read" | "edit" | "share" | "delete";

const POLICY: Record<Role, readonly Action[]> = {
  owner: ["read", "edit", "share", "delete"],
  editor: ["read", "edit"],
  viewer: ["read"],
};

export function can(role: Role | null | undefined, action: Action): boolean {
  return role != null && POLICY[role].includes(action);
}
