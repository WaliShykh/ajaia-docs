"use client";
import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { Form, GridList, GridListItem, Button as RACButton } from "react-aria-components";
import { Button, focusRing } from "../ui/Button";
import { Dialog } from "../ui/Dialog";
import { TextField } from "../ui/TextField";
import { Select } from "../ui/Select";
import { Alert } from "../ui/Alert";
import { Avatar } from "../ui/Avatar";
import { toast } from "../ui/Toast";
import { cx } from "@/client/utils/cx";
import { shareService } from "@/client/services/shareService";
import { shareRoleOptions } from "@/client/registry/roles";
import type { ShareRole } from "@/shared/policy";
import type { ShareDTO } from "@/shared/types";

export function ShareDialog({
  documentId,
  isOpen,
  onOpenChange,
}: {
  documentId: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  // The body mounts fresh on every open, so its state (and the share list) is never stale.
  return (
    <Dialog title="Share document" isOpen={isOpen} onOpenChange={onOpenChange}>
      {({ close }) => <ShareDialogBody documentId={documentId} close={close} />}
    </Dialog>
  );
}

function ShareDialogBody({ documentId, close }: { documentId: string; close: () => void }) {
  const [shares, setShares] = useState<ShareDTO[] | null>(null);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<ShareRole>("editor");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    shareService
      .list(documentId)
      .then(setShares)
      .catch((e: Error) => setError(e.message));
  }, [documentId]);

  async function add() {
    setPending(true);
    setError(null);
    try {
      const share = await shareService.add(documentId, email, role);
      setShares((prev) => [...(prev ?? []).filter((s) => s.user.id !== share.user.id), share]);
      toast.success(`Shared with ${share.user.name}`, `They can now ${share.role === "editor" ? "view and edit" : "view"} this document.`);
      setEmail("");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setPending(false);
    }
  }

  async function changeRole(userId: string, next: ShareRole) {
    setError(null);
    const before = shares;
    setShares((prev) => prev?.map((s) => (s.user.id === userId ? { ...s, role: next } : s)) ?? null);
    try {
      await shareService.changeRole(documentId, userId, next);
      toast.success("Access updated", `Changed to ${next}.`);
    } catch (e) {
      setShares(before); // roll back optimistic update
      setError((e as Error).message);
    }
  }

  async function remove(userId: string) {
    setError(null);
    try {
      await shareService.remove(documentId, userId);
      const removed = shares?.find((s) => s.user.id === userId);
      setShares((prev) => prev?.filter((s) => s.user.id !== userId) ?? null);
      toast.success("Access removed", removed ? `${removed.user.name} can no longer open this document.` : undefined);
    } catch (e) {
      setError((e as Error).message);
    }
  }

  return (
    <div className="space-y-5">
      <Form
        className="flex flex-wrap items-end gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          void add();
        }}
      >
        <TextField
          label="Add people by email"
          type="email"
          isRequired
          autoFocus
          value={email}
          onChange={setEmail}
          placeholder="name@ajaia.test"
          className="min-w-0 flex-1"
        />
        <Select label="Role" hideLabel options={shareRoleOptions} value={role} onChange={setRole} className="w-32" />
        <Button type="submit" isPending={pending}>Share</Button>
      </Form>

      {error && <Alert>{error}</Alert>}

      <div>
        <h3 className="mb-2 text-sm font-medium text-slate-700">People with access</h3>
        {shares === null ? (
          <p className="text-sm text-slate-500">Loading…</p>
        ) : (
          <GridList
            aria-label="People with access"
            items={shares}
            renderEmptyState={() => <p className="px-3 py-4 text-sm text-slate-500">Only you can access this document. Add people above to collaborate.</p>}
            className="divide-y divide-slate-100 rounded-xl ring-1 ring-slate-200 outline-none"
          >
            {(s) => (
              <GridListItem id={s.user.id} textValue={s.user.name} className="flex items-center gap-3 px-3 py-2.5 outline-none focus-visible:bg-slate-50">
                <Avatar name={s.user.name} size="md" className="ring-0" />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-slate-900">{s.user.name}</div>
                  <div className="truncate text-xs text-slate-500">{s.user.email}</div>
                </div>
                <Select
                  label={`Role for ${s.user.name}`}
                  hideLabel
                  options={shareRoleOptions}
                  value={s.role}
                  onChange={(r) => void changeRole(s.user.id, r)}
                  className="w-28"
                />
                <RACButton
                  aria-label={`Remove ${s.user.name}`}
                  onPress={() => void remove(s.user.id)}
                  className={cx("rounded p-1.5 text-slate-500 hover:bg-slate-100 hover:text-red-600", focusRing)}
                >
                  <X aria-hidden className="size-4" />
                </RACButton>
              </GridListItem>
            )}
          </GridList>
        )}
      </div>

      <div className="flex justify-end">
        <Button variant="secondary" onPress={close}>Done</Button>
      </div>
    </div>
  );
}
