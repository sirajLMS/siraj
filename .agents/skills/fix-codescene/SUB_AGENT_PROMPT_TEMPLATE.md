You are fixing CodeScene health warnings in a SINGLE file. You may ONLY read and edit THIS file.

File: <file-path>
Lifecycle stage: codescene (full progressive verification: tsgo → biome → lint → codescene --file)

CodeScene warnings for this file (from `bun run codescene --scan`):
<paste warning lines>

## CRITICAL PROHIBITIONS

- You may ONLY read and edit `<file-path>`. Do NOT read or edit any other repository source file.
  (Exception: you may read the rule files that `sub-loop.ts` prints in Step 1.)
- NEVER run `bun codescene --reset`, `bun codescene --reset --scan`, or any `--reset`/`--full` combination on `bun codescene`. The incremental cache must stay intact. Only `bun codescene --file` (run automatically by sub-loop) is allowed.
- NEVER run `bun quality-gate` or `bun quality-gate:fresh`.
- Do NOT modify imports in OTHER files. If a fix requires editing another file, STOP and report a CROSS-FILE DEPENDENCY (format below) instead of touching that file.

## STEP 1: Discover Applicable Rule Files

Run:
  bun run scripts/health/sub-loop.ts <file-path> --lifecycle codescene

The script prints an "Applicable Rule Files" section listing:
  - Instruction files (.github/instructions/*.instructions.md) applying to this file
  - AGENTS.md files (root + layer-specific) applying to this file

## STEP 2: Read ALL Listed Rule Files

Read every file printed in Step 1:
  - Each instruction file (frontend.instructions.md / backend.instructions.md / tests.instructions.md as applicable)
  - Root AGENTS.md + every layer AGENTS.md listed
Your fixes MUST comply with these rules.

## STEP 3: Fix CodeScene Warnings in `<file-path>` ONLY

Common warning types and how to fix them WITHOUT leaving this file:

- **Large Method (LoC = N lines)** — extract the long body into one or more named sub-functions / sub-components defined in the SAME file. Keep the parent callable returning the same shape. Pure mechanical extraction; do not change behavior.
- **Code Duplication (null)** — extract the duplicated block(s) into a local helper function / constant / shared JSX fragment defined in the SAME file, and call it from each duplicate site. If duplication is genuinely with code in ANOTHER file, do NOT edit that other file — report CROSS-FILE DEPENDENCY below and continue with whatever same-file dedup is possible.

Your fixes must ALSO respect layer AGENTS.md rules (MUI v9 `sx` prop, React 19 event types, `@/*` path aliases, no `console.*`, no hardcoded colors, etc., as applicable).

FIX-OR-REPORT RULE:
- If a rule violation can be fixed within THIS file (`<file-path>`): fix it directly.
- If fixing requires modifying ANOTHER file: DO NOT modify that file. Report:

  CROSS-FILE DEPENDENCY:
    Target file: <file-path>
    Blocked by: <other file that needs changes>
    Rule violated: <which rule from instruction file or AGENTS.md>
    Required fix: <description of what the other file needs>

  Then continue fixing any remaining in-file issues in `<file-path>`.

NEVER modify a file you were not assigned to.

## STEP 4: Verify via sub-loop (progressive — stops at first failure)

  bun run scripts/health/sub-loop.ts <file-path> --lifecycle codescene

If it fails at tsgo → fix only tsgo. Re-run. Once tsgo passes it advances to biome → fix biome → re-run → advances to oxlint → fix oxlint → re-run → advances to lint:type-aware → fix lint → re-run → advances to check:duplicates → fix duplicates → re-run → advances to codescene --file → fix any remaining warnings → re-run. Repeat until the script exits 0.

For test files, use `bun run scripts/run-test/run-test.ts <test-path>` when sub-loop passes but you need to validate behavior.

NEVER add `oxlint-disable` comments — fix the root cause instead. See AGENTS.md "Oxlint Rules" section for fix patterns per rule.

**ESLint/sonarjs rules** may also surface during sub-loop's `lint:type-aware` stage. Common patterns:
- `sonarjs/cognitive-complexity` — extract case blocks into named helper functions at module scope.
- `sonarjs/no-nested-functions` — extract nested callbacks to module-scope factory functions.
- `sonarjs/void-use` — replace `void new URL(url)` with an IIFE returning a boolean.
- `sonarjs/different-types-comparison` — if type is `T | null` (no `undefined`), remove `!== undefined`.
- `sonarjs/no-hardcoded-passwords` — extract to module-level constant from env var.
- `eslint/no-new` — assign `new` result to a variable or wrap in validation IIFE.
See AGENTS.md "ESLint/sonarjs Rules" section for full patterns.

## STEP 5: Stage and Report

### Step 5a: Stage the file (only if sub-loop exits 0)

  git add <file-path>

### Step 5b: Report Completion

Reply to the orchestrator with:
- File: <file-path>
- What changed (one paragraph): what you extracted / what helper you added
- Final sub-loop exit status (must be 0; paste the final "All checks for lifecycle 'codescene' passed for ..." line as proof)
- Any CROSS-FILE DEPENDENCY reports using the format above (leave empty if none)

## PROHIBITIONS (summary)

- NEVER modify files other than `<file-path>` (except rule files from sub-loop Step 1)
- NEVER run codescene with `--reset` or `--full`
- Prefer sub-loop for verification; `bun run scripts/lint-service.ts -f <file> --id fix-codescene` if needed outside sub-loop (in-process, no HTTP server)

ERRORS TO FIX:
<paste warning lines>
