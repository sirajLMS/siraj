# Re-Export Elimination Plan — Tasks

## Phase 0: Baseline

- [x] 0.1 Record tsgo baseline (0 errors after whatsapp collision fix)
- [x] 0.2 Create collisions-registry.md with Entry 1 (whatsapp cloud-api requests)
- [x] 0.3 Generate 66 batch files from 326 target files

## Phase 1: Batch Processing (12-Subagent Pool)

### Pool Execution Model
- 12 subagents run in parallel
- Each subagent processes one batch (5 files)
- When a subagent completes, the next pending batch is dispatched immediately
- Batches 000-065 cover all 326 files

### Per-Task Mandatory Steps (EVERY batch task MUST include ALL of these)

**EVERY** task below MUST follow these steps for EACH file in the batch:

**Step A — Read & Classify:**
1. Read the file
2. Classify as `index.ts` barrel or non-index file

**Step B — Enforce Rules (for index.ts):**
1. Check Rule 1: Does this file have any cross-directory `@/` exports? If yes → remove and update consumers
2. Check Rule 2: Does this file use `export { X } from "./file"`? If yes → convert to `export * from "./file"`, UNLESS collision
3. Check Rule 3: Does this file have `export type { X } from "./file"`? If yes → leave unchanged
4. Check Rule 4: Does this file have `@/` paths in same-dir exports? If yes → convert to `./`
5. Check Rule 5: Does this file inherit `../` paths? If yes → remove or fix

**Step C — Enforce Rules (for non-index .ts/.tsx):**
1. Check for re-export lines (`export { X } from "@/other/dir"`)
2. Remove re-export lines
3. Find all consumers importing from this file's re-export
4. Update consumers to import from original source

**Step D — Verify No Cross-Dir Re-Exports:**
1. After modification, verify index.ts has NO exports from any directory other than `./`
2. Verify NO `@/` paths remain in export statements
3. Verify NO `../` paths remain in export statements

**Step E — Verify `export *` Rule:**
1. After modification, verify all same-dir value exports use `export * from "./file"`
2. If `export { }` was kept due to collision, verify entry was added to collisions-registry.md

**Step F — Quality Verification:**
1. Run `bun run scripts/health/sub-loop.ts <file> --lifecycle codescene` on each modified file
2. Fix any errors and re-run until exit 0
3. NO GraphQL, UI, E2E, DB, services, or integration tests — ONLY sub-loop

**Step G — Outcome Documentation:**
1. Write `.ai/plans/reexport-elimination/outcome/<batch-id>-outcome.md`
2. List: files modified, files already compliant, consumers updated, collisions found

### Batches

- [ ] 1.001 — Batch 000: 5 files (`/tmp/reexport-batch-000.txt`)
  - Steps A through G for each file
  - _Requirements: AC-1, AC-2, AC-3, AC-4, AC-7_

- [ ] 1.002 — Batch 001: 5 files (`/tmp/reexport-batch-001.txt`)
  - Steps A through G for each file
  - _Requirements: AC-1, AC-2, AC-3, AC-4, AC-7_

- [ ] 1.003 — Batch 002: 5 files (`/tmp/reexport-batch-002.txt`)
  - Steps A through G for each file
  - _Requirements: AC-1, AC-2, AC-3, AC-4, AC-7_

- [ ] 1.004 — Batch 003: 5 files (`/tmp/reexport-batch-003.txt`)
  - Steps A through G for each file
  - _Requirements: AC-1, AC-2, AC-3, AC-4, AC-7_

- [ ] 1.005 — Batch 004: 5 files (`/tmp/reexport-batch-004.txt`)
  - Steps A through G for each file
  - _Requirements: AC-1, AC-2, AC-3, AC-4, AC-7_

- [ ] 1.006 — Batch 005: 5 files (`/tmp/reexport-batch-005.txt`)
  - Steps A through G for each file
  - _Requirements: AC-1, AC-2, AC-3, AC-4, AC-7_

