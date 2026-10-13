# Ajaia Docs

A lightweight collaborative document editor: create, format, import and share rich-text documents with role-based access.

**Live demo:** _LIVE_URL_ · **Walkthrough video:** see [`VIDEO_URL.txt`](VIDEO_URL.txt)

| Demo account | Password | What to try |
|---|---|---|
| `alice@ajaia.test` | `demo1234` | Owns **Q4 Planning**; shared with Bob (editor) and Carol (viewer) |
| `bob@ajaia.test` | `demo1234` | Can edit Q4 Planning; owns a private doc nobody else can see |
| `carol@ajaia.test` | `demo1234` | Read-only access to Q4 Planning |

The login page has one-click **Sign in as …** buttons for each account.

---

## Features

- **Documents**: create, rename (inline title), edit, delete. Debounced autosave with a visible *Saving… / Saved / Couldn't save – Retry* status.
- **Rich text** (Tiptap): bold, italic, underline, H1–H3, bulleted and numbered lists, quotes, undo/redo, plus standard keyboard shortcuts (⌘B / ⌘I / ⌘U …).
- **File import**: upload **.txt, .md or .docx (max 2 MB)** to create a new editable document. Formatting is kept (Markdown headings and lists, Word bold and italic).
- **Sharing**: the owner shares by email as **Viewer** or **Editor**, can change roles or revoke access, and sees who has access. The dashboard splits **My documents** from **Shared with me** (shared docs show owner and role).
- **Persistence**: Postgres. Content is stored as sanitized HTML, so formatting survives reloads exactly.
- **Conflict safety**: every save carries a version number. If someone else saved first, you get a *"changed somewhere else – Reload"* banner instead of silently overwriting their work.

## Run locally

Requirements: **Node 20.9+**. No database install is needed.

```bash
npm install
npm run dev        # http://localhost:3000
```

Without `DATABASE_URL`, the app uses **PGlite** (Postgres compiled to WASM, running in-process). Data is stored in `./.data/`, and migrations and demo seed data are applied automatically on the first request. Delete `.data/` to reset.

To use a real Postgres instead, copy `.env.example` to `.env.local`, set `DATABASE_URL`, then run `npm run db:migrate`.

### Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Dev server (Turbopack) |
| `npm test` | Vitest suites (each file gets a fresh in-memory Postgres) |
| `npm run typecheck` | Type-check with **TSGo** (`@typescript/native-preview`, the native Go port of `tsc`) |
| `npm run lint` | ESLint (Next + React Compiler rules) |
| `npm run build` | TSGo typecheck, then production build |
| `npm run db:generate` | Generate a SQL migration from `server/schema.ts` (drizzle-kit) |
| `npm run db:migrate` | Apply migrations and seed demo users to `DATABASE_URL` |

## Deploy (Vercel + Neon, both free tiers)

1. `npx vercel login`, then `npx vercel link` (or import the Git repo in the Vercel dashboard).
2. Vercel project → **Storage → Create → Neon Postgres → Connect**. This injects `DATABASE_URL` and `DATABASE_URL_UNPOOLED`.
3. `npx vercel --prod`. The `vercel-build` script runs migrations and the idempotent seed, then `npm run build`.

No other secrets are needed: sessions are random tokens stored (hashed) in Postgres, not signed JWTs.

## Project structure

```
app/                      Next.js routes only (pages + API route handlers, kept thin)
client/                   Frontend
  config/routePaths.ts    Every page and API URL, in one place
  registry/               Declarative registries: editor commands (drive the toolbar),
                          editor extensions (schema), role labels/badges
  services/               Typed API clients (authService, documentService, shareService)
  hooks/                  useAutosave (debounced, coalescing, version-aware saves)
  components/             ui/ (React Aria Components wrappers), auth/, layout/, dashboard/, editor/
  utils/
server/                   Backend (all modules are `server-only`)
  services/               Domain logic + authorization: documents, shares, auth, import
  repo/                   Drizzle queries only
  importers/              Import registry: extension → { sniff, toHtml }
  auth/                   Password hashing, DB-backed sessions
  http.ts                 Route wrapper: session, same-origin check, zod parsing, error mapping
  sanitize.ts             The single HTML allowlist applied on every write
  schema.ts, db.ts        Drizzle schema; Postgres or PGlite connection
shared/                   Used by both sides: access policy, zod schemas, DTO types, limits
tests/                    Vitest suites + .docx fixture
drizzle/                  Generated SQL migrations
proxy.ts                  Per-request CSP nonce + signed-out redirect
```

See [ARCHITECTURE.md](ARCHITECTURE.md) for design decisions and tradeoffs, and [AI_WORKFLOW.md](AI_WORKFLOW.md) for how AI tools were used.
