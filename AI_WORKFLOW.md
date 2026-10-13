# AI workflow note

> _Author's note: review and adjust this in your own voice before submitting. Everything below reflects what actually happened in this build._

## Tools used

- **Claude Code (Claude Opus 5.5)** in the terminal as the primary implementation agent: planning, scaffolding, writing code, running the dev server, curl smoke tests and the test suite.
- **Claude in Chrome** (browser automation) to click through the real UI as Alice, Bob and Carol and inspect the live DOM.
- Next.js 16's bundled docs (`node_modules/next/dist/docs`), which the agent read before writing code because Next 16 renamed middleware to `proxy.ts` and changed CSP and caching conventions.

## How I worked with it

I treated the AI as a fast pair, not an oracle. I owned the product and architecture decisions; the agent proposed a plan and executed it, and I steered at decision points:

- **Picked the stack and scope from a proposed plan.**
  - Next.js + Neon + Vercel.
  - Viewer/Editor roles as the one stretch feature.
  - Real-time, comments and history explicitly cut.
- **Asked for React Aria Components** instead of hand-rolled or generic UI. I wanted accessible dialogs, menus, selects and a roving-focus toolbar without spending time on them.
- **Raised the security and scalability bar** ("no compromise on security"). That changed the plan from JWT cookies to DB-backed, hashed, revocable sessions, and added Postgres-backed rate limiting, nonce CSP, Origin checks and upload sniffing.
- **Switched type checking to TSGo** and **required a structured frontend**: `config/routePaths`, `registry/`, `services/`, `hooks/`. This was applied mid-build as a refactor.

## Where AI materially sped things up

- **Boilerplate at volume.** Drizzle schema plus migration, a dozen route handlers, typed API services, React Aria wrapper components, and three test suites. Hours of typing compressed into minutes, so the timebox went to design and verification instead.
- **Reading unfamiliar, very new APIs.** Next 16 `proxy.ts`, the Tiptap 3 `useEditorState` selector, and React Aria render props / `preventFocusOnPress` were looked up in the installed packages rather than recalled from memory.
- **Fast verification loops.** A curl script exercised every permission edge (viewer PATCH → 403, stranger → 404, stale version → 409, cross-origin POST → 403, 6th bad login → 429) in seconds after each change.

## What I changed or rejected from AI output

| AI output / default | What I did instead | Why |
|---|---|---|
| Plan v1: signed-JWT session cookie | DB-backed random tokens, stored as SHA-256 hashes | JWTs can't be revoked on logout; the bar was "no compromise on security" |
| `create-next-app` default `cacheComponents: true` | Disabled; all pages dynamic | Nonce-based CSP requires per-request rendering; static shells would ship scripts without nonces |
| Next docs' CSP example (`style-src 'nonce-…'`) | `style-src 'self' 'unsafe-inline'`, scripts still nonce-only | React Aria and ProseMirror use inline style attributes, which nonces can't cover; inline styles can't execute code |
| Default `timestamp` columns (microsecond precision) | `timestamptz(3)` | Keyset-pagination cursors pass through JS `Date` (ms). Microseconds would make the cursor skip rows. Caught while designing pagination, before any code was written. |
| Recursive `useCallback` autosave | A `while` loop that drains pending edits | The React Compiler lint flagged self-reference; the loop is also easier to reason about (one request in flight) |
| `useEffect` resetting Share-dialog state on open | Dialog body remounts per open | Lint flagged a cascading-render pattern; remounting is simpler and can never show stale share lists |
| Toolbar buttons as plain RAC `ToggleButton`s | Added `preventFocusOnPress` | **Found in browser testing:** clicking a toolbar button stole focus, so typed text went nowhere |
| Select trigger rendering the whole option | Render only `selectedText` | Seen in a screenshot: the role descriptions were crammed into the trigger |
| PGlite pointed at `.data/pglite` | Create the directory first | Found by the first smoke test (`ENOENT`) |
| `.vercelignore` with an unanchored `docs` pattern | Anchored every pattern (`/docs`) | **A miss that reached production:** it also excluded `app/(app)/docs`, so every document page 404'd on Vercel. The API smoke test passed because it never requested a page; the post-deploy check now loads pages for all three users. |
| Migration script with top-level `await` | Wrapped in an async `main()` | Broke the first Vercel build; the local run had exited before reaching it. Reproduced locally before redeploying. |

## How I verified correctness, UX and reliability

- **Automated tests (Vitest, 22 tests, real Postgres via in-memory PGlite).** Covered:
  - The full permission matrix
  - 404-not-403 for strangers
  - Role change and revocation
  - Re-share upsert
  - Owned/shared separation and cursor pagination with no duplicates
  - Optimistic-concurrency conflicts
  - Sanitization on every write path
  - Markdown, text and .docx conversion
  - Spoofed and oversized uploads
  - Session revocation, generic login errors, rate limiting
  - Sign-up: duplicate emails, weak passwords, per-IP rate limit
  - Dashboard excerpts derived on every write
- **Testing the tests.** I deliberately broke the policy (gave editors `share`) and the sanitizer (allowed `onclick`). The suite failed both times, then passed again once reverted.
- **API smoke script** with three users' cookies against the running server, including CSRF and rate-limit checks.
- **Manual UI pass in a real browser.**
  - Formatting via toolbar and shortcuts
  - Reload to confirm persistence
  - Share dialog errors
  - Sign out, then sign in as the viewer to confirm no toolbar, a read-only editor, and a "View only" badge
- **Static checks**: TSGo strict typecheck, ESLint with React Compiler rules, and `next build`, all clean.
