import type { Role, ShareRole } from "@/shared/policy";

/** Display metadata for each role. Adding a role to shared/policy.ts → add its entry here. */
export const roleRegistry: Record<Role, { label: string; description: string; badge: string; tone: "slate" | "blue" | "green" }> = {
  owner: { label: "Owner", description: "Full control", badge: "Owner", tone: "green" },
  editor: { label: "Editor", description: "Can read and edit", badge: "Can edit", tone: "blue" },
  viewer: { label: "Viewer", description: "Can read", badge: "View only", tone: "slate" },
};

export const shareRoleOptions = (["viewer", "editor"] as const satisfies readonly ShareRole[]).map((id) => ({
  id,
  label: roleRegistry[id].label,
  description: roleRegistry[id].description,
}));
