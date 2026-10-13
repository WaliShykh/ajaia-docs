# Architecture note

## What I prioritized, and why

The brief asks for a coherent slice, not a Google Docs clone. I put the time into the parts reviewers will actually exercise and the parts that are expensive to fix later:

1. **Correct access control.** Sharing is the feature most likely to be subtly wrong. Every permission decision goes through one declarative policy, is enforced on the server, and is covered by tests.
2. **An editor that feels solid.** Formatting via toolbar *and* shortcuts, autosave with honest status, no lost work on concurrent edits, and a proper read-only mode for viewers.
3. **Security baseline with no shortcuts.** Sanitization on every write, revocable sessions, CSRF and CSP, rate-limited login, and upload content-sniffing.
4. **Zero-friction review.** One-click demo logins, `pnpm i && pnpm dev` with no database to install, and a free-tier deployment.

**Deliberately cut:** real-time co-editing, comments, version history, export, email invites and password reset. Each would be shallow in the timebox. The path to each is described below.

## Stack

| Concern | Choice | Why |
|---|---|---|
| App | Next.js 16 (App Router, route handlers), React 19, TypeScript strict | One deployable unit for UI and API; server components fetch the first page with no client waterfall |
| Type checking | **TSGo** (`@typescript/native-preview`) | Native-speed `tsc`; gates `pnpm build` |
| UI primitives | **React Aria Components** + Tailwind v4 | Accessible dialogs, menus, selects, tabs, toolbar (roving focus) and focus management out of the box |
| Editor | Tiptap 3 (ProseMirror) | Mature schema-based editor; its schema doubles as a whitelist |
| DB | Postgres via Drizzle ORM: **Neon** in production, **PGlite** locally and in tests | Real Postgres semantics everywhere (enums, keyset pagination, `ON CONFLICT`), but no install for reviewers, and each test file gets a fresh database |
| Validation | zod schemas in `shared/` | One definition for both the request boundary and TS types |

## Layers

```
Browser ──► proxy.ts (CSP nonce, signed-out redirect)
        ──► app/api/*/route.ts   thin: authedRoute() → parse (zod) → call service → JSON
                 │
                 ▼
        server/services/*        domain rules + authorize(role, action)   ← tested directly
                 │
                 ▼
        server/repo/*            Drizzle queries only                     ─► Postgres
```

- **Route handlers never contain business logic.** `server/http.ts#authedRoute` does session lookup, the same-origin check, `no-store`, and maps typed domain errors (`NotFound`, `Forbidden`, `Conflict`, …) to HTTP statuses. Server components call the same services directly, so there's no second code path.
- **Frontend layering mirrors this.**
  - `client/config/routePaths.ts` owns every URL.
  - `client/services/*` own every fetch.
  - `client/registry/*` holds declarative config: the toolbar is rendered from `editorCommands`, and role labels come from `roleRegistry`.
  - Components stay presentational.
- **Extension points are single edits.**

  | To add… | Edit |
  |---|---|
  | A role (e.g. commenter) | `shared/policy.ts` and `client/registry/roles.ts` |
  | An import format | One entry in `server/importers` |
  | A toolbar button | One entry in `client/registry/editorCommands.ts` |
  | An editor node | `client/registry/editorExtensions.ts` and the sanitizer allowlist |

## Data model

```
users(id, email UNIQUE, name, password_hash)
sessions(id, token_hash UNIQUE, user_id → users, expires_at)
documents(id, owner_id → users, title, content_html, excerpt, version, created_at, updated_at)
    INDEX (owner_id, updated_at DESC, id DESC)
document_shares(document_id → documents, user_id → users, role ENUM(viewer, editor), created_by)
    PK (document_id, user_id), INDEX (user_id, document_id)
rate_limits(key, window_start, count)  PK (key, window_start)
```

- **Ownership is a column, not a share row.** There is exactly one owner, and it can't be revoked by accident.
- **Content is sanitized HTML.** Tiptap reads and writes it natively, the importers produce it, and it's human-readable in the DB. Storing ProseMirror JSON would make server-side import conversion and sanitization harder for no benefit at this scope.
- **`excerpt`** is a plain-text preview derived on every write, so dashboard cards show content without list queries ever loading document bodies.
- **`version`** is an optimistic-concurrency token: `UPDATE … WHERE id = $1 AND version = $2`. Zero rows updated means 409 Conflict.

## Access policy (`shared/policy.ts`)

| Role | read | edit | share / revoke | delete |
|---|:-:|:-:|:-:|:-:|
| owner | ✓ | ✓ | ✓ | ✓ |
| editor | ✓ | ✓ | | |
| viewer | ✓ | | | |
| no access | 404 | 404 | 404 | 404 |

