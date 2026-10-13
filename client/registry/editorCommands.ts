import type { Editor } from "@tiptap/react";
import type { LucideIcon } from "lucide-react";
import {
  Bold, Heading1, Heading2, Heading3, Italic, List, ListOrdered, Pilcrow, Quote, Redo2, Underline, Undo2,
} from "lucide-react";

/**
 * Editor command registry. The toolbar renders straight from this list, so adding
 * a formatting option (e.g. strikethrough) is one entry — no toolbar JSX changes.
 * `kind: "toggle"` renders a pressed/unpressed ToggleButton; `kind: "action"` a Button.
 */
export type EditorCommand = {
  id: string;
  label: string;
  icon: LucideIcon;
  group: "history" | "block" | "inline" | "list";
  /** Shortcut hint shown in the tooltip; `Mod` becomes ⌘ or Ctrl. Tiptap binds the keys. */
  shortcut?: string;
} & (
  | { kind: "toggle"; isActive: (e: Editor) => boolean; run: (e: Editor) => void }
  | { kind: "action"; isEnabled: (e: Editor) => boolean; run: (e: Editor) => void }
);

const chain = (e: Editor) => e.chain().focus();

export const editorCommands: readonly EditorCommand[] = [
  { id: "undo", kind: "action", group: "history", label: "Undo", icon: Undo2, shortcut: "Mod+Z",
    isEnabled: (e) => e.can().undo(), run: (e) => chain(e).undo().run() },
  { id: "redo", kind: "action", group: "history", label: "Redo", icon: Redo2, shortcut: "Mod+Shift+Z",
    isEnabled: (e) => e.can().redo(), run: (e) => chain(e).redo().run() },

  { id: "paragraph", kind: "toggle", group: "block", label: "Normal text", icon: Pilcrow,
    isActive: (e) => e.isActive("paragraph"), run: (e) => chain(e).setParagraph().run() },
  ...([1, 2, 3] as const).map((level): EditorCommand => ({
    id: `h${level}`, kind: "toggle", group: "block", label: `Heading ${level}`,
    icon: [Heading1, Heading2, Heading3][level - 1], shortcut: `Mod+Alt+${level}`,
    isActive: (e) => e.isActive("heading", { level }), run: (e) => chain(e).toggleHeading({ level }).run(),
  })),

  { id: "bold", kind: "toggle", group: "inline", label: "Bold", icon: Bold, shortcut: "Mod+B",
    isActive: (e) => e.isActive("bold"), run: (e) => chain(e).toggleBold().run() },
  { id: "italic", kind: "toggle", group: "inline", label: "Italic", icon: Italic, shortcut: "Mod+I",
    isActive: (e) => e.isActive("italic"), run: (e) => chain(e).toggleItalic().run() },
  { id: "underline", kind: "toggle", group: "inline", label: "Underline", icon: Underline, shortcut: "Mod+U",
    isActive: (e) => e.isActive("underline"), run: (e) => chain(e).toggleUnderline().run() },

  { id: "bulletList", kind: "toggle", group: "list", label: "Bulleted list", icon: List, shortcut: "Mod+Shift+8",
    isActive: (e) => e.isActive("bulletList"), run: (e) => chain(e).toggleBulletList().run() },
  { id: "orderedList", kind: "toggle", group: "list", label: "Numbered list", icon: ListOrdered, shortcut: "Mod+Shift+7",
    isActive: (e) => e.isActive("orderedList"), run: (e) => chain(e).toggleOrderedList().run() },
  { id: "blockquote", kind: "toggle", group: "list", label: "Quote", icon: Quote, shortcut: "Mod+Shift+B",
    isActive: (e) => e.isActive("blockquote"), run: (e) => chain(e).toggleBlockquote().run() },
];

export const commandGroups: { id: EditorCommand["group"]; label: string }[] = [
  { id: "history", label: "History" },
  { id: "block", label: "Block type" },
  { id: "inline", label: "Text style" },
  { id: "list", label: "Lists" },
];
