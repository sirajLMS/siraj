# Bun 1.3.14 Compatibility Verification — Email Template Dependencies

> Subagent research report. Verifies Bun install/runtime compatibility of every dep the plan adds (plan line 6 + related attachments), then cross-checks against the React Email v6 package-shape research (`01-react-email-v6-package-shape.md`) which already established that `@react-email/components` and `@react-email/render` are **folded into `react-email` in v6** and must be dropped from the install set.

## VERDICT: NEEDS UPDATE

All remaining deps install and run cleanly on the repo's Bun runtime, **but the install set on plan line 6 is wrong** for v6 (lists two deprecated packages) and two provider-SDK entries have Bun runtime caveats worth surfacing. The single most important fix is dropping `@react-email/components` and `@react-email/render` and pinning `@react-email/editor` to `^1.1` (the `^1.6` in the plan does not exist yet — see `02-react-email-editor-capabilities.md`).

---

## The deps being verified (from plan line 6 + attachments)

| # | Plan dep | Latest (Aug 2026) | v6 status | Verdict |
|---|---|---|---|---|
| 1 | `react-email@6` | 6.9.1 | Unified package — KEEP | VERIFIED |
| 2 | `@react-email/editor` | 1.1.2 (Apr 2026) | Separate — KEEP (pin `^1.1`, not `^1.6`) | VERIFIED |
| 3 | `@react-email/components` | 1.0.12 (legacy) | **DROPPED in v6** (merged into `react-email`) | SKIP |
| 4 | `@react-email/render` | 2.1.0 (legacy leaf) | **DROPPED in v6** (re-exported from `react-email`) | SKIP |
| 5 | `@react-email/ui` | 6.9.1 | Renamed from `preview-server`; dev-tooling only | VERIFIED (devDep, optional) |
| 6 | `nodemailer` | 9.0.3 | SMTP transport | VERIFIED w/ caveats |
| 7 | `@aws-sdk/client-ses` | 3.1101.0 | AWS SDK v3 | VERIFIED w/ caveats |
| 8 | `postmark` | 5.1.0 | fetch-based | VERIFIED (cleanest) |
| 9 | `mailgun.js` | 13.3.0 | axios-based; needs `FormData` | VERIFIED (needs `form-data`) |
| 10 | `@tiptap/*` (peer of `@react-email/editor`) | `^3.17.1` | Transitive — pulled by `@react-email/editor` | VERIFIED |

Cross-check confirmations (from `01-react-email-v6-package-shape.md`):
- React Email v6 unified all components + `render`/`pretty`/`toPlainText` into the single `react-email` package.
- The official v5→v6 migration guide says: *"All components (previously in `@react-email/components` or individual packages like `@react-email/button`) and rendering utilities (previously in `@react-email/render`) are now exported directly from `react-email`."*
- `@react-email/components` is **deprecated**; `@react-email/render` is kept but **redundant** (its exports are re-exported from `react-email`, per the `03-react-email-render-api.md` research). Installing either in a v6 project yields duplicate `render` implementations and a frozen v5 component line.

---

## Bun environment facts (from `package.json` + `bun.lock`)

- **`packageManager`**: NOT set in `package.json`. No `engines` field either. The repo never pins a Bun version, so the active Bun is whatever is on `PATH` (the project assumes Bun 1.2+ per AGENTS.md and scripts use `~/.bun/bin/bun`). The lockfile is the modern text-based `bun.lock` (Bun ≥ 1.2), confirmed present at `/home/ahmed/Projects/siraj-mail/bun.lock` (`"lockfileVersion": 1`).
- **`trustedDependencies`** (lines 245-247):
  ```json
  "trustedDependencies": ["sharp"]
  ```
  Because an explicit `trustedDependencies` array is defined, **the default Bun built-in allowlist is fully replaced** (Bun docs: *"Defining `trustedDependencies` in `package.json` **replaces** the default list rather than extending it."*). That means any future dep whose `postinstall` script needs to run must be appended here — or packages already trusted by Bun's default list (e.g. `esbuild`) keep working only because Bun also has internal handling, but per the docs you are expected to re-add default-list entries you still need.
