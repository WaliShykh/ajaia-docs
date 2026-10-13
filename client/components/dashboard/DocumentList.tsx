"use client";
import { useState } from "react";
import Link from "next/link";
import { FileText, MoreHorizontal } from "lucide-react";
import { Button as RACButton } from "react-aria-components";
import { Button, focusRing } from "../ui/Button";
import { Badge } from "../ui/Badge";
import { Dialog } from "../ui/Dialog";
import { Menu, MenuItem } from "../ui/Menu";
import { Alert } from "../ui/Alert";
import { cx } from "@/client/utils/cx";
import { documentService } from "@/client/services/documentService";
import { routePaths } from "@/client/config/routePaths";
import { roleRegistry } from "@/client/registry/roles";
import { formatRelative } from "@/client/utils/format";
import type { DocumentSummaryDTO, Page } from "@/shared/types";

export function DocumentList({
  scope,
  initial,
  emptyText,
}: {
  scope: "owned" | "shared";
  initial: Page<DocumentSummaryDTO>;
  emptyText: string;
}) {
  const [items, setItems] = useState(initial.items);
  const [cursor, setCursor] = useState(initial.nextCursor);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<DocumentSummaryDTO | null>(null);

  async function loadMore() {
    if (!cursor) return;
    setLoading(true);
    try {
      const page = await documentService.list(scope, cursor);
      setItems((prev) => [...prev, ...page.items]);
      setCursor(page.nextCursor);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function confirmDelete(doc: DocumentSummaryDTO, close: () => void) {
    try {
      await documentService.remove(doc.id);
      setItems((prev) => prev.filter((d) => d.id !== doc.id));
      close();
    } catch (e) {
      setError((e as Error).message);
      close();
    }
  }

  if (items.length === 0) {
    return <p className="rounded-lg border border-dashed border-slate-300 bg-white px-6 py-12 text-center text-sm text-slate-600">{emptyText}</p>;
  }

  return (
    <>
      {error && <div className="mb-3"><Alert>{error}</Alert></div>}
      <ul className="divide-y divide-slate-200 overflow-hidden rounded-lg bg-white ring-1 ring-slate-200">
        {items.map((doc) => (
          <li key={doc.id} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50">
            <FileText aria-hidden className="size-5 shrink-0 text-blue-600" />
            <Link href={routePaths.document(doc.id)} className={cx("min-w-0 flex-1 rounded", focusRing)}>
              <div className="truncate font-medium text-slate-900">{doc.title}</div>
              <div className="text-xs text-slate-500" suppressHydrationWarning>
                {scope === "shared" ? `Owned by ${doc.owner.name} · ` : ""}Edited {formatRelative(doc.updatedAt)}
              </div>
            </Link>
            {scope === "shared" ? (
              <Badge tone={roleRegistry[doc.role].tone}>{roleRegistry[doc.role].badge}</Badge>
            ) : (
              <Menu
                label={`Actions for ${doc.title}`}
                trigger={
                  <RACButton aria-label={`Actions for ${doc.title}`} className={cx("rounded p-1.5 text-slate-500 hover:bg-slate-200", focusRing)}>
                    <MoreHorizontal aria-hidden className="size-4" />
                  </RACButton>
                }
              >
                <MenuItem href={routePaths.document(doc.id)}>Open</MenuItem>
                <MenuItem danger onAction={() => setToDelete(doc)}>Delete</MenuItem>
              </Menu>
            )}
          </li>
        ))}
      </ul>
      {cursor && (
        <div className="mt-4 flex justify-center">
          <Button variant="secondary" onPress={() => void loadMore()} isPending={loading}>Load more</Button>
        </div>
      )}

      <Dialog
        title="Delete document?"
        role="alertdialog"
        isOpen={toDelete !== null}
        onOpenChange={(open) => !open && setToDelete(null)}
      >
        {({ close }) => (
          <>
            <p className="text-sm text-slate-600">
              “{toDelete?.title}” will be permanently deleted for you and everyone it&apos;s shared with.
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="secondary" onPress={close}>Cancel</Button>
              <Button variant="danger" autoFocus onPress={() => toDelete && void confirmDelete(toDelete, close)}>Delete</Button>
            </div>
          </>
        )}
      </Dialog>
    </>
  );
}
