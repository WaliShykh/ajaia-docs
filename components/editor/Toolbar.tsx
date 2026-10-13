"use client";
import type { ReactNode } from "react";
import type { Editor } from "@tiptap/react";
import { useEditorState } from "@tiptap/react";
import {
  Bold, Heading1, Heading2, Heading3, Italic, List, ListOrdered, Quote, Redo2, Underline, Undo2, Pilcrow,
} from "lucide-react";
import { Button, Group, Separator, ToggleButton, Toolbar as RACToolbar, Tooltip, TooltipTrigger } from "react-aria-components";
import { cx } from "../ui/cx";

const isMac = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform);
const mod = isMac ? "⌘" : "Ctrl+";

const btn = cx(
  "grid size-8 place-items-center rounded text-slate-700 outline-none transition-colors",
  "hover:bg-slate-100 pressed:bg-slate-200 selected:bg-blue-100 selected:text-blue-700",
  "focus-visible:ring-2 focus-visible:ring-blue-500 disabled:opacity-40",
);

function Tip({ label, children }: { label: string; children: ReactNode }) {
  return (
    <TooltipTrigger delay={500} closeDelay={0}>
      {children}
      <Tooltip offset={6} className="rounded bg-slate-900 px-2 py-1 text-xs text-white shadow">{label}</Tooltip>
    </TooltipTrigger>
  );
}

function Toggle({ label, shortcut, active, onToggle, children }: {
  label: string; shortcut?: string; active: boolean; onToggle: () => void; children: ReactNode;
}) {
  return (
    <Tip label={shortcut ? `${label} (${shortcut})` : label}>
      <ToggleButton aria-label={label} isSelected={active} onChange={onToggle} className={btn}>
        {children}
      </ToggleButton>
    </Tip>
  );
}

/** Formatting toolbar: one roving tab stop with arrow-key navigation (React Aria Toolbar). */
export function Toolbar({ editor }: { editor: Editor }) {
  const s = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      bold: e.isActive("bold"),
      italic: e.isActive("italic"),
      underline: e.isActive("underline"),
      paragraph: e.isActive("paragraph"),
      h1: e.isActive("heading", { level: 1 }),
      h2: e.isActive("heading", { level: 2 }),
      h3: e.isActive("heading", { level: 3 }),
      bullet: e.isActive("bulletList"),
      ordered: e.isActive("orderedList"),
      quote: e.isActive("blockquote"),
      canUndo: e.can().undo(),
      canRedo: e.can().redo(),
    }),
  });
  const chain = () => editor.chain().focus();
  const sep = <Separator orientation="vertical" className="mx-1 h-5 w-px bg-slate-200" />;

  return (
    <RACToolbar aria-label="Text formatting" className="flex flex-wrap items-center gap-0.5">
      <Group aria-label="History" className="flex gap-0.5">
        <Tip label={`Undo (${mod}Z)`}>
          <Button aria-label="Undo" isDisabled={!s.canUndo} onPress={() => chain().undo().run()} className={btn}><Undo2 aria-hidden className="size-4" /></Button>
        </Tip>
        <Tip label={`Redo (${mod}${isMac ? "⇧Z" : "Y"})`}>
          <Button aria-label="Redo" isDisabled={!s.canRedo} onPress={() => chain().redo().run()} className={btn}><Redo2 aria-hidden className="size-4" /></Button>
        </Tip>
      </Group>
      {sep}
      <Group aria-label="Block type" className="flex gap-0.5">
        <Toggle label="Normal text" active={s.paragraph} onToggle={() => chain().setParagraph().run()}><Pilcrow aria-hidden className="size-4" /></Toggle>
        <Toggle label="Heading 1" active={s.h1} onToggle={() => chain().toggleHeading({ level: 1 }).run()}><Heading1 aria-hidden className="size-4" /></Toggle>
        <Toggle label="Heading 2" active={s.h2} onToggle={() => chain().toggleHeading({ level: 2 }).run()}><Heading2 aria-hidden className="size-4" /></Toggle>
        <Toggle label="Heading 3" active={s.h3} onToggle={() => chain().toggleHeading({ level: 3 }).run()}><Heading3 aria-hidden className="size-4" /></Toggle>
      </Group>
      {sep}
      <Group aria-label="Text style" className="flex gap-0.5">
        <Toggle label="Bold" shortcut={`${mod}B`} active={s.bold} onToggle={() => chain().toggleBold().run()}><Bold aria-hidden className="size-4" /></Toggle>
        <Toggle label="Italic" shortcut={`${mod}I`} active={s.italic} onToggle={() => chain().toggleItalic().run()}><Italic aria-hidden className="size-4" /></Toggle>
        <Toggle label="Underline" shortcut={`${mod}U`} active={s.underline} onToggle={() => chain().toggleUnderline().run()}><Underline aria-hidden className="size-4" /></Toggle>
      </Group>
      {sep}
      <Group aria-label="Lists" className="flex gap-0.5">
        <Toggle label="Bulleted list" active={s.bullet} onToggle={() => chain().toggleBulletList().run()}><List aria-hidden className="size-4" /></Toggle>
        <Toggle label="Numbered list" active={s.ordered} onToggle={() => chain().toggleOrderedList().run()}><ListOrdered aria-hidden className="size-4" /></Toggle>
        <Toggle label="Quote" active={s.quote} onToggle={() => chain().toggleBlockquote().run()}><Quote aria-hidden className="size-4" /></Toggle>
      </Group>
    </RACToolbar>
  );
}
