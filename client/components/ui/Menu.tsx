"use client";
import type { ReactNode } from "react";
import { Menu as RACMenu, MenuItem as RACMenuItem, MenuTrigger, Popover, type MenuItemProps } from "react-aria-components";
import { cx } from "@/client/utils/cx";

export function Menu({ trigger, children, label }: { trigger: ReactNode; children: ReactNode; label: string }) {
  return (
    <MenuTrigger>
      {trigger}
      <Popover placement="bottom end" className="min-w-40 rounded-md border border-slate-200 bg-white p-1 shadow-lg outline-none">
        <RACMenu aria-label={label} className="outline-none">
          {children}
        </RACMenu>
      </Popover>
    </MenuTrigger>
  );
}

export function MenuItem({ danger, className, ...props }: MenuItemProps & { danger?: boolean; className?: string }) {
  return (
    <RACMenuItem
      {...props}
      className={cx(
        "flex cursor-default items-center gap-2 rounded px-2 py-1.5 text-sm outline-none focus:bg-slate-100",
        danger ? "text-red-600" : "text-slate-800",
        className,
      )}
    />
  );
}