- [ ] 1.007 — Batch 006: 5 files (`/tmp/reexport-batch-006.txt`)
  - Steps A through G for each file
  - _Requirements: AC-1, AC-2, AC-3, AC-4, AC-7_

- [ ] 1.008 — Batch 007: 5 files (`/tmp/reexport-batch-007.txt`)
  - Steps A through G for each file
  - _Requirements: AC-1, AC-2, AC-3, AC-4, AC-7_

- [ ] 1.009 — Batch 008: 5 files (`/tmp/reexport-batch-008.txt`)
  - Steps A through G for each file
  - _Requirements: AC-1, AC-2, AC-3, AC-4, AC-7_

- [ ] 1.010 — Batch 009: 5 files (`/tmp/reexport-batch-009.txt`)
  - Steps A through G for each file
  - _Requirements: AC-1, AC-2, AC-3, AC-4, AC-7_

- [ ] 1.011 — Batch 010: 5 files (`/tmp/reexport-batch-010.txt`)
  - Steps A through G for each file
  - _Requirements: AC-1, AC-2, AC-3, AC-4, AC-7_

- [ ] 1.012 — Batch 011: 5 files (`/tmp/reexport-batch-011.txt`)
  - Steps A through G for each file
  - _Requirements: AC-1, AC-2, AC-3, AC-4, AC-7_

- [ ] 1.013 — Batch 012: 5 files (`/tmp/reexport-batch-012.txt`)
  - Steps A through G for each file
  - _Requirements: AC-1, AC-2, AC-3, AC-4, AC-7_

- [ ] 1.014 — Batch 013: 5 files (`/tmp/reexport-batch-013.txt`)
  - Steps A through G for each file
  - _Requirements: AC-1, AC-2, AC-3, AC-4, AC-7_

- [ ] 1.015 — Batch 014: 5 files (`/tmp/reexport-batch-014.txt`)
  - Steps A through G for each file
  - _Requirements: AC-1, AC-2, AC-3, AC-4, AC-7_

- [ ] 1.016 — Batch 015: 5 files (`/tmp/reexport-batch-015.txt`)
  - Steps A through G for each file
  - _Requirements: AC-1, AC-2, AC-3, AC-4, AC-7_

- [ ] 1.017 — Batch 016: 5 files (`/tmp/reexport-batch-016.txt`)
  - Steps A through G for each file
  - _Requirements: AC-1, AC-2, AC-3, AC-4, AC-7_

- [ ] 1.018 — Batch 017: 5 files (`/tmp/reexport-batch-017.txt`)
  - Steps A through G for each file
  - _Requirements: AC-1, AC-2, AC-3, AC-4, AC-7_

- [ ] 1.019 — Batch 018: 5 files (`/tmp/reexport-batch-018.txt`)
  - Steps A through G for each file
  - _Requirements: AC-1, AC-2, AC-3, AC-4, AC-7_

- [ ] 1.020 — Batch 019: 5 files (`/tmp/reexport-batch-019.txt`)
  - Steps A through G for each file
  - _Requirements: AC-1, AC-2, AC-3, AC-4, AC-7_

- [ ] 1.021 — Batch 020: 5 files (`/tmp/reexport-batch-020.txt`)
  - Steps A through G for each file
  - _Requirements: AC-1, AC-2, AC-3, AC-4, AC-7_

- [ ] 1.022 — Batch 021: 5 files (`/tmp/reexport-batch-021.txt`)
  - Steps A through G for each file
  - _Requirements: AC-1, AC-2, AC-3, AC-4, AC-7_

- [ ] 1.023 — Batch 022: 5 files (`/tmp/reexport-batch-022.txt`)
  - Steps A through G for each file
  - _Requirements: AC-1, AC-2, AC-3, AC-4, AC-7_

- [ ] 1.024 — Batch 023: 5 files (`/tmp/reexport-batch-023.txt`)
  - Steps A through G for each file
  - _Requirements: AC-1, AC-2, AC-3, AC-4, AC-7_

