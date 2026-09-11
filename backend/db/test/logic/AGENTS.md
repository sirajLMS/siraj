# Backend Database Logic Tests

## Purpose

This directory contains **business-logic** integration tests that run against a live PostgreSQL instance inside rolled-back transactions. Tests here verify cross-cutting behaviour that a single repository cannot capture on its own: state-machine transitions, security/RLS enforcement, concurrency races, encryption/column constraints, audit/immutability guarantees, soft-delete integrity, and orchestration across multiple repositories + services.

Files are grouped by domain in sub-directories, mirroring the `backend/db/test/repo/`, `backend/db/repo/`, `backend/types/`, `backend/enum/`, `backend/graphql/`, and `backend/db/seeds/` layouts.

## Rules

All rules from the parent `backend/db/test/AGENTS.md` apply here (transaction rollbacks, `runInRollback`, try/catch error helper pattern, `bun:test`, no `any`, no hardcoded error strings).

### Mandatory Test Patterns
- **`runInRollback`**: Every database test MUST run inside `runInRollback` (imported from `@/backend/db/test/test-utils`). Pass the `tx` instance to **every** repository method AND Drizzle query — mixing `tx` queries with `db`-backed repo calls causes deadlocks.
- **No `expect(...).rejects.toThrow()` inside `runInRollback`** — use a try/catch helper (e.g. `expectRepoError` / `expectRepositoryError`) and assert on `.toContain()` with a translated-message substring, not the raw translation key.
- **Clean Setup Helpers**: Use helpers from `@/backend/db/test/entity-setup`. Generate unique emails / IDs via `randomUUID()` or prefixed strings to avoid unique-constraint violations.
- **Bun Test**: Use `import { describe, test, it, expect, beforeAll, afterAll } from "bun:test"` — never Jest/Vitest.
- **Strict Type Safety**: No `as any` overrides. No `console.log` — use `testLogger` or no logging.
- **Code Cleanliness**: Run `bun tsgo` and the per-file lint after creating or modifying tests. Fix all resulting TS6133 unused-import / unused-variable errors.

### Import Convention
- **Aliased imports for parent helpers** (preferred): `import { runInRollback } from "@/backend/db/test/test-utils";` and `import { setupTestEntities } from "@/backend/db/test/entity-setup";`. Aliased paths are unchanged by sub-directory moves, so prefer them over relative references (`../../test-utils`, `../../entity-setup`).
- Repository / service / type / schema / enum imports use the standard `@/` aliases (e.g. `@/backend/db/repo`, `@/backend/db/schema`, `@/backend/types`, `@/backend/enum`).
- Intra-domain sibling imports use relative paths (e.g. `import { testRepoError } from "./scheduling-test-helpers";`).

### File Organization
- Group related business-logic tests for the same domain in the matching sub-directory.
- The `backend/db/test/repo/` directory holds repository **unit** tests (one repo per file); this `logic/` directory holds **cross-repo / cross-service** tests. Don't duplicate coverage between them.
- Cross-cutting tests that don't fit any single domain (RLS, cache routing, encryption, concurrency, audit immutability across tables) live in `shared/`.

### Adding New Tests
1. Identify the matching sub-directory (or create a new one following the sub-directory convention).
2. Create `<scenario>.test.ts` in that sub-directory.
3. No `index.ts` barrel is needed — test files are not imported by other code; the test runner discovers them by glob (`backend/db/test/logic/**/*.test.ts`). Sub-directories exist purely for organisation.
4. Follow the verification loop: `bun tsgo` + `bun biome:check` + per-file lint for new/modified test files before considering the test done.

## Linting Rules

- NEVER use `oxlint-disable` comments — fix the root cause.
