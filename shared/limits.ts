export const LIMITS = {
  titleMax: 200,
  contentMaxBytes: 1_000_000,
  uploadMaxBytes: 2 * 1024 * 1024,
  passwordMax: 200,
  pageSize: 20,
} as const;

export const DEFAULT_TITLE = "Untitled document";

/** Supported import types — shown verbatim in the UI and enforced server-side. */
export const IMPORT_EXTENSIONS = [".txt", ".md", ".docx"] as const;
export const IMPORT_HELP = "Supports .txt, .md and .docx files up to 2 MB.";