- [ ] 1.025 — Batch 024: 5 files (`/tmp/reexport-batch-024.txt`)
  - Steps A through G for each file
  - _Requirements: AC-1, AC-2, AC-3, AC-4, AC-7_

- [ ] 1.026 — Batch 025: 5 files (`/tmp/reexport-batch-025.txt`)
  - Steps A through G for each file
  - _Requirements: AC-1, AC-2, AC-3, AC-4, AC-7_

- [ ] 1.027 — Batch 026: 5 files (`/tmp/reexport-batch-026.txt`)
  - Steps A through G for each file
  - _Requirements: AC-1, AC-2, AC-3, AC-4, AC-7_

- [ ] 1.028 — Batch 027: 5 files (`/tmp/reexport-batch-027.txt`)
  - Steps A through G for each file
  - _Requirements: AC-1, AC-2, AC-3, AC-4, AC-7_

- [ ] 1.029 — Batch 028: 5 files (`/tmp/reexport-batch-028.txt`)
  - Steps A through G for each file
  - _Requirements: AC-1, AC-2, AC-3, AC-4, AC-7_

- [ ] 1.030 — Batch 029: 5 files (`/tmp/reexport-batch-029.txt`)
  - Steps A through G for each file
  - _Requirements: AC-1, AC-2, AC-3, AC-4, AC-7_

- [ ] 1.031 — Batch 030: 5 files (`/tmp/reexport-batch-030.txt`)
  - Steps A through G for each file
  - _Requirements: AC-1, AC-2, AC-3, AC-4, AC-7_

- [ ] 1.032 — Batch 031: 5 files (`/tmp/reexport-batch-031.txt`)
  - Steps A through G for each file
  - _Requirements: AC-1, AC-2, AC-3, AC-4, AC-7_

- [ ] 1.033 — Batch 032: 5 files (`/tmp/reexport-batch-032.txt`)
  - Steps A through G for each file
  - _Requirements: AC-1, AC-2, AC-3, AC-4, AC-7_

- [ ] 1.034 — Batch 033: 5 files (`/tmp/reexport-batch-033.txt`)
  - Steps A through G for each file
  - _Requirements: AC-1, AC-2, AC-3, AC-4, AC-7_

- [ ] 1.035 — Batch 034: 5 files (`/tmp/reexport-batch-034.txt`)
  - Steps A through G for each file
  - _Requirements: AC-1, AC-2, AC-3, AC-4, AC-7_

- [ ] 1.036 — Batch 035: 5 files (`/tmp/reexport-batch-035.txt`)
  - Steps A through G for each file
  - _Requirements: AC-1, AC-2, AC-3, AC-4, AC-7_

- [ ] 1.037 — Batch 036: 5 files (`/tmp/reexport-batch-036.txt`)
  - Steps A through G for each file
  - _Requirements: AC-1, AC-2, AC-3, AC-4, AC-7_

- [ ] 1.038 — Batch 037: 5 files (`/tmp/reexport-batch-037.txt`)
  - Steps A through G for each file
  - _Requirements: AC-1, AC-2, AC-3, AC-4, AC-7_

- [ ] 1.039 — Batch 038: 5 files (`/tmp/reexport-batch-038.txt`)
  - Steps A through G for each file
  - _Requirements: AC-1, AC-2, AC-3, AC-4, AC-7_

- [ ] 1.040 — Batch 039: 5 files (`/tmp/reexport-batch-039.txt`)
  - Steps A through G for each file
  - _Requirements: AC-1, AC-2, AC-3, AC-4, AC-7_

- [ ] 1.041 — Batch 040: 5 files (`/tmp/reexport-batch-040.txt`)
  - Steps A through G for each file
  - _Requirements: AC-1, AC-2, AC-3, AC-4, AC-7_

- [ ] 1.042 — Batch 041: 5 files (`/tmp/reexport-batch-041.txt`)
  - Steps A through G for each file
  - _Requirements: AC-1, AC-2, AC-3, AC-4, AC-7_

