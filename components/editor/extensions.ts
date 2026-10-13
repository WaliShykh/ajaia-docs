import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";

/**
 * The editor's schema. Keep in sync with the server sanitiser allowlist
 * (lib/server/sanitize.ts): links, images and code-block languages are
 * intentionally excluded.
 */
export const editorExtensions = [
  StarterKit.configure({
    heading: { levels: [1, 2, 3] },
    link: false,
  }),
  Placeholder.configure({ placeholder: "Start writing…" }),
];
