# Plan Review Report: Site Appearance Customization (`.ai/plans/brand/`)

## Review Overview

- **Target Plan**: `.ai/plans/brand/` (`specs.md`, `implementation.md`, `tasks.md`, `outcome/decisions.md`)
- **Skills Consulted & Applied**:
  - `test-expert` (4-Tier test matrix: Tier 1 Happy Path, Tier 2 Boundaries, Tier 3 Chaos/Concurrency, Tier 4 Security/Abuse)
  - `backend-security-review` & `pentester` (MIME verification, SVG sanitization, SSRF protection, randomized UUID storage keys)
  - `idor-testing` (BOLA/BOPLA defenses, session-injected audit user IDs)
  - `drizzle-best-practices` & `write-tests` (`queryDb(tx)` Neon HTTP mode, strict transaction propagation, `runInRollback` isolation)
  - `playwright-best-practices` (WCAG AA assertions, E2E visual consistency, snapshot tests)
  - `security-and-hardening` (XSS sanitization, hex validation, long-lived immutable cache headers)
  - `frontend-patterns` (Compound components, ref-stable debounced autosave, focus trapping, error boundary)
- **Layers Reviewed**:
  - `backend/types/` (`backend/types/AGENTS.md`)
  - `backend/db/repo/` (`backend/db/repo/AGENTS.md`)
  - `backend/db/seeds/` (`backend/db/seeds/AGENTS.md`)
  - `backend/services/` (`backend/services/AGENTS.md`)
  - `backend/graphql/` (`backend/graphql/AGENTS.md`)
  - `shared/` (`shared/AGENTS.md`)
  - `app/` (`app/AGENTS.md`)
  - `frontend/common/views/` (`frontend/common/views/AGENTS.md`)
  - `frontend/common/stores/` (`frontend/common/stores/AGENTS.md`)
  - `frontend/common/graphql/` (`frontend/common/graphql/AGENTS.md`)

---

## Findings by Rule Dimension

### 1. End-to-End Type Safety & Zod Validation
- **Status**: PASSED
- **Verification**:
  - `AppearanceFieldsSchema` in `shared/schemas/appearance.zod.ts` provides complete runtime and static validation across ENV variables and GraphQL mutations.
  - Strict hex regex (`#RRGGBB` / `#RGB`), string bounds, and `isSafeUrl()` URL checks.
  - Fail-safe parsing in `AppearanceSettingsService` ensures malformed ENV strings fall back to hardcoded defaults without crashing the process.

### 2. Test-Expert 4-Tier Testing Framework
- **Status**: PASSED
- **Verification**:
  - **Tier 1 (Happy Path & 100% Branch Coverage)**: Full CRUD on repo, 100% service branch coverage, complete GraphQL mutation argument matrix.
  - **Tier 2 (Edge Cases & Boundaries)**: RTL Arabic strings, 500-char descriptions, corrupt JSON env strings, missing fields.
  - **Tier 3 (Monkey & Chaos Testing)**: Concurrent `saveDraft` vs `publish` races, simulated DB timeouts on SSR metadata fetch.
  - **Tier 4 (Security & Abuse Testing)**: Low-privilege authorization bypass, XSS injection payloads, SSRF attempts via `logoUrl`, SVG malicious scripts.

### 3. Type Imports & Single Canonical Object Type Pattern
- **Status**: PASSED
- **Verification**:
  - All DB/API types (`AppearanceSettingsRow`, `AppearanceSettingsReturnType`, `AppearanceFields`, `AppearanceDraftInput`) are declared in `backend/types/appearance.types.ts` and re-exported through `@/backend/types`.
  - Pothos object implementations import `AppearanceSettingsReturnType` from `@/backend/types` without defining local or ad-hoc definitions.

### 4. Service Boundaries & SSR
- **Status**: PASSED
- **Verification**:
  - Server components (`app/layout.tsx`) and SSR CSS generators (`server-theme-css.ts`) call `AppearanceSettingsService.getFirstAppearancePublished()` / `AppearanceSettingsService.getResolvedAppearance()` directly (Server Component → Service).
  - Repositories are strictly called by backend services, never by App Router pages directly.

### 5. Zero-Latency Serverless Architecture (Vercel + Neon + Upstash)
- **Status**: PASSED
- **Verification**:
  - Synchronous in-memory & validated ENV fast path (`NEXT_PUBLIC_APP_BRANDING` / preset theme) executes in `<0.05ms` on cold starts.
  - Inlined `<style id="server-theme-css">` injected in `<head>` ensures zero CLS and zero FOUC.
  - Next.js `unstable_cache` with tag `"appearance"` used for DB-published values and purged immediately via `revalidateTag("appearance")` and `invalidateEnvConfigCache()`.

### 6. Security Hardening & Drizzle Best Practices
- **Status**: PASSED
- **Verification**:
  - Logo uploads use MIME verification + SVG sanitize step to prevent stored XSS attacks.
  - External logo URLs checked via `isSafeUrl()` to block SSRF.
  - BOLA/IDOR protected: audit fields derived from `ctx.userId`.
  - Drizzle queries use `queryDb(tx)` for stateless Neon HTTP performance on reads and propagate `tx` on writes.

---

## Verdict

**Plan passes all AGENTS.md rules, incorporates comprehensive Zod/ENV type-safety, and meets all test-expert 4-tier standards.**