- **`overrides`** (lines 248-250):
  ```json
  "overrides": { "eslint-import-resolver-typescript": "3.7.0" }
  ```
  No `react-email` / AWS / nodemailer / postmark / mailgun / tiptap entries today — none of the new deps conflict with this existing override.
- **`ignoreScripts`** (lines 242-244): `["sharp"]` — list of packages whose scripts are skipped even if trusted.
- **Existing peer**: `resend@6.18.1` is already a dependency and already declares `@react-email/render` as an optional peer (`"peerDependencies": { "@react-email/render": "*" }, "optionalPeers": ["@react-email/render"]` — found in `bun.lock` at the `resend` entry). So the `@react-email/render` name space is *already* known to the lockfile; installing it explicitly in v6 would be redundant double-tracking.

---

## Per-dep verification

### 1. `react-email@6` (current 6.9.1) — VERIFIED

- **Bun install**: ✅ Pure JS workspace, no native modules, no postinstall. `peerDependencies` per `@react-email/render@2.1.0` (which `react-email` re-exports): `react ^18.0 || ^19.0 || ^19.0.0-rc`, `react-dom ^18.0 || ^19.0 || ^19.0.0-rc`. Repo is on React `19.2.8` / `react-dom` `19.2.8` — satisfies. No `engines.node` field (registry metadata returned `engines: None`).
- **Bun runtime**: ✅ `render()` is async (returns `Promise<string>`) and was made async **specifically for better Next.js RSC support** (changelog rationale quoted in `03-react-email-render-api.md`). Server-safe to call from a Next.js 16 RSC server module. Bun natively supports `fetch`, `FormData`, `ReadableStream`, `ReadableByteStreamController` — all the Web APIs the v6 render path uses (per bun.sh Node.js Compatibility page, all marked 🟢 Fully implemented).
- **Known issues**: no known Bun-specific issues. Fallback only: if a `ReactServerComponentsError: importing a component that imports react-dom/server` appears, add `react-email` to `serverExternalPackages` in `next.config.ts` (Next 16's modern field, not under `experimental`). Per `@react-email/render@1.0.0+` this is no longer required in practice.

### 2. `@react-email/editor` (current 1.1.2) — VERIFIED (pin to `^1.1`)

- **Bun install**: ✅ 34 dependencies, **all pure JS** — `@floating-ui/react-dom`, `@radix-ui/react-popover`, `@radix-ui/react-slot`, ~25 `@tiptap/*` packages (`^3.17.1`), `hast-util-from-html`, `prismjs`, and `react-email@6.0.1` (workspace dep). No native modules, no postinstall scripts. Peer: `react ^18.0 || ^19.0` — satisfies. **The `@tiptap/*` packages are NOT installed separately**: the editor bundles them as direct dependencies. As confirmed by the registry metadata for `@react-email/editor` and several integration guides: *"the single `@react-email/editor` package includes the necessary dependencies for both [TipTap and ProseMirror], so you do not need to install TipTap or ProseMirror separately for standard usage."*
- **Bun runtime**: ✅ TipTap/ProseMirror are pure JS rich-text frameworks (no native modules). Bun supports `node:stream`, Web streams, DOM APIs used by the editor. Several community tutorials (e.g. "First look at React Email Editor") explicitly use Bun (`bun add @react-email/editor`) and report it works. **One Next.js 16 caveat**: the editor uses browser APIs and must be in a `'use client'` component; set `immediatelyRender: false` on the underlying Tiptap editor to avoid SSR hydration mismatch errors (TipTap Next.js guide).
- **Known issues**:
  - **Version mismatch in the plan**: the plan says `@react-email/editor@^1.6`. **`^1.6` does not exist** — published range is `1.0.0` → `1.1.2` (Apr 2026) per the registry metadata confirmed in `02-react-email-editor-capabilities.md`. Install `@react-email/editor@^1.1` instead.
  - **Prism.js code-block grammars** slow Next.js dev compiles (documented editor gotcha, not Bun-specific). Escape hatch if it bites: `pnpm patch` / `patch-package` to strip unused grammars from `dist/components/...prism.cjs`.

### 3. `@react-email/components` — SKIP (deprecated in v6)

- Folded into `react-email@6`. Installing it would duplicate `render` and pull the frozen v5 component line. **Do not add.** Cross-confirmed in `01-react-email-v6-package-shape.md`.

### 4. `@react-email/render` — SKIP (redundant in v6)

- `render`, `pretty`, `toPlainText` are all re-exported from the unified `react-email` package. Installing it standalone is **kept working** (`2.1.0` ships runtime-specific exports for `node`/`browser`/`worker`/`edge-light`/`workerd`/`deno`/`convex`) but redundant — see `01` and `03` for full reasoning.

### 5. `@react-email/ui` (current 6.9.1) — VERIFIED (optional devDep)

- **Bun install**: ✅ Same monorepo lineage as `react-email`, ships in lockstep (both at `6.9.1`). Registry metadata: no `engines`, no `peerDependencies`, no `bin`. Pure JS. Install as a **devDependency** — it's the renamed successor to `@react-email/preview-server` and provides the local dev-preview server UI for the `react-email` CLI. It is **NOT a component library** and is not imported in application code (gotcha #5 in `01`). Only add if the team wants the standalone `npx react-email dev` preview harness.
- **Bun runtime**: ✅ Dev-tooling only; runs the `react-email` CLI preview server. No native modules.

### 6. `nodemailer` (current 9.0.3) — VERIFIED with caveats

- **Bun install**: ✅ Pure JS (`nodemailer@9.0.3`), no native modules, no postinstall. README states: *"Nodemailer supports all Node.js versions starting from Node.js@v6.0.0"* — Bun ≥ 1.2 satisfies the Node API surface. Weekly downloads ~17M, 10.6K dependents.
- **Bun runtime**: ⚠️ **Works for typical SMTP send**, but Bun's Node stream/socket compatibility has historical edge cases under sustained SMTP use. **Known Bun issues**:
  - oven-sh/bun#10329 — *"Nodemailer — Cannot send message: smtp connection socket is already destroyed"* (open, labels: `bug`, `ecosystem`, `node:stream`). Original report April 2024, last updated Nov 2025.
  - oven-sh/bun#6101 — *"Nodemailer `ECONNREFUSED: Failed to connect`"* — fixed in **Bun 1.0.7** (Oct 2023) by PR #6206.
  - oven-sh/bun#3701 — *"Using Nodemailer, sending emails in a loop only has ≅1/3 success rate"* — Bun 0.6.x era; integration tests now run nodemailer in every PR per the maintainer reply.
  - nodemailer/nodemailer#1644 — the upstream maintainer (`andris9`) explicitly closed a Bun-tracking issue with: *"Nodemailer has guaranteed support only for Node."* (Jul 2024).
- **Recommendation**: Nodemailer works for low-volume transactional SMTP under Bun 1.2+, but for production email the siraj plan should prefer the API-based providers (SES / Postmark / Mailgun) which use `fetch` and avoid the SMTP socket/transport layer entirely. If SMTP is unavoidable: reuse a single transporter (do not `createTransport` per send), and set conservative `maxConnections`/`maxMessages`.

### 7. `@aws-sdk/client-ses` (current 3.1101.0) — VERIFIED with caveats

- **Bun install**: ✅ Pure JS, 8 deps (`@aws-sdk/core`, `credential-provider-node`, `types`, `@smithy/core`, `fetch-http-handler`, `node-http-handler`, `@smithy/types`, `tslib`). No native modules, no postinstall. AWS officially documents the `bun add @aws-sdk/client-ses react-email` install path in the React Email SES integration guide. Node >= 16 per the SDK (registry says `engines.node >= 20` for `@react-email/render`; AWS SDK has its own lower Node floor — Bun satisfies all).
- **Bun runtime**: ⚠️ **AWS SDK v3 has sustained HTTPS-stream regressions on Bun 1.3.x that are NOT present on Bun 1.2.x or Node.** SES itself uses HTTP POSTs (small payloads), so it is far less exposed than S3/Kinesis stream consumers, but you should know the runtime history:
  - oven-sh/bun#26066 — *"HTTPS requests hanging (regression 1.2.23 → 1.3.x)"* — still open as of Jul 2026. Affects continuous AWS SDK v3 calls (S3/CloudFormation/IAM/STS/Lambda/EC2). ~400-500 requests in, requests hang indefinitely. Workaround pinned to **Bun ≤ 1.2.23** or Node. The repo is on Bun 1.2+ and AGENTS.md does not pin a specific 1.2.x.
  - oven-sh/bun#28703 — *"node:https response streams hang under concurrent S3 downloads"* — fixed in PR #28704 (merged Apr 2026), but the parent #26066 remains open.
  - oven-sh/bun#30415 — *"Native RSS grows linearly under sustained AWS SDK v3 Kinesis GetRecords"* — fixed in PR #30416 (HTTP/2 stream reclamation).
- **Recommendation for siraj**: SES bulk sends (`sendEmail` / `sendBulkTemplatedEmail`) are small request/response and use HTTP/1.1 — low exposure to the stream-hang regression. Pin Bun to a 1.2.x patch (≥ 1.2.23) if you observe any hang, or use the bundled `@smithy/fetch-http-handler` with a `FetchHttpHandler` if you want full Web-API transport (sidesteps `node:http` entirely). Do nothing preemptively; the issues are repro rate-dependent.

### 8. `postmark` (current 5.1.0) — VERIFIED (cleanest)

- **Bun install**: ✅ Zero runtime dependencies — README: *"The library uses the native Fetch API and has no runtime dependencies."* Requires Node >= 18; Bun supports global Fetch 🟢 Fully implemented. TypeScript-native.
- **Bun runtime**: ✅ Simplest of the four transports. Uses `fetch` only — the safest possible surface for Bun. React Email's official Postmark integration doc lists `npm install postmark react-email`; same code runs under `bun add`. Gotcha: Bun's undici-based `fetch` does not read `HTTP_PROXY`/`HTTPS_PROXY` env vars — if siraj ever runs behind a corporate proxy, pass a custom `fetch` bound to an `undici.ProxyAgent` via the `fetch` client option.

### 9. `mailgun.js` (current 13.3.0) — VERIFIED (needs `form-data`)

- **Bun install**: ✅ 3 deps: `axios ^1.15.0`, `base-64 ^1.0.0`, `url-join ^4.0.1` — all pure JS. Requires Node >= 18. No native modules, no postinstall.
- **Bun runtime**: ⚠️ Two caveats, both surmountable:
  1. **Constructor requires a `FormData` impl.** The README is explicit: *"starting from version 3.0 you need to pass FormData (we need this to keep library universal). For node.js you can use built-in FormData or `form-data` library."* Under Bun you can either:
     - Pass the **global `FormData`** (Bun implements it 🟢 Fully implemented — no extra dep needed), OR
     - `bun add form-data` and pass `import FormData from 'form-data'` (the canonical Node pattern shown in Mailgun's docs and in third-party Bun tutorials). The plan should add `form-data` to the install set if it wants maximum compatibility with the documented usage; otherwise rely on global `FormData` and set `useFetch: true` on the client (see below).
  2. **Default transport is `axios` (uses `node:http`/`node:https`)** — subject to the same Bun HTTPS regression family as the AWS SDK (#26066). To avoid it, Mailgun's SDK exposes `useFetch: true` on the client options: it switches the underlying transport to global `fetch` ("Cloudflare Workers / Vercel: pass `useFetch: true` … Node / Bun / AWS Lambda: works with the configuration above"). Recommended under Bun.
- **No known Bun GitHub issues** specific to `mailgun.js` found.

### 10. `@tiptap/*` (peer of `@react-email/editor`, `^3.17.1`) — VERIFIED

- **Bun install**: ✅ All ~25 `@tiptap/*` packages are **direct dependencies of `@react-email/editor`**, not peers you install separately. The editor's own `package.json` pins them at `^3.17.1`. Per the editor's "getting started" docs and multiple integration guides, the editor bundles TipTap and ProseMirror — you do NOT need `bun add @tiptap/react @tiptap/pm @tiptap/starter-kit` in the siraj plan; the editor pulls them transitively.
- **Bun runtime**: ✅ TipTap and ProseMirror are pure JS (no native modules). Bun supports all DOM APIs they use at runtime. The only Bun-adjacent issue historically was the SSR hydration mismatch in Next.js, fixed by `immediatelyRender: false` (TipTap's Next.js guide) — a Next.js/React concern, not Bun.

---

## Recommended `trustedDependencies` / `overrides` deltas

**No additions required.** Of the 10 deps reviewed:
- None ship native modules.
- None run a `postinstall` script that affects functionality (only `sharp` from the existing config does, and that's already listed).
- None need `overrides` to deduplicate — but the existing `eslint-import-resolver-typescript` override is unrelated and untouched.

The Mailgun `form-data` dep is pure JS and needs no trust entry. AWS SDK, Postmark, NodeMail, Nodemailer — all pure JS, no scripts.

If, later, you choose to add `@react-email/ui` (dev preview server) AND it pulls a sub-dep with a build script, re-audit then. As of `6.9.1`, it adds nothing that requires trust.

---

## Final recommended install command (v6 reality)

```sh
bun add react-email @react-email/editor @aws-sdk/client-ses postmark mailgun.js form-data nodemailer
# (optional, only if running the standalone `react-email dev` preview harness)
bun add -D @react-email/ui
```

Notes:
- **Do NOT add** `@react-email/components` (deprecated) or `@react-email/render` (redundant; `render`/`pretty`/`toPlainText` come from `react-email`).
- **Drop `@react-email/ui` from the runtime install set** — it is dev-only (and optional).
- **Pin `@react-email/editor` to `^1.1`** (not `^1.6`, which does not exist yet).
- **`form-data` is only needed if you want the canonical Node/Mailgun usage pattern.** Under Bun you can alternatively pass the global `FormData` and skip `form-data`, but adding it preserves the patterns documented by Mailgun and is the safest cross-platform choice.
- No `trustedDependencies` or `overrides` rows need to be added to `package.json`.

---

## Exact plan-line edits

### Plan line 6 (the install-set list) — REPLACE

**Before (current plan, from line 6):**
```
react-email@6
@react-email/editor
@react-email/components
@react-email/render
@react-email/ui
nodemailer
@aws-sdk/client-ses
postmark
mailgun.js
@tiptap/* (peer of @react-email/editor)
```

**After (v6-correct):**
```
react-email@^6
@react-email/editor@^1.1            # (NOT ^1.6 — 1.6+ does not exist as of Aug 2026; latest is 1.1.2)
@aws-sdk/client-ses
postmark
mailgun.js
form-data                           # FormData impl for mailgun.js (or use global FormData under Bun)
nodemailer                          # SMTP fallback; prefer API providers under Bun (see caveats)
# @react-email/ui (-D, optional)   # dev-only preview-server UI; omit unless running `npx react-email dev`
# DROPPED in v6:
# @react-email/components           # merged into react-email
# @react-email/render               # re-exported from react-email
# @tiptap/*                         # @react-email/editor bundles these — do not install separately
```

### Plan line 75 (the install claim quoted by `02-react-email-editor-capabilities.md`)

**Before:**
> **Adopt [React Email v6](https://react.email) (`react-email@6` + `@react-email/components` + `@react-email/render` + `@react-email/ui`) paired with [`@react-email/editor@^1.6`](https://react.email/docs/editor/overview) (TipTap/ProseMirror visual editor that serializes to React Email components and exports email-ready HTML + plain text).**

**After:**
> **Adopt [React Email v6](https://react.email) (`react-email@^6`) paired with [`@react-email/editor@^1.1`](https://react.email/docs/editor/overview) (TipTap/ProseMirror visual editor that serializes to React Email components and exports email-ready HTML + plain text). `@react-email/components` and `@react-email/render` are folded into `react-email` in v6 and MUST NOT be installed separately. `@react-email/ui` is the dev-only preview-server UI (optional, install as `-D` only if running the standalone `react-email dev` harness).**

### Transports section of the plan — ADD

> The repo's `package.json` defines `trustedDependencies: ["sharp"]`, which **replaces** Bun's default allowlist. None of the new email deps (react-email, @react-email/editor, @aws-sdk/client-ses, postmark, mailgun.js, form-data, nodemailer) ship a `postinstall` script, so no `trustedDependencies` row needs to be added. No `overrides` entry is required either (existing `eslint-import-resolver-typescript` override is unrelated).
>
> Runtime caveats under Bun 1.2+:
> - **Preferred transports under Bun are the API/`fetch`-based SDKs (Postmark, SES)** — they avoid the SMTP socket layer where Bun historically had nodemailer flakiness.
> - For **Postmark**: if behind a corporate proxy, pass a custom `fetch` bound to an `undici.ProxyAgent` (Bun's global `fetch` does not read `HTTP_PROXY`/`HTTPS_PROXY`).
> - For **Mailgun**: pass `useFetch: true` to the client to use global `fetch` instead of `axios`/`node:http` (avoids Bun 1.3.x HTTPS hang regression — oven-sh/bun#26066).
> - For **AWS SES**: low exposure to #26066 (small HTTP POSTs). Pin Bun to ≥ 1.2.23 if any hang appears; or use `@smithy/fetch-http-handler` to bypass `node:http` entirely.
> - For **Nodemailer** (SMTP fallback): reuse ONE `createTransport()` instance across the process; do not create per-send. Set conservative `maxConnections`/`maxMessages`. Known open Bun issue: oven-sh/bun#10329 ("smtp connection socket is already destroyed").

---

## Sources

- Repo `package.json` (lines 142-159 deps, 245-250 trustedDeps/overrides) and `bun.lock` (lockfileVersion 1; `resend` peerDependencies block).
- `01-react-email-v6-package-shape.md`, `02-react-email-editor-capabilities.md`, `03-react-email-render-api.md` (already in `.ai/plans/email-templates/reserch/`) — for the v6 unification + version reality of `@react-email/editor`.
- https://www.npmjs.com/package/react-email (`6.9.1`, no `engines`, no `peerDependencies` on the umbrella package).
- https://www.npmjs.com/package/@aws-sdk/client-ses (`3.1101.0`), https://www.npmjs.com/package/nodemailer (`9.0.3`, "supports Node.js v6.0.0+"), https://www.npmjs.com/package/postmark (`5.1.0`, "uses the native Fetch API and has no runtime dependencies"), https://www.npmjs.com/package/mailgun.js (`13.3.0`, "Requires node.js >= 18.x"; "starting from version 3.0 you need to pass FormData").
- https://registry.npmjs.org/@react-email/ui and https://registry.npmjs.org/react-email (registry metadata: both at `6.9.1`, no `engines`, no `bin`, no `peerDependencies`).
- https://registry.npmjs.org/@react-email/editor (34 deps, all `@tiptap/*` at `^3.17.1`, `react-email@6.0.1`).
- https://bun.sh/docs/runtime/nodejs-apis — all of `fetch`, `FormData`, `ReadableStream`, `ReadableByteStreamController`, `node:stream`, `node:net`, `node:tls` are 🟢 Fully implemented.
- https://bun.sh/docs/install/lockfile — Bun 1.2 ships the text-based `bun.lock`; `bun.lockb` is the legacy binary format.
- https://bun.sh/docs/pm/lifecycle (and https://bun.com/guides/install/trusted) — defining `trustedDependencies` **replaces** the default allowlist rather than extending it.
- https://react.email/docs/integrations/aws-ses — official React Email SES integration guide shows `npm install @aws-sdk/client-ses react-email` (same pattern works under `bun add`).
- https://react.email/docs/integrations/postmark — official React Email Postmark integration guide.
- https://react.email/docs/editor/getting-started and https://www.resend.com/docs/knowledge-base/embed-react-email-editor — `bun add @react-email/editor` is officially documented; `@tiptap/*` are bundled.
- https://github.com/oven-sh/bun/issues/10329, #6101, #3701, #1644 (nodemailer) — runtime/SMTP caveats under Bun.
- https://github.com/oven-sh/bun/issues/26066, #28703, #30415 — AWS SDK v3 / node:https hang regressions on Bun 1.3.x.
- https://documentation.mailgun.com/docs/mailgun/sdk/nodejs_sdk and https://daloyjs.dev/docs/email/mailgun — `form-data` requirement and `useFetch: true` workaround.
