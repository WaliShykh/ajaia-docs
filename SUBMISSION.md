# Submission: Ajaia Docs

**Candidate:** Wali Ahmad
**Live product:** _LIVE_URL_
**Walkthrough video:** see `VIDEO_URL.txt`

## Test accounts

| Email | Password | Role in the seeded data |
|---|---|---|
| alice@ajaia.test | demo1234 | Owner of "Q4 Planning" |
| bob@ajaia.test | demo1234 | Editor on "Q4 Planning"; owns a private doc |
| carol@ajaia.test | demo1234 | Viewer on "Q4 Planning" |

The login page has one-click buttons for each. Suggested flow:

1. Alice creates or imports a document and shares it with Carol as Viewer.
2. Sign out, then sign in as Carol: the document is under **Shared with me** and opens read-only.
3. Sign in as Bob: he can edit Q4 Planning but can't see the Share button.

## What's included

| Path | Contents |
|---|---|
| `README.md` | Features, local setup, scripts, deploy steps, project structure |
| `ARCHITECTURE.md` | Priorities, layers, data model, access policy, security and scalability notes, tradeoffs, next steps |
| `AI_WORKFLOW.md` | AI tools used, where they helped, what was changed or rejected, how it was verified |
| `SUBMISSION.md` | This file |
| `VIDEO_URL.txt` | Link to the walkthrough video |
| `docs/screenshots/` | Screenshots of the main flows |
| `app/`, `client/`, `server/`, `shared/` | Source code (Next.js routes, frontend, backend, shared contracts) |
| `tests/` | Vitest suites (18 tests) and a `.docx` fixture |
| `drizzle/` | SQL migrations |
| `scripts/migrate.ts` | Migration + idempotent seed used by the Vercel build |
| `proxy.ts` | Per-request CSP and signed-out redirect |

## What works end to end

- Sign in / sign out with seeded accounts. Sessions are DB-backed and revocable; login is rate limited.
- Create, rename, edit and delete documents. Autosave shows status and offers retry on failure.
- Rich text: bold, italic, underline, H1–H3, bulleted and numbered lists, quote, undo/redo, keyboard shortcuts.
- Import **.txt / .md / .docx (≤ 2 MB)** into a new document with formatting kept. Other types, mismatched contents and oversized files get clear errors.
- Share by email as Viewer or Editor; change roles; revoke access. Dashboard tabs for **My documents** and **Shared with me**, with owner and role shown.
- Viewers get a read-only editor; editors can edit but not share or delete; non-shared users get a 404.
- Concurrent edits are detected (409) and the user is prompted to reload instead of overwriting.
- Persistence in Postgres (Neon in production; embedded PGlite locally with zero setup).

## Intentionally not built

- Real-time co-editing and presence. Concurrent edits are *detected*, not merged.
- Comments, suggestion mode, version history, export.
- Email invites for people without accounts, and password reset or sign-up (accounts are seeded).
- Images, links and tables in documents. They are excluded from the schema and the sanitizer allowlist on purpose.

## Next 2–4 hours

1. Yjs + Hocuspocus real-time collaboration with presence, persisting to the existing `content_html`.
2. Version history (snapshot table + restore).
3. Markdown/PDF export.
4. Playwright E2E for the cross-user sharing flow.
