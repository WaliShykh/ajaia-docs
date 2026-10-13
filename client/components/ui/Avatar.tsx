import { cx } from "@/client/utils/cx";

// Deterministic colour per person (seeded by name, which every screen has) so a user looks the same everywhere.
const PALETTE = [
  "bg-indigo-500", "bg-sky-500", "bg-emerald-500", "bg-amber-500",
  "bg-rose-500", "bg-violet-500", "bg-teal-500", "bg-fuchsia-500",
];

function colorFor(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return PALETTE[h % PALETTE.length];
}

export const initials = (name: string) =>
  name.split(/\s+/).filter(Boolean).map((p) => p[0]!.toUpperCase()).join("").slice(0, 2) || "?";

const sizes = { xs: "size-6 text-[10px]", sm: "size-7 text-[11px]", md: "size-8 text-xs", lg: "size-10 text-sm" } as const;

export function Avatar({
  name,
  size = "md",
  className,
  title,
}: {
  name: string;
  size?: keyof typeof sizes;
  className?: string;
  title?: string;
}) {
  return (
    <span
      aria-hidden
      title={title ?? name}
      className={cx(
        "inline-grid shrink-0 place-items-center rounded-full font-semibold text-white ring-2 ring-white",
        colorFor(name),
        sizes[size],
        className,
      )}
    >
      {initials(name)}
    </span>
  );
}
