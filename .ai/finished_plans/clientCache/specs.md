# Translation Browser Cache — Specifications

## Document Information

- **Feature Name**: Translation Browser Cache — Hybrid SW + IndexedDB
- **Version**: 1.0
- **Date**: 2026-07-30
- **Author**: Siraj AI
- **Related Documents**:
  - Implementation: [implementation.md](./implementation.md)
  - Trackable Tasks: [trackable-tasks.md](./trackable-tasks.md)
  - Comparison research: [docs/cache-strategies-comparison.md](../../../docs/cache-strategies-comparison.md)
- **Process Reference**: [`.agents/spec-process-guide`](../../../.agents/spec-process-guide)

## Introduction

### Feature Summary

Persist lazy-loaded translation namespace chunks (alongside all Next.js static chunks) in the browser so locale strings survive page reloads, with automatic invalidation when the build changes.

### Business Value

The current `useAppTranslation(Translation.*)` system uses Turbopack dynamic `import()` per namespace leaf. On a full page reload, every dynamic chunk the user has visited must re-fetch from the network. Caching them client-side eliminates redundant round trips on navigation/reload, improving perceived load time for repeat visits in production and offline resilience for the PWA-style manifest already declared in `app/manifest.ts`. The page becomes an installable PWA with locale strings available offline.

### Scope

**In scope:**
- All `/_next/static/chunks/*.js` responses cached via a service worker + Cache API (primary strategy).
- A fallback JSON-snapshot + IndexedDB cache (auto-activated only on insecure contexts) that keys on `NEXT_PUBLIC_BUILD_ID`.
- Both locales `ar` and `en`.
- Build-time snapshot generation script and `NEXT_PUBLIC_BUILD_ID` stamping.

**Out of scope:**
- Caching of font / image / API responses.
- Service worker pre-caching of the entire app shell (could be added later).
- Backend / server-side translation caching (the server assembler remains static).
- Cache lookup analytics dashboards.

---

## Requirements

### Requirement 1: Persist translation chunks across page reloads

**User Story:** As a returning user, I want translation strings cached in my browser so that page reloads feel instant without re-fetching locale chunks I have already downloaded.

#### Acceptance Criteria

1. WHEN a user loads a route in a secure context (HTTPS or `localhost`) THEN the system SHALL intercept `/_next/static/chunks/*.js` GET requests via a service worker and cache each response in the Cache API under a single cache named with prefix `siraj-static-chunks-`.
2. WHEN a user reloads a page in a secure context THEN the system SHALL serve previously-cached chunk responses from Cache API without making a network round trip for unchanged chunks.
3. WHEN a translation leaf source changes THEN the bundler SHALL emit a new chunk URL with a new content hash, the service worker SHALL miss cache for that URL, re-fetch it, and cache the new response.
4. WHEN a translation leaf source has NOT changed THEN the bundler SHALL preserve the same chunk URL, and the service worker SHALL return the cached response without re-fetching.
5. WHERE the browser has no service worker support the system SHALL silently fall back to today's behavior (no caching) without throwing.

_Requirements: REQ-CACHE-SW_

**Additional Details**
- **Priority**: High
- **Complexity**: Medium
- **Dependencies**: None — works with the existing `defineNamespace` infrastructure, zero loader changes required.
- **Cache name versioning**: `"siraj-static-chunks-v1"`. Bump the version constant to invalidate the entire SW cache (e.g., format change).

---

### Requirement 2: Auto-detect insecure context and fall back to IndexedDB

**User Story:** As an operator of a plain-HTTP staging environment, I want translation strings cached between reloads without requiring HTTPS.

#### Acceptance Criteria

1. IF `window.isSecureContext === false` THEN the system SHALL NOT register the service worker and SHALL activate the IndexedDB snapshot fallback.
2. WHEN the IndexedDB fallback is active and a namespace is loaded for the first time THEN the system SHALL attempt to read the cached snapshot keyed by `${BUILD_ID}:${namespaceId}:${locale}` from IndexedDB.
3. IF the cached snapshot's BUILD_ID does not match the runtime `NEXT_PUBLIC_BUILD_ID` THEN the system SHALL wipe the entire `siraj-locale-snapshots` IndexedDB and re-populate from the network.
4. IF a snapshot hit occurs with matching BUILD_ID THEN the system SHALL revive the JSON (reconstructing function members via `new Function`) and use the result without a network request.
5. WHERE the browser does not support IndexedDB the system SHALL silently degrade to today's cold-load behavior without throwing.

_Requirements: REQ-FALLBACK-IDB_

