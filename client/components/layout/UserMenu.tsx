"use client";
import { useRouter } from "next/navigation";
import { ChevronDown, LogOut } from "lucide-react";
import { Button } from "react-aria-components";
import { Menu, MenuItem } from "../ui/Menu";
import { focusRing } from "../ui/Button";
import { Avatar } from "../ui/Avatar";
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
        <Button
          aria-label={`Account menu for ${user.name}`}
          className={cx("flex items-center gap-2 rounded-full py-1 pl-1 pr-2.5 transition hover:bg-slate-100 pressed:bg-slate-200", focusRing)}
        >
          <Avatar name={user.name} size="md" className="ring-0" />
          <span className="hidden text-left sm:block">
            <span className="block text-sm font-medium leading-tight text-slate-800">{user.name}</span>
            <span className="block text-xs leading-tight text-slate-500">{user.email}</span>
          </span>
          <ChevronDown aria-hidden className="size-4 text-slate-400" />
        </Button>
      }
    >
      <MenuItem onAction={() => void logout()}>
        <LogOut aria-hidden className="size-4" /> Sign out
      </MenuItem>
    </Menu>
  );
}
