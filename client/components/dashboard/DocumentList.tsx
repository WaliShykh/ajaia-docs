"use client";
import { useState } from "react";
import { FileText, Inbox } from "lucide-react";
import { Button } from "../ui/Button";
import { Dialog } from "../ui/Dialog";
import { Alert } from "../ui/Alert";
import { toast } from "../ui/Toast";
import { DocumentCard } from "./DocumentCard";
import { documentService } from "@/client/services/documentService";
import type { DocumentListItemDTO, Page } from "@/shared/types";

export function DocumentList({
  scope,
  initial,
  emptyTitle,
  emptyText,
}: {
  scope: "owned" | "shared";
  initial: Page<DocumentListItemDTO>;
  emptyTitle: string;
  emptyText: string;
}) {
  const [items, setItems] = useState(initial.items);
  const [cursor, setCursor] = useState(initial.nextCursor);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<DocumentListItemDTO | null>(null);

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

  async function confirmDelete(doc: DocumentListItemDTO, close: () => void) {
    try {
      await documentService.remove(doc.id);
      setItems((prev) => prev.filter((d) => d.id !== doc.id));
      toast.success("Document deleted", `“${doc.title}” was removed for everyone.`);
    } catch (e) {
      toast.error("Couldn't delete document", (e as Error).message);
    }
    close();
  }

  if (items.length === 0) {
    const Icon = scope === "owned" ? FileText : Inbox;
    return (
      <div className="flex flex-col items-center rounded-2xl border border-dashed border-slate-300 bg-white/60 px-6 py-16 text-center">
        <span className="grid size-14 place-items-center rounded-2xl bg-indigo-50 text-indigo-500">
          <Icon aria-hidden className="size-7" />
        </span>
        <h3 className="mt-4 font-semibold text-slate-900">{emptyTitle}</h3>
        <p className="mt-1 max-w-sm text-sm text-slate-600">{emptyText}</p>
      </div>
    );
  }

  return (
    <>
      {error && <div className="mb-4"><Alert>{error}</Alert></div>}
      <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {items.map((doc) => (
          <li key={doc.id}>
            <DocumentCard doc={doc} scope={scope} onDelete={() => setToDelete(doc)} />
          </li>
        ))}
      </ul>
      {cursor && (
        <div className="mt-8 flex justify-center">
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
