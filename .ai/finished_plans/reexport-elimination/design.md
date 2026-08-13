# Re-Export Elimination Plan — Design

## Overview

This plan eliminates all cross-directory re-exports from `index.ts` barrel files across the entire Siraj project. The work is organized into 66 batches processed by a 12-subagent parallel pool. Each batch contains 4-6 files grouped by directory to ensure related changes are made together.

## Design Goals

1. **No cross-directory re-exports in `index.ts`** — barrels only export from same-directory files
2. **`export *` as default** — replace all `export { A, B } from "./file"` with `export * from "./file"`
3. **No `@/` paths in barrel exports** — only `./` relative paths
4. **Consumers import from original source** — no indirection through cross-dir barrels
5. **Collision exceptions documented** — single registry file for all `export { }` exceptions
6. **No naming collisions introduced** — verify `export *` doesn't collide

## The Rules (CRITICAL — Every Task Must Enforce)

### Rule 1: Same-Directory Only
```
index.ts MAY ONLY export from files in the SAME directory (using "./" paths).
index.ts MUST NOT re-export from any other directory (no "@/path/to/other/dir").
index.ts MUST NOT use "../" in export paths.
```

### Rule 2: `export *` Over Named Exports
```
index.ts MUST use `export * from "./file"` instead of `export { A, B } from "./file"`.
EXCEPTION: when `export *` causes a naming collision (TS2308 error).
          In that case, keep `export { }` and document in collisions-registry.md.
```

### Rule 3: `export type { }` Stays Type-Only
```
`export type { X } from "./file"` is CORRECT and stays as-is.
Type-only exports are NOT converted to `export *`.
```

### Rule 4: `./` Paths Only
```
index.ts exports MUST use "./" relative paths (e.g., `export * from "./foo"`).
NO "@/path" in index.ts exports.
NO "../path" in index.ts exports.
NO "../../path" in index.ts exports.
```

### Rule 5: Consumer Updates
```
When an index.ts file loses a cross-directory re-export, ALL consumers that
imported the re-exported symbol MUST be updated to import from the original
source (the actual file where the symbol is defined).
```

### Rule 6: Nested Barrels Are Kept
```
Nested index.ts files are kept. A subdirectory's index.ts aggregates its
own files. A parent directory's index.ts MAY use `export * from "./subdir"`
(same relative path to a direct subdirectory's barrel).
BUT: a parent index.ts MUST NOT use `@/` paths to aggregate subdirectories.
```

### Rule 7: Collision Registry
```
When `export *` causes TS2308 (duplicate export name), keep `export { A }
from "./file"` and add an entry to:
  .ai/plans/reexport-elimination/outcome/collisions-registry.md
```

## Key Design Decisions

### Decision 1: Remove Cross-Dir Re-Exports, NOT Just Convert Paths
**Context:** Some `index.ts` files re-export symbols from entirely different directories (e.g., `backend/db/index.ts` re-exports from `@/backend/utils/db.utils`).
**Decision:** Remove the cross-directory re-export entirely. Update consumers to import from the original source.
**Rationale:** The user explicitly said "dont rexport from any fucking dir that is not same dir as index.ts".

### Decision 2: Keep `export type { }` As-Is
**Context:** Some `index.ts` files have `export type { X } from "./file"` which is a type-only re-export.
**Decision:** Leave these untouched. Type-only exports are semantically different from value exports and don't cause runtime indirection.
**Rationale:** Converting `export type { X }` to `export *` would also export runtime values, which is not the intent.

### Decision 3: Non-Index Re-Export Shims Deleted
**Context:** Files like `backend/enum/classes/class-instance-detail.enum.ts` are pure re-export shims (e.g., `export { X } from "@/shared/constants/..."`).
**Decision:** Delete the shim file. Update all consumers to import from the original source.
**Rationale:** Re-export shims create unnecessary indirection. Importing from the canonical source is cleaner.

### Decision 4: Batch Processing with 12-Subagent Pool
**Context:** 326 files needing work, with a user requirement of max 12 concurrent subagents.
**Decision:** 66 batches × 5 files each, processed 12 at a time. The pool is always filled — when a subagent completes, the next batch starts immediately.
**Rationale:** Maximizes throughput while staying within resource limits.

## Execution Model

### Phase 0: Baseline
- Record tsgo error count (currently 0 after whatsapp fix)
- Create deferred-items.md

### Phase 1: Batch Processing (66 batches × 12-pool)
Each subagent:
1. Reads ALL files in `/tmp/reexport-batch-XXX.txt`
2. For each file:
   a. If `index.ts`: enforce Rules 1-7
   b. If non-index `.ts/.tsx`: remove cross-layer re-exports, update consumers
3. Run `bun run scripts/health/sub-loop.ts <file> --lifecycle codescene` on each modified file
4. Write outcome file: `.ai/plans/reexport-elimination/outcome/<batch-id>-outcome.md`
5. Update collisions-registry.md if any collisions found

### Phase 2: Global Verification
- Run `bun tsgo` — must be 0 errors
- Run `bun check:duplicates` — verify reduced clone count
- Scan for remaining `@/` or `export { }` violations in index.ts files

### Phase 3: Knowledge Propagation
- Create `docs/architecture/import-export-conventions.md`
- Update `AGENTS.md` with import/export convention rules
- Update `.agents/instructions/*.instructions.md` with barrel file rules
- Update layer `AGENTS.md` files as needed

## Subagent Prompt Template

Each subagent receives:

```
You are processing batch <BATCH_ID>. Read the file list at /tmp/reexport-batch-<BATCH_ID>.txt.

For EACH file in the batch:

RULES (ALL MUST BE ENFORCED):
1. index.ts MAY ONLY export from same-directory files using "./" paths
2. index.ts MUST use `export * from "./file"` instead of `export { A, B } from "./file"`
   EXCEPTION: when export * causes TS2308 collision → keep export { }, document in collisions-registry.md
3. `export type { X } from "./file"` stays as-is (NOT converted to export *)
4. NO "@/path" in index.ts exports — only "./" relative paths
5. NO "../path" in index.ts exports — only "./" relative paths
6. When removing cross-dir re-exports from index.ts, update ALL consumers to import from original source
7. When deleting re-export shim files, update ALL consumers to import from original source

STEPS PER FILE:
1. Read the file
2. Identify violations (cross-dir exports, named exports, @/ paths)
3. For cross-dir exports: remove the export line, find all consumers, update them to import from original source
4. For named exports (same-dir): convert to `export *` unless it would cause collision
5. For @/ paths in same-dir exports: convert @/ to ./
6. Run: bun run scripts/health/sub-loop.ts <file> --lifecycle codescene
7. If sub-loop fails, fix and re-run until exit 0
8. If a collision is found, add entry to .ai/plans/reexport-elimination/outcome/collisions-registry.md

VERIFICATION: Only `bun run scripts/health/sub-loop.ts <file> --lifecycle codescene` — NO other tests.

OUTCOME: Write .ai/plans/reexport-elimination/outcome/<batch-id>-outcome.md with:
  - Files modified (list)
  - Files already compliant (list)
  - Consumers updated (list)
  - Collisions found (list)
```

## Risk Mitigation

1. **Type errors after removing re-exports**: Mitigated by updating consumers in the same batch
2. **Naming collisions from `export *`**: Mitigated by collision detection and registry
3. **Large number of consumer updates**: Mitigated by batching related files together
4. **Resource exhaustion**: Pool size limited to 12 (reduced from 24 after PC restart)
