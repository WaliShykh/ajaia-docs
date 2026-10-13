import type { ReactNode } from "react";
import { cx } from "./cx";

export function Alert({ tone = "error", children }: { tone?: "error" | "warning" | "info"; children: ReactNode }) {
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cx(
        "rounded-md px-3 py-2 text-sm",
        tone === "error" && "bg-red-50 text-red-800 ring-1 ring-red-200",
        tone === "warning" && "bg-amber-50 text-amber-900 ring-1 ring-amber-200",
        tone === "info" && "bg-blue-50 text-blue-900 ring-1 ring-blue-200",
      )}
    >
      {children}
    </div>
  );
}
