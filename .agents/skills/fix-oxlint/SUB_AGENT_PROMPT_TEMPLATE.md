You are fixing oxlint issues in a SINGLE file. You may ONLY read and edit THIS file.

File: {{FILE_PATH}}
Issues JSON: {{JSON_FILE_PATH}}
Issue count: {{ISSUE_COUNT}}

## CRITICAL PROHIBITIONS

- You may ONLY read and edit `{{FILE_PATH}}`. Do NOT read or edit any other repository source file.
  (Exception: you may read the rule files that `sub-loop.ts` prints in Step 1.)
- NEVER run `oxlint` directly — sub-loop handles that. You figure out lines with issues from the JSON data below, not by running oxlint.
- NEVER run `tsgo`, `biome`, `eslint`, `lint` directly — sub-loop handles all of those.
- NEVER run tests (`bun test`, `bun run test:*`, etc.).
- NEVER run `bun quality-gate`, `bun build`, `bun codegen`, `bun run db`.
- NEVER run `npm`, `yarn`, or install packages.
- NEVER run any git command other than `git add {{FILE_PATH}}`.
- Do NOT modify imports in OTHER files. If a fix requires editing another file, STOP and report a CROSS-FILE DEPENDENCY (format below) instead of touching that file.

## The ONLY commands you are allowed to run:

1. **Sub-loop verification:**
   ```
   bun run scripts/health/sub-loop.ts {{FILE_PATH}} --lifecycle codescene
   ```

2. **Git staging (ONLY after sub-loop exits 0):**
   ```
   git add {{FILE_PATH}}
   ```

3. **Read commands** (`view`, `cat`, `grep`, `glob`) to understand the code you're fixing.

## STEP 1: Read the Issues Below and Understand the Source File

The oxlint issues for this file are listed in the "ISSUES TO FIX" section at the bottom of this prompt.
Review the source file `{{FILE_PATH}}` to understand the code at the flagged lines.

## STEP 2: Discover Applicable Rule Files

Run:
```
bun run scripts/health/sub-loop.ts {{FILE_PATH}} --lifecycle codescene
```

The script will fail (exit 1) and print an "Applicable Rule Files" section listing:
- Instruction files (`.agents/instructions/*.instructions.md`) applying to this file
- AGENTS.md files (root + layer-specific) applying to this file

Read ALL listed rule files. Your fixes MUST comply with these rules.

## STEP 3: Read ALL Listed Rule Files

Read every file printed in Step 1:
- Each instruction file (frontend.instructions.md / backend.instructions.md / tests.instructions.md as applicable)
- Root AGENTS.md + every layer AGENTS.md listed

## STEP 4: Fix the Oxlint Issues in `{{FILE_PATH}}` ONLY

Fix each issue listed in "ISSUES TO FIX" below. Use the fix patterns for each rule code.

### Fix Patterns by Rule Code

**`typescript(no-unsafe-type-assertion)`** — Oxlint flags ALL `as Type` assertions that narrow from wider to narrower. `as unknown as Type` does NOT bypass this.
- **Type guards** — the universal escape hatch:
  ```ts
  function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
  }
  const record = isRecord(value) ? value : {};
  ```
- **Error handling in catch blocks:** use `if (e instanceof Error)` instead of `e as Error`
- **`satisfies Partial<T>`** for incomplete object literals instead of casting
- **Widening casts inside array predicates** (NOT flagged — safe widening): `(v as string)`, `(Object.values(Enum) as readonly string[])`
- **For `response.json()`:** type the variable: `const data: SomeType = await response.json();`, or use a type guard
- **For Drizzle pgEnum columns:** use type guard: `function isStatus(value: string): value is Status { ... }`, or string comparison: `String(row.status) === String(SomeEnum.VALUE)`
- Fix types at the SOURCE (cascading effect): adding `.$type<EnumType>()` in Drizzle columns resolves dozens of downstream casts. But only if the schema file IS your assigned file.

**`eslint(no-await-in-loop)`** — `await` inside `for`, `while`, `do...while`, `for...of` loops is flagged.
- `Promise.all` / `Promise.allSettled` for **independent** iterations
- Recursive helper or `.reduce()` chain for **sequential** (shared `tx`, pagination, ordered timestamps)
- `for await...of` is NOT flagged (async iterables)
- **CRITICAL:** Do NOT blindly parallelize. Check if iterations share a DB transaction connection (`tx`). If they do, keep sequential. Parallelize ONLY when iterations are truly independent.

**`typescript(no-unsafe-enum-comparison)`** — Comparing values of different enum types (or enum vs string) is flagged.
- `String(a) === String(b)` for cross-enum/string comparisons
- String literals: `if (row.status === "VALUE")`
- Set-based lookup: `const VALID = new Set(Object.values(Enum) as string[]); if (VALID.has(row.status))`

**`unicorn(consistent-function-scoping)`** — Inner functions that don't capture parent scope variables should be at module scope.
- Move the function to module level (outside the parent function).

**`react(no-object-type-as-default-prop)`** — Default props must not be object/array literals.
- Extract `const DEFAULT_OPTIONS = {};` at module level, use as default param.

**`typescript(TS2322)`** — Type mismatch errors.
- Fix the actual type mismatch at the source. Check expected vs actual types.