**Additional Details**
- **Priority**: Medium
- **Complexity**: High
- **Dependencies**: Each `defineNamespace` call must receive a stable string `namespaceId` so snapshot keys are reproducible across builds.

---

### Requirement 3: Stamp a build identifier

**User Story:** As a developer, I want a stable per-build identifier so the client cache layer can detect when a build changes.

#### Acceptance Criteria

1. WHEN `next build` runs THEN `next.config.ts` SHALL expose `NEXT_PUBLIC_BUILD_ID` to both server and client bundles via `generateBuildId` + `env`.
2. IF `NEXT_PUBLIC_BUILD_ID` env var is set (CI-supplied) THEN the system SHALL use it verbatim.
3. IF `NEXT_PUBLIC_BUILD_ID` is unset AND `.next-locale-snapshots-version` exists THEN the system SHALL use its content (a content hash of all locale snapshots).
4. ELSE the system SHALL fall back to a random UUID (dev mode) so cache misses happen predictably without stale reads.

_Requirements: REQ-BUILD-ID_

**Additional Details**
- **Priority**: High
- **Complexity**: Low
- **CI integration**: Vercel/CI must stamp `NEXT_PUBLIC_BUILD_ID` from `git rev-parse --short HEAD` or rely on the snapshot content hash.

---

### Requirement 4: Generate JSON snapshots at build time

**User Story:** As a developer, I want a deterministic JSON snapshot of every namespace's labels so the insecure-context fallback has a serializable cache payload.

#### Acceptance Criteria

1. WHEN `bun run locale:snapshots` runs THEN the system SHALL walk the namespace registry (`shared/locale/namespaces/**/*.namespace.ts`) and emit one JSON file per `(namespaceId, locale)` pair under `shared/locale/cache-snapshots/<locale>/<namespace-id>.json`.
2. WHEN a labels value member is a function THEN the snapshot SHALL serialize it as `{ "__fn": "<Function.prototype.toString result>" }`.
3. WHEN a labels value member is a primitive or plain object THEN the snapshot SHALL serialize it via standard JSON.
4. WHEN an emitted file already exists with identical content THEN the system SHALL skip write (mtime preservation) to avoid rebuilding.
5. AFTER all snapshots are emitted THEN the system SHALL compute a single content hash and write it to `.next-locale-snapshots-version`.

_Requirements: REQ-SNAPSHOTS_

**Additional Details**
- **Priority**: Medium
- **Complexity**: Medium
- **Dependencies**: Each namespace must have a stable `namespaceId` (see REQ-FALLBACK-IDB).

---

### Requirement 5: Snapshot serving via public folder

**User Story:** As an insecure-context client, I want to fetch a single namespace's snapshot JSON on demand so I can populate IndexedDB without re-running the full leaf import.

#### Acceptance Criteria

1. WHEN the build produces snapshot JSON files THEN the deploy target SHALL serve them at `/_next/static/locale-snapshots/<locale>/<namespace-id>.json` (or `/static/locale-snapshots/...` — exact path defined in implementation).
2. WHEN the IndexedDB fallback miss occurs THEN the client SHALL fetch the single JSON file for the `(namespaceId, locale)` pair.
3. IF the JSON fetch fails THEN the client SHALL fall through to the existing dynamic `import()` leaf loader (no broken state).

_Requirements: REQ-SERVE_

---

### Requirement 6: Zero regression risk on existing translation hooks

**User Story:** As a developer, I want the caching layer to be transparent so existing `useAppTranslation(Translation.*)` calls keep working unchanged.

#### Acceptance Criteria

1. WHERE the browser is in a secure context the in-memory Suspense cache (`translation-cache-store.ts`) SHALL be augmented by SW caching transparently with no API surface change.
2. WHERE the IndexedDB fallback is active THEN `translation-cache-store.ts` SHALL use the snapshot branch BEFORE falling through to `config.load[locale]()`; the public `readTranslation` and `ensureNamespaceLoading` signatures SHALL remain unchanged.
3. WHEN either cache strategy fails (IndexedDB throws, Cache API disabled) THEN the system SHALL degrade silently to today's behavior.

_Requirements: REQ-NO-REGRESSION_

---

### Requirement 7: Diagnostics telemetry (minimal)

**User Story:** As an operator, I want basic cache hit/miss telemetry so I can confirm the cache is working in production.

#### Acceptance Criteria

1. WHEN the IndexedDB fallback reads or writes a snapshot THEN the `snapshot-cache.ts` module SHALL increment internal hit/miss/size counters.
2. WHEN `getLocaleCacheStats()` is called THEN the module SHALL return `{ hits: number; misses: number; size: number }` computed since page load.
3. WHERE the logger is available the module SHALL log a one-line info message on the first IndexedDB hit and the first BUILD_ID mismatch (no logging on every cache operation — avoid spam).

