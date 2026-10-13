import { readFileSync } from "node:fs";
import { beforeAll, describe, expect, it } from "vitest";
import { demoUser } from "./helpers";
import { sanitizeDocumentHtml } from "@/server/sanitize";
import { convertFileToHtml } from "@/server/importers";
import { importDocument } from "@/server/services/import";
import { createDocument, updateDocument } from "@/server/services/documents";
import { PayloadTooLarge, UnsupportedType } from "@/server/errors";
import { LIMITS } from "@/shared/limits";
import type { UserDTO } from "@/shared/types";

const enc = (s: string) => new TextEncoder().encode(s);
let alice: UserDTO;
beforeAll(async () => {
  alice = await demoUser("alice");
});

describe("HTML sanitisation", () => {
  it("keeps document formatting", () => {
    const html = "<h1>T</h1><p><strong>b</strong> <em>i</em> <u>u</u></p><ul><li><p>x</p></li></ul><ol><li><p>y</p></li></ol>";
    expect(sanitizeDocumentHtml(html)).toBe(html);
  });

  it("strips scripts, event handlers, URLs and unknown tags", () => {
    const dirty =
      `<p onclick="steal()">hi<script>alert(1)</script></p><img src=x onerror=alert(1)>` +
      `<a href="javascript:alert(1)">link</a><iframe src="//evil"></iframe><style>*{}</style>`;
    const clean = sanitizeDocumentHtml(dirty);
    expect(clean).toBe("<p>hi</p>link");
  });

  it("is enforced on every write path, not just import", async () => {
    const doc = await createDocument(alice, { contentHtml: "<p>ok</p><script>x()</script>" });
    expect(doc.contentHtml).toBe("<p>ok</p>");
    const updated = await updateDocument(alice, doc.id, { version: doc.version, contentHtml: '<p style="x" onmouseover="y()">z</p>' });
    expect(updated.contentHtml).toBe("<p>z</p>");
  });
});

describe("file import", () => {
  it("converts Markdown headings, lists and emphasis", async () => {
    const html = sanitizeDocumentHtml(await convertFileToHtml("notes.md", enc("# Title\n\n- **one**\n- two\n\n1. first")));
    expect(html).toContain("<h1>Title</h1>");
    expect(html).toMatch(/<ul>\s*<li><strong>one<\/strong><\/li>/);
    expect(html).toContain("<ol>");
  });

  it("escapes plain text and splits paragraphs", async () => {
    const html = await convertFileToHtml("a.txt", enc("line <b>1</b>\nline 2\n\npara 2"));
    expect(html).toBe("<p>line &lt;b&gt;1&lt;/b&gt;<br>line 2</p><p>para 2</p>");
  });

  it("converts .docx and preserves bold/italic", async () => {
    const bytes = new Uint8Array(readFileSync(new URL("./fixtures/sample.docx", import.meta.url)));
    const doc = await importDocument(alice, { name: "Quarterly Report.docx", bytes });
    expect(doc.title).toBe("Quarterly Report");
    expect(doc.contentHtml).toContain("<strong>bold text</strong>");
    expect(doc.contentHtml).toContain("<em>italic text</em>");
    expect(doc.role).toBe("owner");
  });

  it("rejects unsupported types, spoofed contents and oversized files", async () => {
    await expect(convertFileToHtml("x.pdf", enc("%PDF-1.4"))).rejects.toBeInstanceOf(UnsupportedType);
    await expect(convertFileToHtml("fake.docx", enc("%PDF-1.4 not a zip"))).rejects.toBeInstanceOf(UnsupportedType);
    await expect(convertFileToHtml("bin.txt", new Uint8Array([0x48, 0x00, 0xff, 0xfe]))).rejects.toBeInstanceOf(UnsupportedType);
    await expect(convertFileToHtml("big.txt", new Uint8Array(LIMITS.uploadMaxBytes + 1).fill(97))).rejects.toBeInstanceOf(PayloadTooLarge);
  });
});
