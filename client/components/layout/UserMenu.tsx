"use client";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { Button } from "react-aria-components";
import { Menu, MenuItem } from "../ui/Menu";
import { focusRing } from "../ui/Button";
import { cx } from "@/client/utils/cx";
import { authService } from "@/client/services/authService";
import { routePaths } from "@/client/config/routePaths";
import type { UserDTO } from "@/shared/types";

export function UserMenu({ user }: { user: UserDTO }) {
  const router = useRouter();
  async function logout() {
    await authService.logout().catch(() => undefined);
    router.replace(routePaths.login);
    router.refresh();
  }
  return (
    <Menu
      label="Account"
      trigger={
        <Button aria-label={`Account menu for ${user.name}`} className={cx("flex items-center gap-2 rounded-full p-0.5 pr-3 hover:bg-slate-100", focusRing)}>
          <span aria-hidden className="grid size-8 place-items-center rounded-full bg-slate-800 text-xs font-medium text-white">
            {user.name.split(" ").map((p) => p[0]).join("").slice(0, 2)}
          </span>
          <span className="hidden text-sm text-slate-700 sm:block">{user.name}</span>
        </Button>
      }
    >
      <MenuItem isDisabled textValue={user.email} className="text-slate-500">
        {user.email}
      </MenuItem>
      <MenuItem onAction={() => void logout()}>
        <LogOut aria-hidden className="size-4" /> Sign out
      </MenuItem>
    </Menu>
  );
}
