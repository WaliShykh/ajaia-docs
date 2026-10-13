import "server-only";
import { PayloadTooLarge, UnsupportedType, ValidationError } from "../errors";
import { LIMITS, IMPORT_HELP } from "@/lib/shared/limits";

/**
 * Importer registry: extension → { sniff, toHtml }. Supporting a new format is
 * one entry here. Output is untrusted and is sanitised by the document service.
 */
type Importer = {
  /** Cheap content check so a renamed binary can't masquerade as a supported type. */
  sniff: (bytes: Uint8Array) => boolean;
  toHtml: (bytes: Uint8Array) => Promise<string>;
};

function decodeUtf8Text(bytes: Uint8Array): string | null {
  try {
    const text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    return text.includes("\u0000") ? null : text;
  } catch {
    return null;
  }
}

const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const isZip = (b: Uint8Array) => b.length > 4 && b[0] === 0x50 && b[1] === 0x4b && b[2] === 0x03 && b[3] === 0x04;

const IMPORTERS: Record<string, Importer> = {
  ".txt": {
    sniff: (b) => decodeUtf8Text(b) !== null,
    async toHtml(b) {
      const text = decodeUtf8Text(b)!.replace(/\r\n?/g, "\n");
      return text
        .split(/\n{2,}/)
        .filter((para) => para.trim() !== "")
        .map((para) => `<p>${escapeHtml(para).replace(/\n/g, "<br>")}</p>`)
        .join("");
    },
  },
  ".md": {
    sniff: (b) => decodeUtf8Text(b) !== null,
    async toHtml(b) {
      const { marked } = await import("marked");
      return marked.parse(decodeUtf8Text(b)!, { async: false, gfm: true });
    },
  },
  ".docx": {
    sniff: isZip,
    async toHtml(b) {
      const mammoth = await import("mammoth");
      try {
        const result = await mammoth.convertToHtml({ buffer: Buffer.from(b) });
        return result.value;
      } catch {
        throw new ValidationError("That .docx file couldn't be read. It may be corrupted.");
      }
    },
  },
};

export function extensionOf(filename: string): string {
  const dot = filename.lastIndexOf(".");
  return dot === -1 ? "" : filename.slice(dot).toLowerCase();
}

export function titleFromFilename(filename: string): string {
  const base = filename.replace(/^.*[\\/]/, "");
  const dot = base.lastIndexOf(".");
  const stem = (dot > 0 ? base.slice(0, dot) : base).trim();
  return stem.slice(0, LIMITS.titleMax) || "Imported document";
}

export async function convertFileToHtml(filename: string, bytes: Uint8Array): Promise<string> {
  if (bytes.byteLength > LIMITS.uploadMaxBytes) throw new PayloadTooLarge(`File is too large. ${IMPORT_HELP}`);
  if (bytes.byteLength === 0) throw new ValidationError("That file is empty.");
  const importer = IMPORTERS[extensionOf(filename)];
  if (!importer) throw new UnsupportedType(`Unsupported file type. ${IMPORT_HELP}`);
  if (!importer.sniff(bytes)) {
    throw new UnsupportedType("The file contents don't match its extension.");
  }
  return importer.toHtml(bytes);
}
