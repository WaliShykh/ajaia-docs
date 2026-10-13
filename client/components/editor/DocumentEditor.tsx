"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, CloudOff, Eye, FileText, Loader2, Share2 } from "lucide-react";
import { EditorContent, useEditor, useEditorState } from "@tiptap/react";
import { Input, TextField } from "react-aria-components";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";
import { Alert } from "../ui/Alert";
import { Avatar } from "../ui/Avatar";
import { Toolbar } from "./Toolbar";
import { ShareDialog } from "./ShareDialog";
import { editorExtensions } from "@/client/registry/editorExtensions";
import { useAutosave, type SaveStatus } from "@/client/hooks/useAutosave";
import { routePaths } from "@/client/config/routePaths";
import { roleRegistry } from "@/client/registry/roles";
import { can } from "@/shared/policy";
import { DEFAULT_TITLE, LIMITS } from "@/shared/limits";
import type { DocumentDTO } from "@/shared/types";

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
  return <span className="flex items-center gap-1.5 text-xs text-emerald-700"><Check aria-hidden className="size-3.5" />Saved</span>;
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
        class: "doc-content min-h-[70vh]",
        "aria-label": "Document content",
        "aria-multiline": "true",
        role: "textbox",
        ...(editable ? {} : { "aria-readonly": "true" }),
      },
    },
    onUpdate: ({ editor: e }) => queue({ contentHtml: e.getHTML() }),
  });

  const words = useEditorState({
    editor,
    selector: ({ editor: e }) => {
      const text = e?.getText() ?? "";
      return text.trim() ? text.trim().split(/\s+/).length : 0;
    },
  });

  return (
    <main className="flex flex-1 flex-col bg-slate-100/80">
      <div className="sticky top-16 z-20 border-b border-slate-200 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 py-2.5 sm:px-6">
          <Link
            href={routePaths.home}
            aria-label="Back to documents"
            className="rounded-lg p-2 text-slate-500 outline-none transition hover:bg-slate-100 hover:text-slate-800 focus-visible:ring-2 focus-visible:ring-indigo-500"
          >
            <ArrowLeft aria-hidden className="size-4" />
          </Link>
          <span aria-hidden className="grid size-9 place-items-center rounded-lg bg-indigo-50 text-indigo-600">
            <FileText className="size-5" />
          </span>
          <div className="min-w-0 flex-1">
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
            >
              <Input className="-ml-1.5 w-full max-w-xl truncate rounded-md border border-transparent bg-transparent px-1.5 py-0.5 text-[17px] font-semibold text-slate-900 outline-none transition hover:border-slate-200 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 read-only:hover:border-transparent" />
            </TextField>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span>Owned by {initial.role === "owner" ? "you" : initial.owner.name}</span>
              {editable && <><span aria-hidden>·</span><SaveIndicator status={status} onRetry={() => void retry()} /></>}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Avatar name={initial.owner.name} size="sm" title={`Owner: ${initial.owner.name}`} />
            {initial.role !== "owner" && (
              <Badge tone={roleRegistry[initial.role].tone}>{roleRegistry[initial.role].badge}</Badge>
            )}
            {can(initial.role, "share") && (
              <Button onPress={() => setShareOpen(true)}>
                <Share2 aria-hidden className="size-4" /> Share
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-7xl flex-1 px-4 pb-16 sm:px-6">
        {editable && editor && (
          <div className="sticky top-[8.5rem] z-10 mx-auto mt-5 w-fit max-w-full rounded-2xl bg-white/95 px-2 py-1.5 shadow-lg shadow-slate-900/5 ring-1 ring-slate-200 backdrop-blur">
            <Toolbar editor={editor} />
          </div>
        )}

        <div className="mx-auto mt-5 max-w-[816px] space-y-4">
          {status === "conflict" && (
            <Alert tone="warning">
              {error}{" "}
              <button className="font-medium underline" onClick={() => window.location.reload()}>Reload</button>
            </Alert>
          )}
          {status === "error" && error && <Alert>{error}</Alert>}
          {initial.role === "viewer" && (
            <Alert tone="info">
              <span className="inline-flex items-center gap-2">
                <Eye aria-hidden className="size-4 shrink-0" />
                {initial.owner.name} shared this document with you as a viewer. You can read it but not make changes.
              </span>
            </Alert>
          )}
          <article className="rounded-sm bg-white px-8 py-12 shadow-[0_1px_3px_rgba(15,23,42,.08),0_12px_32px_-12px_rgba(15,23,42,.18)] ring-1 ring-slate-200/70 sm:px-[72px] sm:py-16">
            {editor ? <EditorContent editor={editor} /> : <div className="min-h-[70vh] animate-pulse" aria-busy="true" />}
          </article>
          <p className="text-right text-xs tabular-nums text-slate-500" aria-live="polite">
            {words} {words === 1 ? "word" : "words"}
          </p>
        </div>
      </div>

      {can(initial.role, "share") && (
        <ShareDialog documentId={initial.id} isOpen={shareOpen} onOpenChange={setShareOpen} />
      )}
    </main>
  );
}
