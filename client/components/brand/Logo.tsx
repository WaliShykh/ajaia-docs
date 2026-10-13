import { cx } from "@/client/utils/cx";

/** Brand mark + wordmark. The mark matches app/icon.svg (the favicon). */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" aria-hidden className={cx("size-8 shrink-0", className)}>
      <defs>
        <linearGradient id="ajaia-logo" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#6366f1" />
          <stop offset="1" stopColor="#2563eb" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="16" fill="url(#ajaia-logo)" />
      <path d="M22 16h14l10 10v20a4 4 0 0 1-4 4H22a4 4 0 0 1-4-4V20a4 4 0 0 1 4-4z" fill="#fff" opacity=".95" />
      <path d="M36 16v8a2 2 0 0 0 2 2h8" fill="#c7d2fe" />
      <rect x="24" y="32" width="16" height="3" rx="1.5" fill="#6366f1" />
      <rect x="24" y="39" width="11" height="3" rx="1.5" fill="#a5b4fc" />
    </svg>
  );
}

export function Logo({ className, inverted }: { className?: string; inverted?: boolean }) {
  return (
    <span className={cx("inline-flex items-center gap-2.5", className)}>
      <LogoMark />
      <span className={cx("text-[17px] font-semibold tracking-tight", inverted ? "text-white" : "text-slate-900")}>
        Ajaia <span className={inverted ? "text-indigo-200" : "text-indigo-600"}>Docs</span>
      </span>
    </span>
  );
}
