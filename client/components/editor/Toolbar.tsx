"use client";
import { Fragment, type ReactNode } from "react";
import type { Editor } from "@tiptap/react";
import { useEditorState } from "@tiptap/react";
import { Button, Group, Separator, ToggleButton, Toolbar as RACToolbar, Tooltip, TooltipTrigger } from "react-aria-components";
import { commandGroups, editorCommands } from "@/client/registry/editorCommands";
import { cx } from "@/client/utils/cx";

const isMac = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform);
const formatShortcut = (s: string) =>
  isMac ? s.replace("Mod+", "⌘").replace("Shift+", "⇧").replace("Alt+", "⌥") : s.replace("Mod", "Ctrl");

const btn = cx(
  "grid size-9 place-items-center rounded-lg text-slate-600 outline-none transition-colors",
  "hover:bg-slate-100 hover:text-slate-900 pressed:bg-slate-200 selected:bg-indigo-100 selected:text-indigo-700",
  "focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:opacity-35",
);

function Tip({ label, children }: { label: string; children: ReactNode }) {
  return (
    <TooltipTrigger delay={500} closeDelay={0}>
      {children}
      <Tooltip offset={8} className="rounded-md bg-slate-900 px-2 py-1 text-xs font-medium text-white shadow-lg">{label}</Tooltip>
    </TooltipTrigger>
  );
}

/**
 * Formatting toolbar rendered from the command registry.
 * React Aria Toolbar gives one tab stop with arrow-key navigation between buttons.
 * `preventFocusOnPress` keeps the editor's selection when a button is clicked with the mouse.
 */
export function Toolbar({ editor }: { editor: Editor }) {
  // Re-render only when a command's active/enabled state actually changes.
  const state = useEditorState({
    editor,
    selector: ({ editor: e }) =>
      Object.fromEntries(
        editorCommands.map((c) => [c.id, c.kind === "toggle" ? c.isActive(e) : c.isEnabled(e)]),
      ),
  });

  return (
    <RACToolbar aria-label="Text formatting" className="flex flex-wrap items-center justify-center gap-0.5">
      {commandGroups.map((group, i) => (
        <Fragment key={group.id}>
          {i > 0 && <Separator orientation="vertical" className="mx-1.5 h-6 w-px bg-slate-200" />}
          <Group aria-label={group.label} className="flex gap-0.5">
            {editorCommands
              .filter((c) => c.group === group.id)
              .map((c) => {
                const Icon = c.icon;
                const tip = c.shortcut ? `${c.label} (${formatShortcut(c.shortcut)})` : c.label;
                return (
                  <Tip key={c.id} label={tip}>
                    {c.kind === "toggle" ? (
                      <ToggleButton preventFocusOnPress aria-label={c.label} isSelected={state[c.id]} onChange={() => c.run(editor)} className={btn}>
                        <Icon aria-hidden className="size-4" />
                      </ToggleButton>
                    ) : (
                      <Button preventFocusOnPress aria-label={c.label} isDisabled={!state[c.id]} onPress={() => c.run(editor)} className={btn}>
                        <Icon aria-hidden className="size-4" />
                      </Button>
                    )}
                  </Tip>
                );
              })}
          </Group>
        </Fragment>
      ))}
    </RACToolbar>
  );
}
