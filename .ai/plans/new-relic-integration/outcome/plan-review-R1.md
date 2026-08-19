# Plan Review R1 — New Relic Integration

## Review Date
Session: relic fork (ahmedhosnypro-new-relic-integration-spec)

## Affected Layers
- `app/AGENTS.md` — `instrumentation.ts` (root-level, but imports backend lib)
- `backend/AGENTS.md` — `backend/lib/newrelic-agent.ts`, `backend/lib/index.ts` barrel
- `backend/graphql/AGENTS.md` — `backend/graphql/gqlSchemaBuilder.ts`
- Root `AGENTS.md` — `next.config.ts`, `newrelic.cjs`, `package.json`, `AGENTS.md`, `docs/`

## Violations Found & Fixed

### 1. [BACKEND/GQL] Static import of `@pothos/tracing-newrelic` breaks dev/test (CRITICAL)
- **Rule**: AC-6/AC-19 — `newrelic` module MUST NEVER load in dev/test
- **Issue**: Task 6 said "Do NOT dynamic import `@pothos/tracing-newrelic` at top level — import it statically". But `@pothos/tracing-newrelic` imports `newrelic` at its top level, so a static import would cause `newrelic` to be evaluated in dev/test.
- **Fix**: Updated Task 6 to require conditional dynamic import/require gated by `NODE_ENV`, with three implementation options documented. Also updated implementation.md Decision 5 and Error Handling Strategy.

### 2. [BACKEND/GQL] `createNewrelicWrapper` API clarification
- **Rule**: `@pothos/plugin-tracing` `wrap` config takes a function `(resolver, options, config) => wrappedResolver`
- **Issue**: Task 6 didn't clarify that `createNewrelicWrapper()` RETURNS the wrap function — it should be assigned to `tracing.wrap`, replacing the current `wrapResolver(...)` call.
- **Fix**: Added clarification in Task 6.

### 3. [BACKEND] Missing barrel file update for `backend/lib/index.ts`
- **Rule**: Root AGENTS.md barrel conventions — every exportable module in a subdirectory must be re-exported from the barrel
- **Issue**: Task 3 creates `backend/lib/newrelic-agent.ts` but doesn't add it to `backend/lib/index.ts` barrel.
- **Fix**: Added subtask 3.0 to add `export * from "./newrelic-agent"` to the barrel.

### 4. [APP] Incorrect AGENTS.md reference for `instrumentation.ts`
- **Rule**: `instrumentation.ts` is root-level, not under `app/`
- **Issue**: Task 4 referenced `app/AGENTS.md` and `frontend.instructions.md` — neither applies to root-level files. Only `backend.instructions.md` applies (it imports from `./backend/lib/env`).
- **Fix**: Updated Task 4 to remove `app/AGENTS.md` and `frontend.instructions.md` references.

### 5. [GENERAL] `newrelic.cjs` eslint-disable comment violates AGENTS.md
- **Rule**: AGENTS.md — "NEVER add `oxlint-disable` comments"
- **Issue**: Task 2 instructed adding `eslint-disable` for `@typescript-eslint/no-require-imports`.
- **Fix**: Updated Task 2 — `.cjs` files are not linted by the project ESLint config. No inline disables needed.

### 6. [APP] `next.config.ts` incorrect AGENTS.md reference
- **Rule**: `next.config.ts` is root-level, not under `app/`
- **Issue**: Task 5 referenced `app/AGENTS.md`.
- **Fix**: Removed `app/AGENTS.md` reference, kept root `AGENTS.md` and `frontend.instructions.md`.

## Checks Passed

- ✅ **Type imports**: No new types defined in Pothos files — plan doesn't create any types
- ✅ **Service boundaries**: No Server Component changes, no direct repo access
- ✅ **MUI v9**: No UI component changes
- ✅ **i18n**: No user-facing strings — all changes are backend observability
- ✅ **Logging**: Task 3 correctly specifies `@/backend/lib/logger` (never `console.*`)
- ✅ **GraphQL documents**: No new GraphQL documents or mutations
- ✅ **Enum registration**: No new enums
- ✅ **Single canonical object type**: No new GraphQL object types
- ✅ **authScope pattern**: No new mutations
- ✅ **Path aliases**: All task descriptions use `@/` import paths
- ✅ **Barrel conventions**: Subtask 3.0 added for `backend/lib/index.ts` barrel update
- ✅ **Drizzle schema**: No schema changes (drizzle push/migrate not needed)
- ✅ **UX/Navigation**: Design doc correctly documents N/A for all UX sections

## Result

**Plan passes all AGENTS.md rules for affected layers** after the 6 fixes above.
