"use client";
import { Button as RACButton, type ButtonProps } from "react-aria-components";
import { cx } from "@/client/utils/cx";

const variants = {
  primary: "bg-indigo-600 text-white shadow-sm shadow-indigo-600/20 hover:bg-indigo-500 pressed:bg-indigo-700",
  secondary: "bg-white text-slate-800 shadow-sm ring-1 ring-slate-200 hover:bg-slate-50 hover:ring-slate-300 pressed:bg-slate-100",
  ghost: "bg-transparent text-slate-700 hover:bg-slate-100 pressed:bg-slate-200",
  danger: "bg-red-600 text-white hover:bg-red-700 pressed:bg-red-800",
} as const;

const sizes = {
  sm: "h-8 px-2.5 text-sm gap-1.5",
  md: "h-9 px-3.5 text-sm gap-2",
  lg: "h-11 px-5 text-[15px] gap-2",
} as const;

export const focusRing =
  "outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2";

export function Button({
  variant = "primary",
  size = "md",
  className,
  ...props
}: ButtonProps & { variant?: keyof typeof variants; size?: keyof typeof sizes; className?: string }) {
  return (
    <RACButton
      {...props}
      className={cx(
        "inline-flex items-center justify-center rounded-lg font-medium transition-all cursor-default select-none",
        "disabled:opacity-50 pending:opacity-70",
        focusRing,
        variants[variant],
        sizes[size],
        className,
      )}
    />
  );
}
