"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, CloudOff, Loader2, Share2 } from "lucide-react";
import { EditorContent, useEditor } from "@tiptap/react";
import { Input, TextField } from "react-aria-components";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";
import { Alert } from "../ui/Alert";
import { Toolbar } from "./Toolbar";
import { ShareDialog } from "./ShareDialog";
import { editorExtensions } from "./extensions";
import { useAutosave, type SaveStatus } from "./useAutosave";
import { can } from "@/lib/shared/policy";
import { DEFAULT_TITLE, LIMITS } from "@/lib/shared/limits";
import type { DocumentDTO } from "@/lib/shared/types";

function SaveIndicator({ status, onRetry }: { status: SaveStatus; onRetry: () => void }) {
  if (status === "saving" || status === "dirty")
    return <span className="flex items-center gap-1.5 text-xs text-slate-500"><Loader2 aria-hidden className="size-3.5 animate-spin" />Saving…</span>;
  if (status === "error")
    return (
      <span className="flex items-center gap-1.5 text-xs text-red-700">
        <CloudOff aria-hidden className="size-3.5" />Couldn&apos;t save
        <Button size="sm" variant="ghost" className="h-6 px-1.5 text-red-700" onPress={onRetry}>Retry</Button>
      </span>
    );
  if (status === "conflict") return <span className="text-xs text-amber-700">Not saved</span>;
  return <span className="flex items-center gap-1.5 text-xs text-slate-500"><Check aria-hidden className="size-3.5" />Saved</span>;
}

export function DocumentEditor({ initial }: { initial: DocumentDTO }) {
  const editable = can(initial.role, "edit");
  const [title, setTitle] = useState(initial.title);
  const [shareOpen, setShareOpen] = useState(false);
  const { status, error, queue, retry } = useAutosave(initial.id, initial.version);

  const editor = useEditor({
    extensions: editorExtensions,
    content: initial.contentHtml,
    editable,
    immediatelyRender: false, // avoid SSR hydration mismatch
    editorProps: {
      attributes: {
        class: "doc-content min-h-[60vh]",
        "aria-label": "Document content",
        "aria-multiline": "true",
        role: "textbox",
        ...(editable ? {} : { "aria-readonly": "true" }),
      },
    },
    onUpdate: ({ editor: e }) => queue({ contentHtml: e.getHTML() }),
  });

  return (
    <main className="flex flex-1 flex-col">
      <div className="sticky top-14 z-20 border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-3 px-4 py-2">
          <Link href="/" aria-label="Back to documents" className="rounded p-1.5 text-slate-600 outline-none hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-blue-500">
            <ArrowLeft aria-hidden className="size-4" />
          </Link>
          <TextField
            aria-label="Document title"
            value={title}
            isReadOnly={!editable}
            maxLength={LIMITS.titleMax}
            onChange={(v) => {
              setTitle(v);
              if (v.trim()) queue({ title: v.trim() });
            }}
            onBlur={() => {
              if (!title.trim()) {
                setTitle(DEFAULT_TITLE);
                queue({ title: DEFAULT_TITLE });
              }
            }}
            className="min-w-0 flex-1"
          >
            <Input className="w-full truncate rounded border border-transparent bg-transparent px-2 py-1 text-lg font-medium text-slate-900 outline-none hover:border-slate-200 focus:border-blue-500 read-only:hover:border-transparent" />
          </TextField>
          <div className="flex items-center gap-3">
            {editable && <SaveIndicator status={status} onRetry={() => void retry()} />}
            {initial.role === "viewer" && <Badge>View only</Badge>}
            {initial.role === "editor" && <Badge tone="blue">Shared by {initial.owner.name}</Badge>}
            {can(initial.role, "share") && (
              <Button onPress={() => setShareOpen(true)}>
                <Share2 aria-hidden className="size-4" /> Share
              </Button>
            )}
          </div>
        </div>
        {editable && editor && (
          <div className="mx-auto max-w-5xl border-t border-slate-100 px-4 py-1.5">
            <Toolbar editor={editor} />
          </div>
        )}
      </div>

      <div className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
        {status === "conflict" && (
          <div className="mb-4">
            <Alert tone="warning">
              {error}{" "}
              <button className="font-medium underline" onClick={() => window.location.reload()}>Reload</button>
            </Alert>
          </div>
        )}
        {status === "error" && error && <div className="mb-4"><Alert>{error}</Alert></div>}
        {initial.role === "viewer" && (
          <div className="mb-4"><Alert tone="info">{initial.owner.name} shared this document with you as a viewer. You can read it but not make changes.</Alert></div>
        )}
        <article className="mx-auto max-w-3xl rounded-lg bg-white px-8 py-10 shadow-sm ring-1 ring-slate-200 sm:px-14">
          {editor ? <EditorContent editor={editor} /> : <div className="min-h-[60vh] animate-pulse" aria-busy="true" />}
        </article>
      </div>

      {can(initial.role, "share") && (
        <ShareDialog documentId={initial.id} isOpen={shareOpen} onOpenChange={setShareOpen} />
      )}
    </main>
  );
}
