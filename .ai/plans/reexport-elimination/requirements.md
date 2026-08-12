# Re-Export Elimination Plan — Requirements

## Problem Statement

The Siraj codebase has **745 cross-directory `@/`-path re-exports** across **186 `index.ts` barrel files**, plus **325 named `export { }` re-exports** (which should be `export *`), and **54 non-index `.ts`/`.tsx` files** with cross-layer re-exports. These violate the project's import/export conventions and create unnecessary indirection.

## User Stories

### US-1: No Cross-Directory Re-Exports
**As a** developer, **I want** `index.ts` barrel files to only re-export from files in the same directory, **so that** imports are transparent and traceable without indirection through barrels.

### US-2: `export *` as Default
**As a** developer, **I want** `index.ts` files to use `export * from "./same-dir-file"` instead of `export { A, B } from "./file"`, **so that** barrel exports stay DRY and automatically include new exports.

### US-3: No `@/` Paths in Barrel Exports
**As a** developer, **I want** `index.ts` exports to use `./` relative paths only (no `@/` aliases), **so that** barrel exports are always relative to the same directory.

### US-4: Consumers Import From Original Source
**As a** developer, **I want** consumer files to import types/values from their canonical source — NOT through cross-directory barrel shim files, **so that** imports are direct and avoid unnecessary indirection.

### US-5: Collision Registry
**As a** developer, **I want** a single registry file tracking ALL cases where `export { }` was kept because `export *` caused naming collisions, **so that** exceptions are documented and auditable.

## Acceptance Criteria (EARS)

1. **WHEN** an `index.ts` file uses `export { X } from "./same-dir-file"` **AND** `export *` would NOT cause a naming collision **THEN** the barrel SHALL use `export * from "./same-dir-file"` instead.

2. **WHEN** an `index.ts` file re-exports from a different directory (using `@/path`)
   **THEN** the cross-directory re-export SHALL be removed, and all consumers SHALL import from the original source file directly.

3. **WHEN** an `index.ts` file uses `@/` path aliases **THEN** the path SHALL be converted to `./` relative paths (same-directory only) or the export SHALL be removed if cross-directory.

4. **WHEN** `export *` would cause a naming collision (two source files exporting the same symbol name) **THEN** the barrel SHALL use named re-exports (`export { A, B } from "./file"`) **AND** an entry SHALL be written to the global collisions registry.

5. **WHEN** a non-index `.ts`/`.tsx` file re-exports types/values from a different layer/directory using `@/` paths **THEN** the re-export SHALL be removed and consumers SHALL import from the original source.

6. **WHEN** converting `@/` to `./` in an `index.ts` for a same-directory file (the file being exported IS in the same directory but uses `@/` path) **THEN** the `@/` path SHALL be replaced with `./` relative path.

7. **WHEN** verification runs **THEN** the system SHALL only use `bun run scripts/health/sub-loop.ts <file> --lifecycle codescene` — NO GraphQL, UI, E2E, DB, services, or integration tests.

8. **WHEN** all work is complete **THEN** `bun tsgo` SHALL report 0 errors, and `bun check:duplicates` SHALL show reduced clone counts.

## Constraints

- **NO GraphQL tests** — not allowed for this plan
- **NO UI tests** — not allowed for this plan
- **NO server-dependent tests** — not allowed for this plan
- **NO tests requiring Next.js server** — not allowed for this plan
- **Verification**: Only `bun run scripts/health/sub-loop.ts <file> --lifecycle codescene`
- **Pool size**: 12 concurrent subagents maximum
- **Branch**: `remove-duplicates`

## Scope

326 files across 66 batches:
- 186 `index.ts` files with `@/` cross-directory re-exports
- 86 `index.ts` files with named `export { }` where `export *` could be used
- 54 non-index `.ts`/`.tsx` files with cross-layer re-exports

**Target areas**: `app/`, `shared/`, `backend/`, `scripts/`, `frontend/`
