# Plan: Consolidate Lint Queue into Single `scripts/lint-service.ts`

## Context

Three scripts (`scripts/lint-queue-server.ts`, `scripts/lint-queue-client.ts`, `scripts/lint-queue-config.ts`) implement an HTTP-based serialized ESLint queue to prevent CPU/memory contention when multiple sub-agents lint concurrently. We are removing all networking and merging everything into one purely-typed TypeScript CLI + in-process service: `scripts/lint-service.ts`.

### Decisions (confirmed with user)
- **Queue scope**: Process-lifetime singleton. The in-memory FIFO queue provides true serialization when `sub-loop.ts` (and any in-process caller) imports `requestLint()` and fires multiple async requests within one Bun process. CLI invocations are one-shot and do not serialize across processes — that's accepted; the original cross-process contention protection is going away with networking, and concurrent CLI runs will each spawn their own eslint (bounded by ESLint's own `--concurrency` cap). No flock/lockfile is introduced (keeps the design clean and dependency-free).
- **Old files**: Delete all three source files outright. No re-export shims.
- **`.env.example`**: Remove the now-dead `LINT_QUEUE_PORT` lines and its comment.

### Bedrock facts from the codebase
- `tsconfig.json:26-27`: `"@/*": ["./*"]` → `@/scripts/lint-service` resolves to `./scripts/lint-service.ts`.
- `package.json:46`: `"lint"` is a `bun -e` one-liner importing `requestFullRepoLint`.
- `package.json:47`: `"lint:server"` starts the server.
- `package.json:48`: `"lint:fix"` is a raw `NODE_OPTIONS=... eslint . --fix ...` (bypasses queue — already not queue-aware).
- `scripts/quality-gate.ts:117`: runs lint via `runCommand("bun", ["lint"])` — keeps working if the `"lint"` script stays a valid entrypoint.
- `scripts/health/sub-loop.ts:36`: imports `BASE_URL` from `@/scripts/lint-queue-config` and POSTs via `fetch` in `lintViaQueue` (lines 216-259).
- ESLint invocation contract (from `lint-queue-server.ts:114`): `NODE_OPTIONS="-r ./scripts/ts6-eslint-patch.cjs" ~/.bun/bin/bun x eslint --cache --cache-location .eslintcache --concurrency=<n> [files...]`. Empty file list = full-repo lint (let eslint config's `files`/`ignores` block drive scope — never pass `"."`).
- Timeouts: 300s file-scoped, 1200s full-repo (overridable via `LINT_QUEUE_TIMEOUT_MS`).
- Concurrency default `4` (overridable via `LINT_QUEUE_CONCURRENCY`; `auto` allowed).
- `LintResult = { success: boolean; output: string; exitCode: number }` — preserve this exact shape for the programmatic API (callers in `sub-loop.ts`, quality-gate orchestrator docs, and the `cli` `bun -e` one-liner all parse these fields).
- Result/exit-code semantics (server) returns `exitCode 0` even on eslint "had errors" because the HTTP request itself succeeded; `success` reflects `exitCode === 0`. The `cli` one-liner does `process.exit(r.exitCode ?? 0)`, so currently a lint-error run exits non-zero only when eslint errored, not when eslint reported issues. ESLint itself exits 1 on reported problems, 2 on config/usage errors. **The new CLI must preserve this observable contract**: `requestLint()` returns eslint's real exit code in `exitCode`; CLI exits with eslint's exit code (so CI / quality-gate can detect lint problems).

### Consumer surface to update (non-doc)
| File | Change |
|---|---|
| `scripts/health/sub-loop.ts` | Replace `import { BASE_URL }` + `lintViaQueue` (fetch) with `import { requestLint } from "@/scripts/lint-service"` and call `requestLint("sub-loop", [relPath])` in-process. Remove `/status` health-check block. Update exit-2 message (no more "start the server"). |
| `.github/extensions/fix-import-aliases/extension.mjs` | Replace `getLintQueuePort()` + curl `POST /lint` with a `bash` call: `~/.bun/bin/bun run scripts/lint-service.ts -f <relPath> --id fix-imports --json`. Parse JSON stdout to read `success`/`output`/`exitCode`. |
| `.github/extensions/fix-import-aliases/skill.ts` | Replace `import { LINT_QUEUE_PORT }` + curl with the same `bun run scripts/lint-service.ts -f ... --json --id fix-imports` shell call. Fix success check: `lintCheck?.stdout?.includes('"success": "true"')` → parse JSON and check `result.success === true` (boolean, not string). |
| `.github/extensions/fix-import-aliases/SKILL.md` | Update curl snippet at line 67 to `bun run scripts/lint-service.ts -f <file-path> --id fix-imports --json`. Remove `${LINT_QUEUE_PORT}` reference. |
| `AGENTS.md` | **Complete rewrite** of "Lint Queue Server" section (lines 183-253). New section titled "Lint Service (In-Process Serialized ESLint)" explains the unified `scripts/lint-service.ts`, how to call `bun run lint` and `bun run scripts/lint-service.ts -f ...`, the programmatic API (`requestLint`, `requestFullRepoLint`), and removes all HTTP/port/server references. |
| `package.json` | `lint`, `lint:fix` → new unified script; **remove** `lint:server`. |
| `.env.example` | Remove lines 197-198 (`LINT_QUEUE_PORT` + its comment). |

### Doc references (out of scope for code edits — flagged only)
50+ references in `.agents/`, `.kilo/plans/`, `.ai/`, `communication_specs.md`, etc. still mention `lint-queue-*`, `LINT_QUEUE_PORT`, `curl ... /lint`, `/status`, and "start the server". These are historical plans/finished-plan markdown. **Per AGENTS.md, do NOT edit non-plan markdown in a code refactor.** Skills/instructions in `.agents/skills/`, `.agents/instructions/`, and `.agents/agents/` are LIVE operational docs but updating 15+ skill files is out of scope for this refactor — flag for the user to decide bulk-update strategy separately.

---

## Deliverable 1 — `scripts/lint-service.ts` (single file)

Sections (top to bottom):

1. **Header doc comment**: explains it's a unified in-process lint service + CLI; no networking; replaces the three old files.

2. **Types** (all exported for reuse):
   ```ts
   export type LintResult = { success: boolean; output: string; exitCode: number };
   export interface LintOptions { fix?: boolean; json?: boolean; verbose?: boolean; }
   export interface LintMetrics { id: string; scope: "full-repo" | "files"; fileCount: number; durationMs: number; enqueuedAt: number; startedAt: number; finishedAt: number; queueDepthAtEnqueue: number; }
   export interface LintExecutionResult extends LintResult { metrics: LintMetrics; }
   ```
   `requestLint` returns `LintExecutionResult` (richer); a thin `toPlainResult()` helper strips metrics for callers expecting the legacy `LintResult` shape (used by the `cli` `bun -e` one-liner placeholder and kept for backward-compat). Actually keep `requestLint(id, files?, options?): Promise<LintResult>` per the deliverable's exact signature and add `requestLintWithMetrics` for the rich variant — so the exported name matches the spec exactly.

3. **Constants**:
   - `ESLINT_BIN = "~/.bun/bin/bun"` (string; resolved via shell since command is shell-exec'd — matches server's existing `exec(cmd, {shell:"bash"})` pattern).
   - `ESLINT_PATCH = "-r ./scripts/ts6-eslint-patch.cjs"` (NODE_OPTIONS fragment).
   - `DEFAULT_TIMEOUT_FILES_MS = Number(process.env.LINT_QUEUE_TIMEOUT_MS ?? 300000)`.
   - `DEFAULT_TIMEOUT_FULL_REPO_MS = Number(process.env.LINT_QUEUE_TIMEOUT_MS ?? 1200000)`.
   - `CONCURRENCY = process.env.LINT_QUEUE_CONCURRENCY ?? "4"`.
   - Keep the env var names (`LINT_QUEUE_TIMEOUT_MS`, `LINT_QUEUE_CONCURRENCY`) for continuity with `lint-queue-server.ts` docs that sub-agents may still reference. Do NOT keep `LINT_QUEUE_PORT` anywhere in code.

4. **`LintService` class** (default singleton via module-level `export const lintService = new LintService()`):
   - Private `queue: { id: string; files: string[]; options: LintOptions; resolve: (r: LintExecutionResult) => void }[]`.
   - Private `running: boolean = false`.
   - `enqueue(id, files, options): Promise<LintExecutionResult>` — pushes item, records queueDepth, calls `processQueue()`, returns the promise.
   - Private `processQueue()` — drain loop guarded by `running`; on each item: log (verbose), call `runEslint`, resolve, recurse. Identical FIFO behavior to old server.
   - Private `runEslint(files, options): Promise<LintResult>` — builds the command:
     ```
     NODE_OPTIONS="-r ./scripts/ts6-eslint-patch.cjs" ~/.bun/bin/bun x eslint --cache --cache-location .eslintcache --concurrency=<CONCURRENCY> [--fix] <files...>
     ```
     - Empty `files` → omit file args (full-repo via config), use `DEFAULT_TIMEOUT_FULL_REPO_MS`.
     - Non-empty → join with spaces, quote each path with `"`, use `DEFAULT_TIMEOUT_FILES_MS`.
     - `options.fix === true` → append `--fix`.
     - Execute via `node:child_process` `exec` (preserve `maxBuffer: 50*1024*1024`, `shell: "bash"`, `cwd: process.cwd()`, `timeout`). Capture `stdout+stderr` → `output`; `error ? (error.code ?? 1) : 0` → `exitCode`; `success = exitCode === 0`.
   - `getStatus(): { running: boolean; queueLength: number }` — programmatic-only (no HTTP); exported for callers/tests that want health introspection. Not wired to any CLI flag.

5. **Programmatic exports**:
   ```ts
   export async function requestLint(id: string, files: string[] = [], options: LintOptions = {}): Promise<LintResult> {
     const r = await lintService.enqueue(id, files, options);
     return { success: r.success, output: r.output, exitCode: r.exitCode };
   }
   export async function requestFullRepoLint(id: string, options: LintOptions = {}): Promise<LintResult> { return requestLint(id, [], options); }
   export async function requestLintWithMetrics(id: string, files?: string[], options?: LintOptions): Promise<LintExecutionResult> { return lintService.enqueue(id, files ?? [], options ?? {}); }
   ```
   Keeping `requestFullRepoLint` because `package.json`'s `lint` script and many docs reference it.

6. **CLI entrypoint** (only runs when this file is the main module, guarded by `import.meta.main` in Bun or `process.argv[1]` endsWith `lint-service.ts`):
   - **Arg parsing via `util.parseArgs`** with `strict: true`:
     ```ts
     parseArgs({
       options: {
         files: { type: "string", short: "f", multiple: true },
         id: { type: "string", short: "i", default: "cli" },
         fix: { type: "boolean", default: false },
         json: { type: "boolean", default: false },
         verbose: { type: "boolean", short: "v", default: false },
         help: { type: "boolean", short: "h", default: false },
       },
       allowPositionals: false,
       strict: true,
       tokens: false,
     });
     ```
     - No zod dependency added (avoid new dep). `util.parseArgs` is stdlib and sufficient.
   - **Validation**: if `parseArgs` throws (unknown flag / missing required value) → `process.exit(2)` with stderr usage. Reject any `positionals` (strict mode with `allowPositionals: false` already errors).
   - **Help**: `--help`/`-h` prints usage (flags list + exit codes) and exits 0.
   - **Files default**: omitted/empty `--files` → full-repo (pass `[]` to `requestLintWithMetrics`).
   - **Execution**: `const r = await requestLintWithMetrics(id, files, { fix, json, verbose });`
   - **Output**:
     - `--json`: print `JSON.stringify(r)` (full `LintExecutionResult` incl. metrics) to stdout.
     - otherwise: print `r.output` to stdout (matches the old `cli` one-liner: `process.stdout.write(r.output || '')`). Verbose additionally logs queue state + durationMs to stderr.
   - **Exit codes**:
     - `0` → `r.success === true` (eslint exit 0).
     - `1` → eslint reported problems (exit 1) or `success === false` with exitCode 1.
     - `2` → arg parse fault / invalid args / uncaught service fault. Wrap the body in try/catch; on caught throwable, `console.error` the full stack when `--verbose`, else the message, then `process.exit(2)`.

7. **Edge cases baked into the design**:
   - Empty array vs omitted `--files` both mean full-repo (never pass `"."`).
   - `--files` paths must be repo-relative (caller contracts already assume this — `sub-loop.ts` does `relative(PROJECT_ROOT, ...)`). CLI does not normalize; passes through verbatim to eslint.
   - `--fix` only flows downward when explicitly requested; the default service path is report-only (preserving the server's "fix is intentionally omitted" rule for the queue path, but the new `lint:fix` script does pass `--fix`).
   - `stdout`/`stderr` interleaving: keep `exec` behavior (combined output) so the consumer sees eslint messages in order.

---

## Deliverable 2 — `scripts/health/sub-loop.ts` update snippet

Replace lines 36 and 216-259:
```ts
// Remove line 36 import:
//   import { BASE_URL as LINT_QUEUE_URL } from "@/scripts/lint-queue-config";
// Add:
import { requestLint, type LintResult } from "@/scripts/lint-service";
```

Replace `lintViaQueue` (216-259) with:
```ts
async function lintViaQueue(filePath: string): Promise<CheckResult> {
  const relPath = relative(PROJECT_ROOT, resolve(PROJECT_ROOT, filePath));
  try {
    const r: LintResult = await requestLint("sub-loop", [relPath]);
    return { name: "lint-queue-client", passed: r.success, output: r.output };
  } catch (err) {
    return {
      name: "lint-queue-client",
      passed: false,
      output: `In-process lint service failed: ${(err as Error).message}`,
    };
  }
}
```
Update the commit-after-check messaging in `checkLint` (330-343): the `result === null` branch no longer fires; the "server unavailable" exit message (lines 335-339) must be replaced with the catch above (already handled). Update the `--help` text exit-code note (line 479) from "lint queue unavailable" to "invalid arguments".

---

## Deliverable 3 — `package.json` scripts section

```jsonc
"lint": "bun run scripts/lint-service.ts",
"lint:fix": "bun run scripts/lint-service.ts --fix",
```
Delete the `"lint:server"` line. Keep `lint:fix` semantics: the new `--fix` flows to eslint via the CLI, equivalent to the old raw `NODE_OPTIONS=... eslint . --fix`. (The old `lint:fix` used `--concurrency=auto`; the new path uses the default `4` unless `LINT_QUEUE_CONCURRENCY=auto` is set — acceptable and consistent with the queued path.)

The `"lint"` script no longer needs the `bun -e` inline JS; the file's own CLI entrypoint handles printing `output` and exiting with eslint's exit code.

---

## Deliverable 4 — AGENTS.md "Lint Service" Section Rewrite

Replace lines 183-253 (entire "Lint Queue Server" section) with:

```markdown
## Lint Service (In-Process Serialized ESLint)

The project uses a unified lint service (`scripts/lint-service.ts`) that provides both a CLI and programmatic API. It runs ESLint with serialized execution to prevent CPU/memory contention when multiple callers (e.g., sub-agents, quality-gate stages) lint concurrently within the same process. No HTTP server, no port binding — everything is in-process TypeScript.

### Running lint from the command line

**Full-repo lint** (via `eslint.config.js` `files`/`ignores` block):
```bash
bun run lint
```

**File-scoped lint** (faster when you only touched specific files):
```bash
bun run scripts/lint-service.ts -f <file1> -f <file2> --id <caller-id>
```

**Auto-fix mode**:
```bash
bun run lint:fix
```

**JSON output** (for scripting/automation):
```bash
bun run scripts/lint-service.ts -f <file> --json --id <caller-id>
# Returns: { success: boolean, output: string, exitCode: number, metrics: {...} }
```

The CLI exits with ESLint's exit code (0 = clean, 1 = lint errors, 2 = config/usage errors), so CI pipelines and quality gates detect failures correctly.

### Programmatic API (from TypeScript)

Import and call directly from scripts or tests:

```typescript
import { requestLint, requestFullRepoLint } from "@/scripts/lint-service";

// Lint specific files
const result = await requestLint("sub-loop", ["backend/types/foo.types.ts"]);
// Returns: { success: boolean, output: string, exitCode: number }

// Full-repo lint (empty files array)
const fullResult = await requestFullRepoLint("cli");
```

**When to use programmatic vs CLI:**
- Use the programmatic API when your script already runs in a Bun/Node process and can import TypeScript (e.g., `sub-loop.ts`, orchestrator scripts).
- Use the CLI when invoking from shell commands or external tools (e.g., GitHub Actions, pre-commit hooks, extensions).

### Environment Variables

- `LINT_QUEUE_CONCURRENCY` — ESLint `--concurrency` value (default `4`; set to `auto` to let ESLint decide).
- `LINT_QUEUE_TIMEOUT_MS` — Per-request timeout in milliseconds (default: 300000 for file-scoped, 1200000 for full-repo).

### Other quality commands are safe to run in parallel

- `bun tsgo` — Safe to run concurrently (read-only type checker)
- `bun biome:check` — Safe to run concurrently (lightweight formatter/linter)
- `bun run test:*` — Safe to run concurrently (isolated test runners)
- `bun run lint` — Safe to run directly; uses the in-process service (no server startup required). When multiple callers import `requestLint()` in the same process, requests serialize through an in-memory FIFO queue.
```

## Verification Loop (Per-File Level)

When refactoring or creating code, run a per-file verification loop **BEFORE** using the result elsewhere:

1. **After extracting a function** from one file to another: run tsgo + biome + lint on the **new file containing the extracted function** BEFORE importing or using it elsewhere.
2. **After creating a new file**: run tsgo + biome + lint on the new file BEFORE importing it anywhere.

```bash
bun tsgo                          # Type check (safe to run concurrently)
bun biome:check                   # Biome (safe to run concurrently)
# Lint the specific file:
bun run scripts/lint-service.ts -f <the-file> --id verify
```

This catches issues early at the file level before they propagate to the full quality gate.
```

**Note**: The "Test Runner for Refactoring" subsection (lines 257-268) and "Parallel Subagent Quality Gate Workflow" section (lines 270-309+) remain unchanged — they are downstream of the lint service changes and their content is still accurate.

---

## Implementation Tasks (ordered)

1. **Write** `scripts/lint-service.ts` per Deliverable 1.
   - Main-module guard: use `import.meta.main` (Bun 1.3.14 supports this; confirmed by existing scripts like `quota-reminder-cron.ts:228`).
   - File must NOT import from its own `@/scripts/lint-service` alias path internally (tsconfig paths resolve at import boundaries, not self-reference).
   - Preserve exact `NODE_OPTIONS="-r ./scripts/ts6-eslint-patch.cjs"` prefix in the eslint command string (verified: patch exists and swaps `typescript` → `@typescript/typescript6` for ESLint's TypeScript parser).

2. **Per-file verification** on the new file (before any consumer change):
   - `~/.bun/bin/bun tsgo` (type-check clean).
   - `~/.bun/bin/bun biome:check scripts/lint-service.ts` (format/lint clean).
   - Smoke-run: `~/.bun/bin/bun run scripts/lint-service.ts --help` → expect usage + exit 0.
   - `~/.bun/bin/bun run scripts/lint-service.ts -f scripts/lint-service.ts --id smoke --json` → expect JSON with `"success":true`, `"exitCode":0`, and a `metrics` object with `durationMs`.
   - `~/.bun/bin/bun run scripts/lint-service.ts --notaflag` → expect exit 2 with stderr usage message.

3. **Update** `scripts/health/sub-loop.ts` per Deliverable 2.
   - Replace line 36 import: `BASE_URL as LINT_QUEUE_URL` → `requestLint, type LintResult` from `@/scripts/lint-service`.
   - Replace `lintViaQueue` function (lines 216-259) with the in-process try/catch wrapper.
   - Update `checkLint` (lines 330-343): remove the `result === null` branch (dead code after in-process migration).
   - Update `--help` text (line 479): change "lint queue unavailable" to "invalid arguments" in exit-code 2 description.
   - Per-file verify: `bun tsgo`, `bun biome:check scripts/health/sub-loop.ts`, and `bun run scripts/health/sub-loop.ts scripts/lint-service.ts --lifecycle lint` (dry run on known-clean file).

4. **Update** `.github/extensions/fix-import-aliases/extension.mjs`:
   - Remove `getLintQueuePort()` function (lines 10-27).
   - Replace the curl POST call (lines 154-156) with: `bash({ command: "~/.bun/bin/bun run scripts/lint-service.ts -f \"" + relativeFilePath + "\" --id fix-imports --json", description: "Run lint check on file" })`.
   - Parse JSON from `lintCheck.stdout` (line 159): `JSON.parse(lintCheck.stdout || "{}")` and read `lintOutput.success` (boolean, not string).
   - Per-file verify: biome (not tsgo — it's `.mjs`).

5. **Update** `.github/extensions/fix-import-aliases/skill.ts`:
   - Remove `import { LINT_QUEUE_PORT }` (line 2).
   - Replace curl call (line 124) with: `bash({ command: "~/.bun/bin/bun run scripts/lint-service.ts -f \"" + filePath.replace(/^\/home\/ahmed\/Projects\/siraj\//, "") + "\" --id fix-imports --json", description: "Run lint check on file" })`.
   - Fix success check (line 128): replace `lintCheck?.stdout?.includes('"success": "true"')` with `JSON.parse(lintCheck?.stdout || "{}").success === true` (parse JSON, check boolean field).
   - Per-file verify: `bun tsgo`, `bun biome:check .github/extensions/fix-import-aliases/skill.ts`.

6. **Update** `.github/extensions/fix-import-aliases/SKILL.md` (live operational doc):
   - Line 67-69: replace curl snippet with `bun run scripts/lint-service.ts -f <file-path> --id fix-imports --json`. Remove `${LINT_QUEUE_PORT}` placeholder.

7. **Update** `AGENTS.md` "Lint Queue Server" section (lines 183-253):
   - **Complete rewrite** — new section title: **"Lint Service (In-Process Serialized ESLint)"**.
   - Explain the unified `scripts/lint-service.ts` CLI/API; no HTTP, no server process, no port.
   - Document `bun run lint` (full-repo) and `bun run scripts/lint-service.ts -f <file> ...` (file-scoped).
   - Programmatic API: import `requestLint(id, files, options?)` or `requestFullRepoLint(id, options?)` from `@/scripts/lint-service`.
   - Remove all references to `/lint` endpoint, `/status`, `LINT_QUEUE_PORT`, `curl`, "start the server", and the PowerShell `Invoke-RestMethod` snippets.
   - Preserve the "Other quality commands are safe to run in parallel" subsection (lines 232-237) but update the `bun run lint` note to say it now uses the in-process service (still safe; no server startup required).
   - Update "Verification Loop" subsection (lines 239-255): replace the curl snippet with `bun run scripts/lint-service.ts -f <the-file> --id verify`.

8. **Delete** obsolete files:
   - `scripts/lint-queue-server.ts`
   - `scripts/lint-queue-client.ts`
   - `scripts/lint-queue-config.ts`

9. **Update** `package.json` scripts (Deliverable 3):
   - `"lint": "bun run scripts/lint-service.ts"`
   - `"lint:fix": "bun run scripts/lint-service.ts --fix"`
   - **Remove** `"lint:server": "~/.bun/bin/bun run scripts/lint-queue-server.ts"` (line 47).

10. **Update** `.env.example`:
    - Remove lines 197-198: `# Lint Queue Server Port` comment + `LINT_QUEUE_PORT=4777`.

11. **Repo grep verification**:
    - `rg -n "lint-queue-server|lint-queue-client|lint-queue-config|LINT_QUEUE_PORT" --type-not md` → should return ZERO non-markdown hits after the above updates.
    - Markdown hits in `.kilo/plans/`, `.ai/finished_plans/`, `communication_specs.md` are historical plans (out of scope).
    - `requestFullRepoLint` may still appear in historical plans — acceptable (function name preserved for API continuity).
    - Any remaining live operational docs (`.agents/skills/`, `.agents/instructions/`, `.agents/agents/`) with stale references → **flag for user** (15+ files; bulk-update strategy is a separate task).

12. **Quality gate smoke test**:
    - `~/.bun/bin/bun run scripts/quality-gate.ts` on the changeset.
    - Confirms `bun lint` resolves through the new script (quality-gate calls `bun lint` at line 117).
    - Expect exit 0 on a clean tree (or exit 1 if the changeset introduces lint issues — fix before committing).

---

## Risks & Mitigations

- **Observable exit-code contract shift**: old `cli` one-liner returned `r.exitCode ?? 0`; the server set `exitCode` to eslint's real code. New CLI sets process exit to `r.exitCode` directly. ESLint exits 1 on reported problems → `bun run lint` now exits 1 on lint issues (was the case before too, dependent on eslint's own exit). Verify with a deliberate lint-error file (`// eslint-disable-next-line` then an unmistakable violation) that exit code is 1 and that quality-gate treats it as a failure (it should — `runCommand` checks `status === 0`).
- **`sub-loop.ts` import deadlocks**: `requestLint` is async and awaits the in-process queue; `sub-loop.ts` already awaits via `checkLint` (line 330). No deadlock risk — single in-process caller per `sub-loop.ts` run.
- **`@/scripts/lint-service` alias resolution from `sub-loop.ts`**: aliases resolve at type-check + run via Bun's tsconfig paths + the project's runtime alias setup. Confirm by running `bun tsgo` after the sub-loop edit.
- **`.mjs` extension file dynamic import of removed `lint-queue-config.ts`**: removing the file breaks `extension.mjs`'s `getLintQueuePort()` fallback `readFileSync` path → tasks 4/5 MUST land before/with task 6 (deletion). Order enforces this.
- **ESLint invocation quoting**: file paths with spaces were handled in the old server via `files.map(f => \`"${f}"\`)`. Preserve identical quoting in `runEslint`.
- **`lint:fix` concurrency drift**: old `lint:fix` used `--concurrency=auto`; new uses `4` default. Document in the plan that callers wanting `auto` set `LINT_QUEUE_CONCURRENCY=auto`. Not a blocker.

## Validation Plan

- `bun tsgo` clean after each source edit.
- `bun biome:check` clean on every touched `.ts`/`.mjs`/`.json` file (skip `.env.example` — not biome-checked).
- `bun run scripts/lint-service.ts --help` exits 0 with usage text.
- `bun run scripts/lint-service.ts -f scripts/lint-service.ts --id smoke --json` → JSON with `"success":true`, `"exitCode":0`, contains `"metrics":{"durationMs":...}`.
- `bun run scripts/lint-service.ts -f file1.ts -f file2.ts --id test` → handles multiple `-f` flags (parseArgs with `multiple: true` returns array).
- `bun run scripts/lint-service.ts --notaflag` → exit 2 with stderr usage error.
- `bun run lint` (full repo, no file args) → equivalent to prior `requestFullRepoLint('cli')`; exit code matches eslint's exit code.
- `bun run lint:fix` → applies fixes; equivalent to old `lint:fix` behavior.
- `bun run scripts/health/sub-loop.ts scripts/lint-service.ts --lifecycle lint` → passes (file is lint-clean).
- `bun run scripts/quality-gate.ts` on the changeset → passes (lint stage at line 117 executes `bun lint` via new script).
- `rg` verification in task 11 returns zero non-markdown hits for deleted file imports.