- The role is resolved from the database on each request in one indexed query (document LEFT JOIN the caller's share row). It is never taken from the client.
- No-access returns **404, not 403**, so document IDs can't be probed.
- The UI uses the same `can()` function, but only to hide controls; the server re-checks everything.

## Security

| Threat | Mitigation |
|---|---|
| Stored XSS via document content or imports | `server/sanitize.ts` allowlist (p, h1–h3, strong/em/u/s, lists, blockquote, code/pre, br, hr; **no attributes, no URLs**) applied on create, update *and* import. Content is rendered only through Tiptap, never `dangerouslySetInnerHTML`. |
| Script injection generally | Per-request **nonce CSP** with `strict-dynamic`, `object-src 'none'`, `base-uri 'none'`, `frame-ancestors 'none'`. `style-src` allows inline *style attributes* because React Aria and ProseMirror position elements with them; inline styles can't execute code. |
| Session theft / fixation | 256-bit random token in an `HttpOnly; Secure; SameSite=Lax` cookie with the `__Host-` prefix in production. Only a SHA-256 hash is stored. Logout deletes the row (real revocation). 7-day expiry, checked in SQL. |
| CSRF | SameSite=Lax, **plus** every mutating API request must carry an `Origin` matching the host. JSON-only bodies except the multipart import. |
| Credential guessing / enumeration | bcrypt (cost 12). The same generic error for a wrong password and an unknown email, and a dummy hash compare for unknown emails so timing matches. Postgres-backed rate limits: 5 / 15 min per IP+email, 50 / 15 min per IP; sign-up 10 / hour per IP. Passwords must be at least 8 characters. |
| Malicious uploads | Extension allowlist **plus content sniffing**: `.docx` must start with the ZIP signature, and `.txt`/`.md` must be valid UTF-8 with no NUL bytes. 2 MB cap checked on `Content-Length` and again on the bytes. Parsed in memory; nothing is written to disk or served back raw. |
| Injection | Parameterized queries only (Drizzle); path IDs validated as UUIDs. |
| Misc headers | `nosniff`, `X-Frame-Options: DENY`, HSTS, strict `Referrer-Policy`, `Permissions-Policy`, COOP, `poweredByHeader: false`. |

**Known tradeoffs, accepted for this scope:**

- **Sign-up reveals whether an email is registered.** Every sign-up form does; the rate limit keeps it from being used for bulk enumeration. Email verification and password reset are out of scope.
- **Sharing reveals whether an account exists.** Sharing with an unknown email says "No user found", which tells a signed-in user that the email has no account. An internal tool can live with that; a public product would send invites instead.
- **IP-keyed rate limits depend on the host.** They trust `x-real-ip` / `x-forwarded-for`, which Vercel sets correctly.
- **Successful logins count toward the per-account limit.**
- **Zip bombs inside `.docx` aren't size-checked after decompression.** Mitigation would be checking uncompressed entry sizes before handing the file to mammoth.
- **`pnpm audit` findings are outside our code paths.**
  - The moderate `sprintf-js` advisory comes from mammoth's CLI argument parser, which we never invoke.
  - The high `braces` advisories are in the dev-only ESLint toolchain.

## Scalability

- **Stateless app tier.** All state, including sessions and rate-limit counters, lives in Postgres, so any number of Vercel function instances behave identically. The DB pool is small per instance (`max: 5`, `prepare: false` for Neon's pooler).
- **Every hot query is index-backed.** That covers the dashboard lists, role lookup, and session lookup.
- **List queries never load document bodies.** They use **keyset pagination** on `(updated_at, id)` with millisecond-precision timestamps, so cursors round-trip exactly through JS. Page N costs the same as page 1. The UI has "Load more".
- **Autosave is cheap.** It is debounced (800 ms), coalesces edits while a request is in flight (at most one in flight per editor), and flushes on tab hide and navigation.
- **When load grows:**
  - Move document bodies to a separate table or object storage if they get large.
  - Add a Neon read replica for list and read traffic.
  - Add a `tsvector` column for search.
  - Cache read-only views at the edge.

## What I'd build next (2–4 hours)

1. **Real-time co-editing.** Yjs + Hocuspocus (y-prosemirror), persisting snapshots back to `content_html`. This replaces the 409-on-conflict model with true merging and gives presence indicators for free.
2. **Version history.** Append a `document_versions` row on a time or size threshold of autosaves, plus a restore UI.
3. **Export to Markdown / PDF.**
4. **E2E tests** with Playwright covering the share → second-user flow in a real browser.
5. **Invite-by-email** for people without accounts (which also closes the enumeration tradeoff), and real auth via OAuth/SSO.