- [ ] 1.043 — Batch 042: 5 files (`/tmp/reexport-batch-042.txt`)
  - Steps A through G for each file
  - _Requirements: AC-1, AC-2, AC-3, AC-4, AC-7_

- [ ] 1.044 — Batch 043: 5 files (`/tmp/reexport-batch-043.txt`)
  - Steps A through G for each file
  - _Requirements: AC-1, AC-2, AC-3, AC-4, AC-7_

- [ ] 1.045 — Batch 044: 5 files (`/tmp/reexport-batch-044.txt`)
  - Steps A through G for each file
  - _Requirements: AC-1, AC-2, AC-3, AC-4, AC-7_

- [ ] 1.046 — Batch 045: 5 files (`/tmp/reexport-batch-045.txt`)
  - Steps A through G for each file
  - _Requirements: AC-1, AC-2, AC-3, AC-4, AC-7_

- [ ] 1.047 — Batch 046: 5 files (`/tmp/reexport-batch-046.txt`)
  - Steps A through G for each file
  - _Requirements: AC-1, AC-2, AC-3, AC-4, AC-7_

- [ ] 1.048 — Batch 047: 5 files (`/tmp/reexport-batch-047.txt`)
  - Steps A through G for each file
  - _Requirements: AC-1, AC-2, AC-3, AC-4, AC-7_

- [ ] 1.049 — Batch 048: 5 files (`/tmp/reexport-batch-048.txt`)
  - Steps A through G for each file
  - _Requirements: AC-1, AC-2, AC-3, AC-4, AC-7_

- [ ] 1.050 — Batch 049: 5 files (`/tmp/reexport-batch-049.txt`)
  - Steps A through G for each file
  - _Requirements: AC-1, AC-2, AC-3, AC-4, AC-7_

- [ ] 1.051 — Batch 050: 5 files (`/tmp/reexport-batch-050.txt`)
  - Steps A through G for each file
  - _Requirements: AC-1, AC-2, AC-3, AC-4, AC-7_

- [ ] 1.052 — Batch 051: 5 files (`/tmp/reexport-batch-051.txt`)
  - Steps A through G for each file
  - _Requirements: AC-1, AC-2, AC-3, AC-4, AC-7_

- [ ] 1.053 — Batch 052: 5 files (`/tmp/reexport-batch-052.txt`)
  - Steps A through G for each file
  - _Requirements: AC-1, AC-2, AC-3, AC-4, AC-7_

- [ ] 1.054 — Batch 053: 5 files (`/tmp/reexport-batch-053.txt`)
  - Steps A through G for each file
  - _Requirements: AC-1, AC-2, AC-3, AC-4, AC-7_

- [ ] 1.055 — Batch 054: 5 files (`/tmp/reexport-batch-054.txt`)
  - Steps A through G for each file
  - _Requirements: AC-1, AC-2, AC-3, AC-4, AC-7_

- [ ] 1.056 — Batch 055: 5 files (`/tmp/reexport-batch-055.txt`)
  - Steps A through G for each file
  - _Requirements: AC-1, AC-2, AC-3, AC-4, AC-7_

- [ ] 1.057 — Batch 056: 5 files (`/tmp/reexport-batch-056.txt`)
  - Steps A through G for each file
  - _Requirements: AC-1, AC-2, AC-3, AC-4, AC-7_

- [ ] 1.058 — Batch 057: 5 files (`/tmp/reexport-batch-057.txt`)
  - Steps A through G for each file
  - _Requirements: AC-1, AC-2, AC-3, AC-4, AC-7_

- [ ] 1.059 — Batch 058: 5 files (`/tmp/reexport-batch-058.txt`)
  - Steps A through G for each file
  - _Requirements: AC-1, AC-2, AC-3, AC-4, AC-7_

- [ ] 1.060 — Batch 059: 5 files (`/tmp/reexport-batch-059.txt`)
  - Steps A through G for each file
  - _Requirements: AC-1, AC-2, AC-3, AC-4, AC-7_

