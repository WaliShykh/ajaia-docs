import "server-only";
import sanitizeHtml from "sanitize-html";

/**
 * The single allowlist for stored document HTML. Applied on *every* write
 * (create, update, import) — the client editor is never trusted.
 * No attributes and no URL-bearing tags are allowed, which rules out
 * script/event-handler/javascript: injection entirely.
 */
const OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    "p", "h1", "h2", "h3", "strong", "em", "u", "s",
    "ul", "ol", "li", "blockquote", "code", "pre", "br", "hr",
  ],
  allowedAttributes: {},
  allowedSchemes: [],
  disallowedTagsMode: "discard",
  // Drop the *contents* of dangerous elements, not just the tags.
  nonTextTags: ["script", "style", "textarea", "option", "noscript", "iframe", "object", "embed"],
  transformTags: {
    b: "strong",
    i: "em",
    strike: "s",
    del: "s",
    h4: "h3",
    h5: "h3",
    h6: "h3",
  },
};

export function sanitizeDocumentHtml(html: string): string {
  return sanitizeHtml(html, OPTIONS).trim();
}

const EXCERPT_MAX = 200;

/** Plain-text preview of (already sanitised) document HTML for dashboard cards. */
export function excerptFromHtml(html: string): string {
  const text = sanitizeHtml(html.replace(/<\/(p|h[1-6]|li|blockquote|pre)>|<br\s*\/?>/gi, " "), {
    allowedTags: [],
    allowedAttributes: {},
  });
  // sanitize-html leaves entities encoded; decode the few it emits.
  const decoded = text.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'");
  return decoded.replace(/\s+/g, " ").trim().slice(0, EXCERPT_MAX);
}