**`eslint(no-underscore-dangle)`** — Identifiers with leading underscores are flagged.
- Rename, or use bracket notation for external API `_field` keys.

**`typescript(no-unnecessary-type-assertion)`** — Redundant `as` assertions.
- Just remove the assertion.

**`oxc(no-map-spread)`** — Spread syntax inside `.map()` is flagged.
- Use `Object.assign({}, item, { extra: true })` instead of `{ ...item, extra: true }`.

### ESLint/sonarjs Fix Patterns (also surfaced by sub-loop's lint stage)

Sub-loop runs ESLint with type-aware mode. These sonarjs rules commonly appear after oxlint fixes:

**`sonarjs/no-hardcoded-passwords`** — Hardcoded password strings in test fixtures are flagged.
- Extract to a module-level constant: `const TEST_PASSWORD = process.env.TEST_PASSWORD_HASH ?? "test-pw";`
- Or use an environment variable lookup pattern.

**`sonarjs/cognitive-complexity`** — Function cognitive complexity exceeds 15.
- Extract case blocks or nested conditionals into named helper functions at module scope.
- Each helper should handle one branch/case, reducing the parent function's branching depth.

**`sonarjs/no-nested-functions`** — Function nesting exceeds 4 levels.
- Extract nested callbacks (e.g., `.catch(error => { ... })` inside `.reduce()`) to module-scope functions.
- Use a factory function that captures needed variables and returns the callback: `function handler(ctx): (err) => void { ... }`.

**`sonarjs/void-use`** — The `void` operator is flagged.
- Replace `void new URL(url)` with assigning to a variable: `const _ = new URL(url)` — but this triggers `no-new` (see below).
- Best pattern: use an IIFE that returns a boolean for validation:
  ```ts
  const isValid = (() => { try { return Boolean(new URL(url)); } catch { return false; } })();
  if (!isValid) { /* handle error */ }
  ```

**`sonarjs/different-types-comparison`** — `!==` comparison between types where one side can never be the other.
- If a function returns `T | null` (not `T | undefined`), remove the `!== undefined` check — only `!== null` is needed.
- For type guards: `.filter((x): x is T => x !== null)` instead of `x !== undefined && x !== null`.

**`eslint(no-new)`** — Using `new` for side effects (not assigning the result).
- Assign the result to a variable: `const _ = new URL(url);` — but this may trigger `no-unused-vars` or `no-underscore-dangle`.
- Best: wrap in a validation function that returns the result (see `void-use` pattern above).

### Critical Rules from AGENTS.md
- NEVER use `console.*` — use `logger` from `@/frontend/utils/logger` or `@/backend/lib/logger`
- NEVER create `oxlint-disable` comments — fix the root cause
- NEVER use `as unknown as Type` — it does NOT bypass `no-unsafe-type-assertion`
- Use `@/` path aliases — never relative imports
- MUI v9: use `sx` prop, not style props directly
- React 19: no `FormEvent`, use `React.SubmitEvent`

FIX-OR-REPORT RULE:
- If a rule violation can be fixed within THIS file (`{{FILE_PATH}}`): fix it directly.
- If fixing requires modifying ANOTHER file: DO NOT modify that file. Report:

  ```
  CROSS-FILE DEPENDENCY:
    Target file: {{FILE_PATH}}
    Blocked by: <other file that needs changes>
    Rule violated: <which rule from instruction file or AGENTS.md>
    Required fix: <description of what the other file needs>
  ```

  Then continue fixing any remaining in-file issues.

## STEP 5: Verify via sub-loop (progressive — stops at first failure)

```
bun run scripts/health/sub-loop.ts {{FILE_PATH}} --lifecycle codescene
```

If it fails at tsgo → fix only tsgo. Re-run. Once tsgo passes it advances to oxlint → fix oxlint → re-run → advances to biome → fix biome → re-run → advances to lint:type-aware → fix lint → re-run → advances to check:duplicates → fix duplicates → re-run → advances to codescene --file → fix any remaining warnings → re-run. Repeat until the script exits 0.

**IMPORTANT:** Sub-loop runs the FULL progressive verification. It will surface issues beyond just the oxlint rules in the JSON — it runs tsgo, oxlint, biome, lint (type-aware), duplicates, and codescene. Fix ALL issues it surfaces until it exits 0. Both new and preexisting issues in this file must be resolved.

This includes ESLint/sonarjs errors that may appear as a side-effect of your oxlint fixes (e.g., removing `void` can trigger `no-new`, removing `as` can trigger `different-types-comparison`). See the "ESLint/sonarjs Fix Patterns" section above.

NEVER add `oxlint-disable` comments — fix the root cause instead.

## STEP 6: Stage the file (ONLY if sub-loop exits 0)

```
git add {{FILE_PATH}}
```

## STEP 7: Report Completion

Reply with:
- File: `{{FILE_PATH}}`
- What changed (one paragraph): what you fixed and how
- Final sub-loop exit status (must be 0; paste the final "All checks for lifecycle 'codescene' passed for ..." line as proof)
- Any CROSS-FILE DEPENDENCY reports using the format above (leave empty if none)
- File staged via `git add`

## ISSUES TO FIX

{{ISSUES_SUMMARY}}
