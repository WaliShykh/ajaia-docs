"use client";
import Link from "next/link";
import { MoreHorizontal, Users } from "lucide-react";
import { Button as RACButton } from "react-aria-components";
import { focusRing } from "../ui/Button";
import { Badge } from "../ui/Badge";
import { Avatar } from "../ui/Avatar";
import { Menu, MenuItem } from "../ui/Menu";
import { cx } from "@/client/utils/cx";
import { formatRelative } from "@/client/utils/format";
import { routePaths } from "@/client/config/routePaths";
import { roleRegistry } from "@/client/registry/roles";
import type { DocumentListItemDTO } from "@/shared/types";

/** A document tile: a "paper" preview of the opening text, then title and metadata. */
export function DocumentCard({
  doc,
  scope,
  onDelete,
}: {
  doc: DocumentListItemDTO;
  scope: "owned" | "shared";
  onDelete: () => void;
}) {
  const href = routePaths.document(doc.id);
  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-1 hover:shadow-xl hover:ring-indigo-200">
      <div aria-hidden className="relative h-36 overflow-hidden border-b border-slate-100 bg-gradient-to-b from-slate-50 to-white px-5 pt-4">
        <div className="mx-auto h-full rounded-t-md bg-white px-4 pt-3 shadow-sm ring-1 ring-slate-200/70">
          <div className="mb-2 h-2 w-2/3 rounded-full bg-slate-800/80" />
          {doc.excerpt ? (
            <p className="line-clamp-4 text-[10px] leading-[1.45] text-slate-500">{doc.excerpt}</p>
          ) : (
            <div className="space-y-1.5 pt-1">
              <div className="h-1.5 w-full rounded-full bg-slate-100" />
              <div className="h-1.5 w-5/6 rounded-full bg-slate-100" />
              <div className="h-1.5 w-2/3 rounded-full bg-slate-100" />
            </div>
          )}
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-white to-transparent" />
      </div>

      <div className="flex flex-1 items-start gap-2 p-4">
        <div className="min-w-0 flex-1">
          {/* The stretched link makes the whole card clickable while keeping one accessible link. */}
          <Link href={href} className={cx("block truncate rounded font-semibold text-slate-900 after:absolute after:inset-0", focusRing)}>
            {doc.title}
          </Link>
          <p className="mt-0.5 text-xs text-slate-500" suppressHydrationWarning>
            Edited {formatRelative(doc.updatedAt)}
          </p>
          <div className="mt-3 flex items-center gap-2">
            {scope === "shared" ? (
              <>
                <Avatar name={doc.owner.name} size="xs" className="ring-0" />
                <span className="truncate text-xs text-slate-600">{doc.owner.name}</span>
                <span className="ml-auto"><Badge tone={roleRegistry[doc.role].tone}>{roleRegistry[doc.role].badge}</Badge></span>
              </>
            ) : doc.shareCount > 0 ? (
              <span className="inline-flex items-center gap-1 text-xs text-slate-600">
                <Users aria-hidden className="size-3.5" /> Shared with {doc.shareCount}
              </span>
            ) : (
              <span className="text-xs text-slate-400">Private</span>
            )}
          </div>
        </div>
        {scope === "owned" && (
          <Menu
            label={`Actions for ${doc.title}`}
            trigger={
              <RACButton
                aria-label={`Actions for ${doc.title}`}
                className={cx("relative z-10 -mr-1 rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700", focusRing)}
              >
                <MoreHorizontal aria-hidden className="size-4" />
              </RACButton>
            }
          >
            <MenuItem href={href}>Open</MenuItem>
            <MenuItem danger onAction={onDelete}>Delete</MenuItem>
          </Menu>
        )}
      </div>
    </article>
  );
}