- [ ] 1.061 — Batch 060: 5 files (`/tmp/reexport-batch-060.txt`)
  - Steps A through G for each file
  - _Requirements: AC-1, AC-2, AC-3, AC-4, AC-7_

- [ ] 1.062 — Batch 061: 5 files (`/tmp/reexport-batch-061.txt`)
  - Steps A through G for each file
  - _Requirements: AC-1, AC-2, AC-3, AC-4, AC-7_

- [ ] 1.063 — Batch 062: 5 files (`/tmp/reexport-batch-062.txt`)
  - Steps A through G for each file
  - _Requirements: AC-1, AC-2, AC-3, AC-4, AC-7_

- [ ] 1.064 — Batch 063: 5 files (`/tmp/reexport-batch-063.txt`)
  - Steps A through G for each file
  - _Requirements: AC-1, AC-2, AC-3, AC-4, AC-7_

- [ ] 1.065 — Batch 064: 5 files (`/tmp/reexport-batch-064.txt`)
  - Steps A through G for each file
  - _Requirements: AC-1, AC-2, AC-3, AC-4, AC-7_

- [ ] 1.066 — Batch 065: 5 files (`/tmp/reexport-batch-065.txt`)
  - Steps A through G for each file
  - _Requirements: AC-1, AC-2, AC-3, AC-4, AC-7_

## Phase 2: Global Verification

- [ ] 2.1 Run `bun tsgo` — verify 0 errors (fix any errors found)
  - Run `~/.bun/bin/bun tsgo 2>&1 | grep "error TS" | wc -l`
  - Expected: 0
  - _Requirements: AC-8_

- [ ] 2.2 Run `bun check:duplicates` — verify reduced clone count
  - Run `~/.bun/bin/bun check:duplicates 2>&1 | tail -5`
  - Compare to baseline (528 clones)
  - _Requirements: AC-8_

- [ ] 2.3 Scan for remaining `@/` or cross-dir exports in index.ts files
  - Run: `grep -rn '^export.*from "@/' --include="index.ts" . | grep -v node_modules | wc -l`
  - Expected: 0 (or only same-dir @/ exports that were intentionally kept)
  - _Requirements: AC-1, AC-3_

- [ ] 2.4 Scan for remaining `export { }` in index.ts that could be `export *`
  - Run: `grep -rn '^export {.*} from "\./' --include="index.ts" . | grep -v node_modules | wc -l`
  - Each remaining instance must be documented in collisions-registry.md
  - _Requirements: AC-2_

## Phase 3: Knowledge Propagation

- [ ] 3.1 Create `docs/architecture/import-export-conventions.md`
  - Document the 7 rules as canonical import/export conventions
  - Include examples of correct and incorrect patterns
  - Reference collisions-registry.md for exception process
  - _Requirements: AC-5_

- [ ] 3.2 Update root `AGENTS.md` with import/export convention rules
  - Add "Import/Export Conventions" section referencing the new doc
  - Add to Important References section
  - _Requirements: AC-5_

- [ ] 3.3 Update `.agents/instructions/frontend.instructions.md` and `.agents/instructions/backend.instructions.md`
  - Add barrel file rules (same-dir only, export * preferred, no @/ paths)
  - _Requirements: AC-5_

- [ ] 3.4 Final quality gate
  - Run `bun run scripts/health/sub-loop.ts <file> --lifecycle codescene` on all modified docs/config files
  - Run `bun tsgo` — verify 0 errors
  - _Requirements: AC-8_

- [ ] 3.5 Write final outcome summary
  - Read all outcome files in `.ai/plans/reexport-elimination/outcome/`
  - Synthesize patterns and Learnings
  - Write `.ai/plans/reexport-elimination/outcome/final-summary.md`
  - _Requirements: AC-5_

## Phase 4: Git Commit

- [ ] 4.1 Stage and commit all changes
  - Stage all modified files
  - Commit with descriptive message
  - Include Co-authored-by trailer
  - _Requirements: AC-8_