_Requirements: REQ-TELEMETRY_

---

### Requirement 8: Outcome Knowledge Base & Progress Tracking

**User Story:** As a developer/agent, I want all implementation learnings captured in outcome files so future agents don't repeat analysis.

#### Acceptance Criteria

1. BEFORE executing any task THEN the executing agent SHALL read ALL existing files in `.ai/plans/clientCache/outcome/`.
2. AFTER completing a task THEN the executing agent SHALL write `.ai/plans/clientCache/outcome/<task-id>-outcome.md` with research/doc findings and implementation details.
3. AFTER completing a task THEN the executing agent SHALL update the task checkbox `[ ]` → `[x]` in `trackable-tasks.md`.

_Requirements: REQ-OUTCOME-KB_

---

## UX/Navigation Specification

This feature is a **transparent infrastructure enhancement** with no user-facing UI changes:

| Aspect | Detail |
|--------|--------|
| **New Routes & URLs** | None — no new pages or routes are added. |
| **Sidebar/Navigation Integration** | None — no navigation items are added or modified. |
| **Role-Based Access Matrix** | All roles benefit equally — the cache is browser-level and applies to all authenticated and unauthenticated users. |
| **Per-Audience Rendering** | No per-audience differences — the cache layer is transparent to all user types (SUPER_ADMIN, ACADEMY_ADMIN, SUPERVISOR, TEACHER, PARENT, STUDENT, STAFF, USER, GUEST). |
| **Mobile vs Desktop Variants** | No differences — the service worker and IndexedDB APIs are available on both mobile and desktop browsers. |
| **Permission Mapping** | No new permissions required — the cache operates at the browser level, not the application authorization level. |

---

## Outcome & Knowledge Transfer Protocol

All feature plans created using the spec-driven-development skill live under `.ai/plans/<feature-name>/` and include a dedicated outcome directory: `.ai/plans/clientCache/outcome/`.

- **BEFORE Execution:** Executing agents MUST read ALL existing files in `.ai/plans/clientCache/outcome/` to avoid re-analysis.
- **AFTER Execution:** Executing agents MUST write `.ai/plans/clientCache/outcome/<task-id>-outcome.md` with research/doc findings and implementation details.
- **PROGRESS TRACKING:** Executing agents MUST update task checkboxes `[ ]` → `[x]` in `trackable-tasks.md`.

---

## Quality Checklist

### Requirements Checklist
- [x] All user roles identified and addressed (N/A — transparent infrastructure)
- [x] Normal, edge, and error cases covered (see Error Handling in implementation.md)
- [x] Requirements are testable and measurable (EARS format used throughout)
- [x] No conflicting requirements
- [x] EARS format used consistently

---

## Assumptions and Constraints

| # | Assumption / Constraint |
|---|--------------------------|
| A1 | Turbopack chunk URLs are stable across builds when the chunk content is unchanged (true for Turbopack contenthash-based URLs). |
| A2 | All locale leaf modules are pure ES modules whose function members are serializable via `Function.prototype.toString` and revivable via `new Function` (assumption held by code inspection of representative leaves in [docs/cache-strategies-comparison.md](../../../docs/cache-strategies-comparison.md)). |
| A3 | The repo currently ships no CSP header (verified: `next.config.ts` only sets X-Frame-Options and friends). Addition of a strict CSP that blocks `new Function` would force the alternative reviver table (out of scope). |
| A4 | All ~109 namespace files in `shared/locale/namespaces/**/*.namespace.ts` must be updated mechanically to pass a stable `namespaceId` string (one-time pass). |
| A5 | The `bun` runtime is used for the snapshot codegen script — no Node-specific APIs required. |

---

## Out-of-Scope Future Work

- Pre-cache the entire app shell for offline-first PWA (only chunks today).
- Cache fonts / images / API responses in the service worker.
- Per-user language preference auto-switching based on browser locale at install time.
- Strict-CSP reviver table to avoid `new Function`.
- Cache analytics dashboard / Sentry integration for cache invalidation events.

---

## References

- Reference plan: [Translation Cache SW+IDB plan](../../.cursor/plans/translation_cache_sw+idb_92573106.plan.md) — design rationale, file inventory, verification plan.
- Comparison research artifact: [docs/cache-strategies-comparison.md](../../../docs/cache-strategies-comparison.md)
- Spec process guide: [`.agents/spec-process-guide`](../../../.agents/spec-process-guide)
