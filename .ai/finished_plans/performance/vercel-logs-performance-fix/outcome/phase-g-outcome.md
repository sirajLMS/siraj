# Phase G — Investigate `url.parse()` Deprecation Warning

**Phase:** G (Investigation Only — no code changes)
**Date:** 2026-08-19T00:31:00+03:00
**Requirements:** REQ 7
**Outcome:** Source package identified; no upgrade available; recommendation: accept as known upstream issue.

---

## Executive Summary

The `[DEP0169] url.parse()` deprecation warning originates from `@as-integrations/next` v4.1.0 (Apollo Server's Next.js integration handler), specifically at `startServerAndCreateNextHandler.js:95`. This is a **direct dependency** of the project, not a transitive one. The installed version (4.1.0) is the latest published. An open upstream issue (#320) documents this and proposes a fix, but it has not yet been merged or released. No code change or package upgrade is recommended at this time.

---

## G1.1 — Source Identification

### Investigation Approach

Ran `node --trace-deprecation` against the initially suspected packages, then ran the Next.js dev server with `--trace-deprecation` and made HTTP requests to capture the full stack trace.

### Direct `require()` Tests (all NEGATIVE — no warning)

| Command | Warning? | Notes |
|---------|----------|-------|
| `node --trace-deprecation -e "require('@neondatabase/serverless')"` | ❌ No | No deprecation warning |
| `node --trace-deprecation -e "require('ws')"` | ❌ No | No deprecation warning |
| `node --trace-deprecation -e "require('pg')"` | ❌ No | No deprecation warning |
| `node --trace-deprecation -e "require('pg'); new Pool({...})"` | ❌ No | No warning even with Pool instantiation |
| `node --trace-deprecation` + neon + `neonConfig.webSocketConstructor = ws` | ❌ No | No warning with WebSocket constructor assignment |
| `node --trace-deprecation` + full dev server startup | ❌ No | No warning during server startup/compilation |

### Dev Server Trace (POSITIVE — warning captured)

Started `NODE_OPTIONS="--trace-deprecation" node --trace-decoration node_modules/.bin/next dev --port 3099` and made requests:

- **`GET /`** (homepage) → HTTP 200, **no DEP0169 warning**
- **`GET /en`** (localized route) → HTTP 200, **no DEP0169 warning**
- **`POST /api/graphql`** (GraphQL endpoint) → HTTP 200, **DEP0169 warning appeared**

### Full Stack Trace

```
(node:2878406) [DEP0169] DeprecationWarning: `url.parse()` behavior is not standardized and prone to errors that have security implications. Use the WHATWG URL API instead. CVEs are not issued for `url.parse()` vulnerabilities.

    at urlParse (node:url:137:13)
    at /home/ahmed/Projects/siraj/.next/dev/server/chunks/node_modules_0qazv3g._.js:2598:200
    at step (/home/ahmed/Projects/siraj/.next/dev/server/chunks/node_modules_0qazv3g._.js:2503:23)
    at Object.next (/home/ahmed/Projects/siraj/.next/dev/server/chunks/node_modules_0qazv3g._.js:2444:20)
    at fulfilled (/home/ahmed/Projects/siraj/.next/dev/server/chunks/node_modules_0qazv3g._.js:2409:32)
    at process.processTicksAndRejections (node:internal/process/task_queues:104:5)
[2026-08-19 00:27:38.939] [DEBUG] [GraphQL Context] No auth cookies found in request
 POST /api/graphql 200 in 8.8s (next.js: 8.3s, application-code: 508ms)
```

### Root Cause — Exact Source

**Package:** `@as-integrations/next`
**File:** `node_modules/@as-integrations/next/dist/startServerAndCreateNextHandler.js`
**Line:** 95

```javascript
// line 92-97
case 1: return [4 /*yield*/, _b.apply(_a, [(_j.httpGraphQLRequest = (
    _k.body = _o.sent(),
    _k.headers = (0, getHeaders_1.getHeaders)(req),
    _k.method = req.method || 'POST',
    _k.search = req.url ? (0, url_1.parse)(req.url).search || '',  // ← DEP0169 here
    _k),
    _j)])];
```

The integration handler calls `url.parse(req.url)` to extract the `search` (query string) portion of the incoming HTTP request URL when constructing the `httpGraphQLRequest` object passed to Apollo Server's `executeHTTPGraphQLRequest` method.

**Why it fires on every cold start:** The `POST /api/graphql` handler is the first GraphQL request after a cold container starts. The `url.parse()` call is inside the request handler — it fires on the first GraphQL request, not at server startup. The original Vercel logs showed 4 occurrences because there were 4 cold containers in the observation window, each handling their first GraphQL request.

### Usage in the Project

```
File: app/api/graphql/route.ts
  Line 7:  import { startServerAndCreateNextHandler } from "@as-integrations/next";
  Line 67: return startServerAndCreateNextHandler<NextRequest>(server, {
  Line 68:   context: createGraphQLContext,
  Line 69: });
```

The project's GraphQL API route (`/api/graphql`) uses this integration as the HTTP handler bridge between Next.js App Router and Apollo Server 4.

---

## G1.2 — Upgrade Availability Assessment

| Package | Installed | Latest (npm) | Status |
|---------|-----------|-------------|--------|
| `@as-integrations/next` | 4.1.0 | 4.1.0 | **Already at latest** — no upgrade available |
| `@neondatabase/serverless` | 1.1.0 | 1.1.0 | Already at latest (verified — no `url.parse` in source) |
| `ws` | 8.21.1 | 8.21.3 | Minor patch behind (verified — no `url.parse` in source) |
| `pg` | 8.23.0 | — | No `url.parse` in source (uses `pg-connection-string` which uses `new URL()`) |
| `ioredis` | 6.0.0 | 6.0.0 | Already at latest (verified — uses `new URL()`, `url.parse` only in comments) |

### `@as-integrations/next` Version History

| Version | Published | Notes |
|---------|-----------|-------|
| 1.0.0 | (older) | |
| 2.0.0 | 2023-05-18 | |
| 3.0.0 | 2023-11-06 | |
| 3.2.0 | 2024-11-08 | |
| 4.0.0 | 2025-07-22 | |
| **4.1.0** | 2025-10-28 | **Current latest** — contains the `url.parse()` call |

No beta, alpha, or pre-release versions exist. No fork with the fix is published on npm.

### Upstream Issue

**Issue #320** on `apollo-server-integrations/apollo-server-integration-next`:
- **Title:** url.parse() deprecation warning in startServerAndCreateNextHandler.js
- **State:** OPEN (as of 2026-08-19)
- **Author:** az4399 (ayo)
- **Opened:** 2026-05-17
- **Comments:** 0 (no response from maintainers)
- **Proposed fix:** Replace `url.parse(req.url)` with `new URL(req.url, 'http://localhost').search`
- **Link:** https://github.com/apollo-server-integrations/apollo-server-integration-next/issues/320

The proposed fix from the upstream issue:

```javascript
// Before (line 95):
_k.search = req.url ? (0, url_1.parse)(req.url).search || '' : '',

// After (proposed):
_k.search = req.url ? new URL(req.url, 'http://localhost').search || '' : '',
```

### Changelog / Release Notes Check

No `CHANGELOG.md` was found in the `@as-integrations/next` package distribution. The GitHub repository's release history does not mention `url.parse` removal. The latest version (4.1.0, published 2025-10-28) still contains the deprecated call.

---

## G1.3 — Recommendation

### Summary Table

| Item | Value |
|------|-------|
| Source package | `@as-integrations/next` (Apollo Server Next.js integration) |
| Installed version | 4.1.0 |
| Latest available | 4.1.0 (no newer version exists) |
| Direct or transitive? | **Direct dependency** (`app/api/graphql/route.ts:7`) |
| File & line | `node_modules/@as-integrations/next/dist/startServerAndCreateNextHandler.js:95` |
| Upgrade safe? | N/A — already at latest; no fix version available |
| Upstream issue | [#320 — OPEN](https://github.com/apollo-server-integrations/apollo-server-integration-next/issues/320) |
| Impact | LOW — cosmetic deprecation warning only; no functional or security impact |
| Code fix needed? | **No** — investigation only (per plan design) |

### Recommendation: Accept as Known Upstream Issue

1. **No upgrade is possible** — the installed version (4.1.0) is the latest published. No newer version or pre-release exists on npm.
2. **Upstream fix is pending** — Issue #320 was opened on 2026-05-17 with a proposed fix, but has received no maintainer response and no fix has been released.
3. **Impact is negligible** — The `url.parse()` deprecation warning is purely cosmetic (Node.js DEP0169). It does not affect functionality, security, or performance. The WHATWG URL API is recommended for new code, but `url.parse()` continues to work in Node.js 24/26 and is not scheduled for removal.
4. **The warning fires once per cold container** on the first GraphQL request, not per-request (it only appeared 4 times in the original Vercel logs because there were 4 cold containers). It is not a per-request performance concern.
5. **Do NOT patch the package** — Modifying `node_modules/@as-integrations/next/dist/startServerAndCreateNextHandler.js` would be a non-reproducible fix lost on every `bun install`. Using `patch-package` would be possible but is a code change outside the scope of this investigation-only phase.

### Future Actions (Deferred)

- **Monitor upstream issue #320** — If a fixed version is released, upgrade `@as-integrations/next` to that version.
- **Consider `patch-package`** — If the warning becomes actionable (e.g., `url.parse` is removed in a future Node.js LTS), apply the one-line fix via `patch-package` or `bun patch`. The fix is trivial:
  ```javascript
  // Replace (0, url_1.parse)(req.url).search with:
  new URL(req.url, "http://localhost").search
  ```
- **Consider alternative integrations** — If the upstream package remains unmaintained, consider migrating to `@as-integrations/h3` (v2.0.3) or a custom Apollo Server HTTP handler that uses the WHATWG URL API.

---

## Investigation Notes

### Initial Suspects Ruled Out

| Suspect | Ruled Out By |
|---------|-------------|
| `@neondatabase/serverless` v1.1.0 | `grep -rn "url\.parse" node_modules/@neondatabase/serverless/` → no matches |
| `ws` v8.21.1 | `node --trace-deprecation -e "require('ws')"` → no warning |
| `pg` v8.23.0 | `pg-connection-string` v2.14.0 uses `new URL()`, not `url.parse()` |
| `ioredis` v6.0.0 | `grep` found `url.parse` only in comments; actual code uses `new URL()` |
| `drizzle-kit` | Contains `url.parse` but is a **build-time CLI tool** — never loaded at runtime |
| `next` (Next.js core) | `grep` found `url.parse` in Babel bundle and testing utils — not on the GraphQL request path |

### Environment

- **Node.js:** v26.7.0
- **Next.js:** 16.3.1 (Turbopack)
- **Package manager:** Bun (bun.lock)
- **Dev server:** `NODE_OPTIONS="--trace-deprecation" node --trace-deprecation node_modules/.bin/next dev --port 3099`

### No Source Code Modified

This was an investigation-only phase. No source files, package versions, or configuration files were modified.

---

*Phase G complete. The `url.parse()` deprecation warning is confirmed to originate from `@as-integrations/next@4.1.0` (line 95 of `startServerAndCreateNextHandler.js`). No upgrade or code fix is available at this time. The issue is deferred and documented as a known upstream limitation pending issue #320 resolution.*
