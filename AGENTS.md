# AGENTS.md

This document provides essential context for AI agents working in this codebase. It focuses on non-obvious patterns, gotchas, and commands that aren't self-evident from reading individual files.

## Project Overview

Siraj is a Next.js 16 (App Router) full-stack application using:
- **Runtime**: Bun (not Node.js)
- **Frontend**: React 19, MUI v9, Apollo Client v4, Zustand
- **Backend**: Pothos GraphQL, Drizzle ORM, PostgreSQL
- **Testing**: Bun test runner, Vitest for Storybook, Playwright for E2E
- **i18n**: **Custom compile-time TypeScript system** in `shared/locale/` (replaces legacy `next-intl`; see `shared/AGENTS.md` for rules). Next.js native `[locale]` routing preserved.

## Essential Commands

All commands use Bun. The specific binary path `~/.bun/bin/bun` is required in some environments.

```bash
# Development
bun run dev                    # Start dev server with Turbopack on port 3000
bun run dev:safe               # Safe dev mode via scripts/safe-dev.ts
bun run debug                  # Same as dev (alias for debugging workflows)
bun run dev:inspect            # Start dev server with Node inspector enabled (--inspect)

# Build & Type Check
bun run build                  # Next.js production build
bun run tsgo                   # Fast TypeScript checking (tsgo, not tsc)

# Linting & Formatting (in-process serialized lint service)
bun run lint                   # Full-repo ESLint; in-process serialized lint service — safe for parallel sub-agents
bun run lint:fix               # Full-repo ESLint with auto-fix
bun lint:type-aware            # Type-aware ESLint (sonarjs rules requiring type context); use --fix to auto-fix
bun run format                 # Biome formatter
bun run biome:check            # Biome lint + format + unsafe fixes

# GraphQL Code Generation (REQUIRED after schema/document changes)
bun run generate:gqlSchema     # Generate GraphQL schema from Pothos
bun codegen                    # Generate TypeScript types from schema

# Testing (layer-specific)
bun run build:test             # Build production bundle for UI/E2E tests (.next-test-prod) — REQUIRED before test:ui:e2e
bun run test                   # All tests
bun run test:db                # Database repository tests (parallel via scripts/run-db-tests-parallel.ts)
bun run test:db:sequential     # Database tests (sequential, for debugging)
bun run test:integration       # Provider integration smokes (parallel via scripts/run-integration-tests-parallel.ts)
bun run test:integration:sequential  # Integration tests (sequential, for debugging)
bun run test:live-comm         # Communication provider integration subset
bun run test:live-fx           # FX provider integration subset
bun run test:services          # Backend services tests (parallel via scripts/run-services-tests-parallel.ts)
bun run test:services:sequential # Backend services tests (sequential, for debugging)
bun run test:graphql           # GraphQL integration tests (dev server)
bun run test:ui:components     # UI component tests (Happy DOM, no server)
bun run test:ui:e2e            # End-to-end tests (production server — run build:test first)
bun run test:ui                # All UI tests (components + e2e + static)
bun run test:ui:kill           # Kill test servers on ports 3001/3020–3199 only (never dev:3000 or start:4000)

# Run database tests with log capture (AI agents MUST use this instead of raw `bun test`)
bun run scripts/run-test/run-test.ts <test-path>        # Run with log capture
bun run scripts/run-test/run-test.ts --last <path>      # View last result (AI-optimized)
bun run scripts/run-test/run-test.ts --last --focus "<pattern>" <path>  # Filtered view

# Quality Gates
bun quality-gate               # Automated quality verification (tsgo → biome → lint → codescene → sonar)
bun quality-gate:fresh         # Reset state and run fresh

# Database
bun run db                      # Database actions via scripts/dbActions/ (generate, push, migrate, seed, studio — reset & cleanGenerate disabled by repo policy)
```

## Architecture Layers

The codebase follows strict layer separation. Each layer has its own `AGENTS.md` with detailed rules.

### Layer Hierarchy (read layer-specific AGENTS.md before working in each)

| Layer | Path | AGENTS.md Location |
|-------|------|-------------------|
| App Router | `app/` | `app/AGENTS.md` |
| Shared | `shared/` | `shared/AGENTS.md` |
| Frontend Views | `frontend/views/` | `frontend/views/AGENTS.md` |
| Frontend Stores | `frontend/stores/` | `frontend/stores/AGENTS.md` |
| Frontend GraphQL | `frontend/common/graphql/` | `frontend/common/graphql/AGENTS.md` |
| Backend Services | `backend/services/` | `backend/services/AGENTS.md` |
| Backend GraphQL/Pothos | `backend/graphql/` | `backend/graphql/AGENTS.md` |
| Database Repositories | `backend/db/repo/` | `backend/db/repo/AGENTS.md` |
| Database Seeds | `backend/db/seeds/` | `backend/db/seeds/AGENTS.md` |
| Backend Types | `backend/types/` | `backend/types/AGENTS.md` |
| Backend Enums | `backend/enum/` | `backend/enum/AGENTS.md` |

### Data Flow

```
Client Component → Apollo Hook → GraphQL API → Pothos Resolver → Service → Repository → Database
Server Component → Cached Wrapper → Service → Repository → Database
```

**Critical**: Server Components call services directly (not GraphQL). Client Components use Apollo hooks.

## Non-Obvious Patterns & Gotchas

### Next.js 16 Breaking Changes
This is NOT standard Next.js. APIs and conventions differ from training data. **Always read `node_modules/next/dist/docs/` before writing Next.js code.**

### Logging
- **NEVER use `console.*` directly** - ESLint will error
- Always use: `import { logger } from '@/frontend/utils/logger'` (frontend) or `@/backend/lib/logger` (backend)
- Methods: `logger.info`, `logger.warn`, `logger.error`, `logger.debug`

### MUI v9 Breaking Changes
- Style props (`fontWeight`, `textAlign`, `mb`, `mt`, `p`, `display`, etc.) are NOT valid direct props on Typography, Stack, Box, Grid
- Always use `sx` prop: `<Typography sx={{ fontWeight: 700, mb: 1 }}>`
- Icon naming changed: `*Outline` → `*Outlined` (e.g., `ErrorOutline` → `ErrorOutlined`)
- See `frontend/AGENTS.md` for complete list

### React 19 Changes
- `FormEvent` is deprecated/removed. Use `React.SubmitEvent` or `React.SyntheticEvent<HTMLFormElement>`
- Cast FormData results: `(formData.get("name") as string | null) ?? ""`

### Path Aliases
- The `@/*` path alias maps to the project root (`./`), configured in `tsconfig.json` under `compilerOptions.paths`
- All imports use this pattern: `import { logger } from "@/backend/lib"` (never relative paths)
- Examples: `@/backend/services/` → `./backend/services/`, `@/frontend/views/` → `./frontend/views/`

### Shared Layer
- `shared/` is used by both frontend and backend — it must **never** import from `@/frontend/**`, `@/backend/**`, or `@/app/**` (ESLint enforced).
- Cross-layer enums and constants belong in `shared/constants/`; utilities in `shared/lib/`. See `shared/AGENTS.md`.

### Database Testing Critical Rules
- **ALWAYS use `runInRollback` wrapper** for database tests
- **ALWAYS pass `tx` to ALL repository methods** inside transactions - mixing `tx` queries with `db`-backed repo calls causes deadlocks
- **NEVER use `expect(...).rejects.toThrow()` inside `runInRollback`** - causes deadlocks. Use try/catch helper pattern instead
- **NEVER query seed data** - always create test data using helpers in `entity-setup.ts`
- Verify entity-setup helper signatures before use - they vary significantly

### GraphQL Document Conventions
- Documents live in `frontend/common/graphql/sharedDocuments/<domain>.documents.ts`
- Naming: `{entityName}QueryDocument`, `{entityName}MutationDocument`
- **Always include `id` field** on every object type for Apollo cache normalization
- **NO `useLazyQuery`** - use stateful `useQuery` exclusively
- Import hooks from `"@apollo/client/react"`, not `"@apollo/client"`

### Type Definition Pattern (CRITICAL)
All layers use types from `backend/types/{entity}.types.ts`:
- `{Entity}SelectType`, `{Entity}InsertType` - database types
- `{Entity}ReturnType`, `{Entity}SubmitInput` - service/API types
- **Never create local type definitions in Pothos files** - always import from `@/backend/types`
- Single canonical GraphQL object type per entity

### i18n / Localized Errors
- All user-facing error messages must use the **compile-time translation system** in `shared/locale/`
- **Server Components**: use `getTranslations(locale, "namespace")` from `@/shared/locale/server`
- **Client Components**: use `useAppTranslation("namespace")` from `@/shared/locale/client`
- **GraphQL Resolvers**: use `ctx.t("namespace")` — already bound to `ctx.locale`
- **API Routes / Scripts / Tests**: use `getServerTranslations(locale, "namespace")` from `@/shared/locale/server-graphql`
- **Pluralization**: define as `(count: number) => string` in type schema, implement in each locale file
- **Interpolation**: define as `(param: string, ...) => string` in type schema, implement with template literals
- **Never hardcode error strings** — always use typed translation functions
- The legacy `next-intl` package has been removed; all translation namespaces now live in `shared/locale/`. Never import `next-intl`, `getBackendTranslations`, or from `shared/messages/` (the directory no longer exists).

### Theme & Styling
- **NO hardcoded colors** - all colors from theme palette
- Use theme callback: `sx={(theme) => ({ color: theme.palette.primary.main })}`
- Use Material 3 `on<Color>` siblings for contrast (e.g., `theme.palette.onPrimary`)
- See `frontend/THEME_PALETTE.md` for tokens

## Code Quality Workflow

After making changes:
1. Run `bun quality-gate` - it handles tsgo, biome, lint, codescene sequentially
2. If CODESCENE fails: run `bun run codescene --file <path>` to fix
3. Re-run `bun quality-gate` to resume from last failed stage
4. Use `bun quality-gate:fresh` only for clean-slate verification

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

## Test Runner for Refactoring

When refactoring or fixing a **test file**, use the run-test script instead of raw `bun test`:

```bash
bun run scripts/run-test/run-test.ts <test-path>                       # Run with log capture
bun run scripts/run-test/run-test.ts --last <test-path>               # View last result (AI-optimized)
bun run scripts/run-test/run-test.ts --last --focus "<pattern>" <test-path>  # Filtered view
```

The run-test script captures output to log files for easier debugging and is mandatory for database tests
(to capture deadlocks and transaction issues that raw `bun test` may swallow).

## Parallel Subagent Quality Gate Workflow

When running `bun quality-gate`, the orchestrator dispatches **parallel subagents** to fix files
within each lifecycle stage. Key rules:

### Lifecycle Isolation (No Cross-Stage Interleaving)

- Subagents are dispatched **per lifecycle stage only** — no mixing stages in the same wave
- Each stage must fully complete before advancing to the next
- Stage order: `tsgo` → `biome:check` → `lint` → `codescene`

### Subagent Dispatch Model

- **One subagent per file** — maximum parallelism
- **tsgo uses grouped parallel**: bundle related files (same import chain, same directory, same type
  dependency) into batches. Fix a batch in parallel, verify, then move to the next batch
- **biome/lint/codescene**: full parallel — all files at once

### Per-File Verification via `scripts/health/sub-loop.ts`

Each subagent calls the automation script to verify its file:

```bash
bun run scripts/health/sub-loop.ts <file-path> --lifecycle <stage>
```

The script runs a **progressive loop** (tsgo → biome → lint-queue-client → codescene) and
**short-circuits at the first failing check**. The subagent fixes the errors and re-runs until
the script exits 0. The `--lifecycle` arg controls the target stage:

| `--lifecycle` | Checks run (in order) |
|---------------|----------------------|
| `tsgo` | tsgo only |
| `biome` | tsgo → biome |
| `lint` | tsgo → biome → lint (via queue client) |
| `codescene` | tsgo → biome → lint → codescene --file |

**Progressive enforcement**: no skipping ahead. If tsgo fails, only fix tsgo — don't run
biome/lint/codescene until tsgo passes.

### Instruction File & AGENTS.md Discovery (Per-File)

The `scripts/health/sub-loop.ts` script automatically discovers and prints which instruction
files and AGENTS.md files apply to the target file. Subagents MUST read ALL listed files before
fixing. The mapping is:

**Instruction files** (`.github/instructions/*.instructions.md`):

| File Path Pattern | Instruction File |
|---|---|
| `frontend/**/*.ts(x)`, `app/**/*.ts(x)` | `frontend.instructions.md` |
| `backend/**/*.ts` | `backend.instructions.md` |
| `**/*.test.ts(x)`, `**/*.spec.ts(x)`, `scripts/run-test/**/*.ts` | `tests.instructions.md` |

A file may match **multiple** instruction files (e.g., `backend/db/test/*.test.ts` matches
both `backend.instructions.md` and `tests.instructions.md`). Read ALL matching files.

**AGENTS.md files** (in addition to root `AGENTS.md` which is always applicable):

| File Path Prefix | Additional AGENTS.md Files |
|---|---|
| `app/` | `app/AGENTS.md` |
| `shared/` | `shared/AGENTS.md` |
| `frontend/views/` | `frontend/views/AGENTS.md`, `frontend/AGENTS.md` |
| `frontend/stores/` | `frontend/stores/AGENTS.md`, `frontend/AGENTS.md` |
| `frontend/common/graphql/sharedDocuments/` | `frontend/common/graphql/sharedDocuments/AGENTS.md`, `frontend/common/graphql/AGENTS.md`, `frontend/AGENTS.md` |
| `frontend/common/graphql/` | `frontend/common/graphql/AGENTS.md`, `frontend/AGENTS.md` |
| `backend/services/` | `backend/services/AGENTS.md`, `backend/AGENTS.md` |
| `backend/graphql/` | `backend/graphql/AGENTS.md`, `backend/AGENTS.md` |
| `backend/db/repo/` | `backend/db/repo/AGENTS.md`, `backend/AGENTS.md` |
| `backend/db/seeds/` | `backend/db/seeds/AGENTS.md`, `backend/AGENTS.md` |
| `backend/db/test/` | `backend/db/test/AGENTS.md`, `backend/AGENTS.md` |
| `backend/types/` | `backend/types/AGENTS.md`, `backend/AGENTS.md` |
| `scripts/run-test/` | `scripts/run-test/AGENTS.md` |

### Fix-Or-Report Rule for Cross-File Violations

After reading the applicable instruction files and AGENTS.md, subagents check for rule violations:
- **Fix within the SAME file**: if the violation can be fixed in the assigned file, fix it directly.
- **Report cross-file dependencies**: if fixing requires modifying ANOTHER file, do NOT modify it.
  Report to the orchestrator using:
  ```
  CROSS-FILE DEPENDENCY:
    Target file: <this file>
    Blocked by: <other file that needs changes>
    Rule violated: <which rule from instruction file or AGENTS.md>
    Required fix: <description of what the other file needs>
  ```
- **Never modify a file you were not assigned to.** The orchestrator coordinates multi-file changes
  by dispatching a follow-up subagent wave for the dependency files.

## AI Agent Communication Rules

- **NEVER create summary markdown files** (SUMMARY.md, CHANGES.md, REPORT.md, etc.)
- **DO respond in chat** with clear summary of what was done
- Exception: Documentation files that are part of project structure (README.md, CONTRIBUTING.md)

## File Organization

### Frontend
- `frontend/views/dashboard/` - Domain-organized page components
- `frontend/stores/` - Zustand stores (mock stores for Storybook)
- `frontend/components/ui/` - Shared UI components (AppDataGrid, MetricCard, PageContainer, etc.)
- `frontend/common/graphql/sharedDocuments/` - GraphQL documents by domain
- `frontend/common/graphql/generated/` - Auto-generated types (do not edit)

### Backend
- `backend/db/schema/` - Drizzle table definitions
- `backend/db/repo/` - Repository layer (data access only)
- `backend/services/` - Business logic, organized by domain
- `backend/graphql/pothos/` - Pothos GraphQL definitions
- `backend/types/` - Canonical type definitions
- `backend/lib/` - Utilities (auth, logger, env, etc.)

### Testing
- `backend/db/test/repo/` - Repository unit tests (100% coverage required)
- `backend/db/test/logic/` - Business logic integration tests
- `frontend/common/graphql/test/` - GraphQL integration tests (dev server; use testClient, not raw fetch)
- `test/ui/` - UI tests — see `test/ui/AGENTS.md`
- `test/ui/components/` - Component tests (Happy DOM + mocked Apollo; no server)
- `test/ui/e2e/` - End-to-end tests (production server; requires `bun run build:test` first)

## Important References

- `frontend/COMPONENT_PATTERNS.md` - Dashboard UI patterns
- `frontend/IMPLEMENTATION_LEARNINGS.md` - Error resolutions from past mistakes
- `frontend/NEW_PAGE_WORKFLOW.md` - Required workflow for new pages
- `frontend/THEME_PALETTE.md` - Color tokens and access patterns
- `docs/IDEMPOTENCY.md` - Idempotency patterns
- `docs/drizzle/prepared-statements.md` - Drizzle Prepared Statements 2.0 pattern reference
- `docs/drizzle/neon-http-client.md` - Neon HTTP Client & Provider-Agnostic Stateless Queries reference
- `docs/graphql/dataloader-batching.md` - Pothos DataLoader batching pattern reference
- `docs/services/entity-cache-service.md` - Entity Cache Service pattern reference
- `docs/services/meeting-providers.md` - Meeting provider adapter/factory pattern reference (auto URL generation)
- `docs/services/whatsapp-cloud-api.md` - WhatsApp Cloud API integration reference (adapter, factory, webhook, dispatch, schema, opt-in, frontend)
- `docs/billing/quota-system.md` - Quota System: append-only ledger, FIFO selection, periodic rollover, on-demand scheduling integration
- `.github/CODE_REVIEW_CHECKLIST.md` - Code review guidelines
- `docs/services/cron-service.md` - Cron service pattern reference
- `docs/frontend/ui-shared-scaffold-pattern.md` - UI Shared Scaffold (*Shared.tsx) pattern for common/desktop/mobile triplication
- `docs/frontend/duplication-elimination-patterns.md` - Canonical source deletion, scaffold extraction, shared types patterns
- `docs/testing/shared-test-runner.md` - Shared parallel test runner pattern
- `docs/backend/shared-types-pattern.md` - Cross-layer shared types in shared/types/
- `docs/i18n/locale-namespace-migration.md` - Locale namespace migration from monolithic to sub-module directories
- `docs/auth/permission-architecture.md` - Client-side permission architecture (3-tier model, wrapper removal rationale)


## Oxlint Rules (CRITICAL — NO `oxlint-disable` comments allowed)

Oxlint is the project's linter (`bun run oxlint`). It uses type-aware mode (`typeAware: true`, `typeCheck: true` in `oxlint.config.mts`). NEVER add `oxlint-disable` comments — fix the root cause instead.

### no-unsafe-type-assertion (STRICT — stricter than ESLint)

Oxlint's `no-unsafe-type-assertion` rule flags ALL `as Type` assertions that narrow from a wider type to a narrower one. **`as unknown as Type` (double assertion) does NOT bypass this rule.**

**Use type guards instead of `as`:**
```ts
// WRONG — flagged by oxlint
const record = value as Record<string, unknown>;
const error = caught as Error;
const row = result as EntitySelectType;

// RIGHT — type guard (not flagged)
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
const record = isRecord(value) ? value : {};

// RIGHT — instanceof for errors
if (error instanceof Error) return error;
throw new Error(String(error));

// RIGHT — find() with widening cast for enum narrowing
const match = Object.values(SomeEnum).find(v => (v as string) === value);
// `(v as string)` is a widening cast (safe, not flagged)
```

**For Drizzle pgEnum columns** (inferred as `string` not the enum type):
- Add `.$type<EnumType>()` to the column definition in the schema to fix at source
- OR use type guards: `function isStatus(value: string): value is Status { return (Object.values(Status) as readonly string[]).includes(value); }`

**For `response.json()` (returns `any`):**
- Type the variable: `const data: SomeType = await response.json();`
- OR use a type guard: `const data: unknown = await response.json(); if (!isSomeType(data)) throw ...;`

### no-await-in-loop

`await` inside `for`, `while`, `do...while`, `for...of` loops is flagged.

**Use `Promise.all` for independent iterations:**
```ts
// WRONG
for (const item of items) { await process(item); }

// RIGHT — parallel
await Promise.all(items.map(item => process(item)));
```

**Use recursive helper for sequential iterations (shared transactions, ordered timestamps):**
```ts
async function processNext(index: number): Promise<void> {
  if (index >= items.length) return;
  await process(items[index]);
  return processNext(index + 1);
}
await processNext(0);
```

**Use `reduce` chain as alternative:**
```ts
await items.reduce(async (prev, item) => {
  await prev;
  return processOne(item);
}, Promise.resolve());
```

**`for await...of` is NOT flagged** (async iterable iteration).

**DO NOT parallelize when:** iterations share a DB transaction connection, each depends on the previous result, or ordering matters (e.g., sequential timestamps for pagination tests).

### consistent-function-scoping

Functions defined inside another function that don't capture any variables from the enclosing scope should be at module scope.

```ts
// WRONG — doesn't capture anything from parent
function component() {
  const helper = (x: string) => x.toUpperCase(); // flagged
  return helper("test");
}

// RIGHT — moved to module scope
const helper = (x: string) => x.toUpperCase();
function component() {
  return helper("test");
}
```

### no-object-type-as-default-prop

React component default props must not be object/array literals (re-created every render, breaks referential equality).

```ts
// WRONG
function Component({ options = {} }: Props) { ... }
function Component({ items = [] }: Props) { ... }

// RIGHT — stable module-level reference
const DEFAULT_OPTIONS = {};
const DEFAULT_ITEMS: readonly ItemType[] = [];
function Component({ options = DEFAULT_OPTIONS, items = DEFAULT_ITEMS }: Props) { ... }
```

### no-underscore-dangle

Identifiers with leading underscores are flagged. Fix by renaming, or use bracket notation for external API fields:

```ts
// WRONG
const value = obj._ref;
function _helper() { ... }

// RIGHT — rename
const value = obj.ref;
function helper() { ... }

// RIGHT — bracket notation for external API fields (not flagged)
const refKey = "_ref";
const value = obj[refKey];
// OR: const { _ref } = obj; (destructuring not flagged)
```

### no-unsafe-enum-comparison

Comparing values of different enum types (or enum vs string) is flagged.

```ts
// WRONG — enum vs string
if (row.status === SomeEnum.VALUE) { ... }

// RIGHT — both sides as string
if (String(row.status) === String(SomeEnum.VALUE)) { ... }
// OR use string literals
if (row.status === "VALUE") { ... }
// OR use Set-based lookup
const VALID_STATUSES = new Set(Object.values(SomeEnum) as string[]);
if (VALID_STATUSES.has(row.status)) { ... }
```

### no-shadow

Variable names shadowing an outer scope variable are flagged. Fix with destructuring rename or `_` prefix for unused params:

```ts
// WRONG
const studentHref = "...";
function Card({ studentHref }: Props) { ... } // shadows

// RIGHT — destructuring rename
function Card({ studentHref: href }: Props) { ... }

// RIGHT — unused param prefix (config: argsIgnorePattern: "^_")
async function test(_tx: DBTransaction) { ... }
```

### consistent-return

Functions must consistently return values or not return values (no mixing `return value` and `return;`).

```ts
// WRONG — mixes void and value returns
function getStatus(active: boolean) {
  if (active) return "ACTIVE";
  return; // void return — flagged
}

// RIGHT — consistent value returns
function getStatus(active: boolean) {
  if (active) return "ACTIVE";
  return undefined; // or return null;
}
```

**Config override exists** for `useEffect` callbacks (false positives — the rule doesn't understand React cleanup patterns). Already configured in `oxlint.config.mts`.

### no-map-spread

Using spread syntax (`...`) inside `.map()` is flagged because it creates a new object on every iteration, which can be expensive for large arrays.

```ts
// WRONG — spread inside .map()
const result = items.map(item => ({ ...item, extra: true }));

// RIGHT — use Object.assign
const result = items.map(item => Object.assign({}, item, { extra: true }));

// RIGHT — or create a new object explicitly
const result = items.map(item => {
  return { id: item.id, name: item.name, extra: true };
});
```

### no-unnecessary-type-assertion

Redundant `as` assertions that don't narrow or widen the type are flagged.

```ts
// WRONG — assertion to the same type
const value = getString() as string;

// RIGHT — remove the assertion
const value = getString();
```

### Config Overrides (legitimate — NOT `oxlint-disable`)

The `oxlint.config.mts` has `overrides` for:
- **Test files**: `@typescript-eslint/unbound-method: "off"` (false positive for mock function references)
- **`useEffect` files**: `@typescript-eslint/consistent-return: "off"` (false positive for cleanup callbacks)
- **Logger/scripts**: `no-console: "off"` (intentional console usage)

These are config-level overrides, NOT inline `oxlint-disable` comments.

## ESLint/sonarjs Rules (type-aware lint)

The project runs ESLint with type-aware mode via `bun lint:type-aware` (or `bun run scripts/lint-service.ts --type-aware --fix`). These sonarjs rules commonly surface after oxlint fixes — subagents must resolve them during sub-loop's `lint:type-aware` stage.

### sonarjs/no-hardcoded-passwords

Hardcoded password strings (even in test fixtures) are flagged.

```ts
// WRONG — flagged in test fixtures
password: "hashed-password",

// RIGHT — extract to env-based constant
const TEST_PASSWORD = process.env.TEST_PASSWORD_HASH ?? "test-pw";
password: TEST_PASSWORD,
```

### sonarjs/cognitive-complexity

Function cognitive complexity exceeds 15 (the allowed limit). Common after extracting type guards or adding validation logic.

```ts
// WRONG — cognitive complexity > 15 due to nested switch + conditionals
function maskDetails(type, details, reveal) {
  switch (type) {
    case BANK_TRANSFER: {
      if (!isBankTransfer(details)) throw ...;
      const plain = reveal ? decrypt(details) : details;
      if (reveal) return plain;
      return { iban: ..., bankName: ..., /* 6 more fields */ };
    }
    // ... more cases
  }
}

// RIGHT — extract the complex case to a named helper
function maskBankTransferDetails(details, reveal) { /* ... */ }
function maskDetails(type, details, reveal) {
  switch (type) {
    case BANK_TRANSFER: return maskBankTransferDetails(details, reveal);
    // ... other cases
  }
}
```

### sonarjs/no-nested-functions

Function nesting exceeds 4 levels. Common when `.catch()` or `.then()` callbacks are nested inside `.reduce()` chains inside async functions.

```ts
// WRONG — .catch() nested inside .reduce() inside .then() inside async function (> 4 levels)
await items.reduce((chain, item) =>
  chain.then(() =>
    service.process(item).catch(error => { logger.error(...); throw error; })
  ), Promise.resolve()
);

// RIGHT — extract the catch handler to module scope as a factory
function handleProcessError(item: { id: string }): (error: unknown) => never {
  return (error: unknown) => {
    logger.error("Process failed", { id: item.id, error: error instanceof Error ? error.message : String(error) });
    throw error;
  };
}
await items.reduce((chain, item) =>
  chain.then(() => service.process(item).catch(handleProcessError(item))), Promise.resolve()
);
```

### sonarjs/void-use

The `void` operator is flagged. Common when validating URLs or expressions where the return value is intentionally discarded.

```ts
// WRONG — void operator flagged by sonarjs
try { void new URL(data.meetingUrl); } catch { /* handle */ }

// ALSO WRONG — removing void triggers eslint(no-new) and then _ triggers no-underscore-dangle
try { const _ = new URL(data.meetingUrl); } catch { /* handle */ }

// RIGHT — IIFE that returns a boolean, no void, no unused variable
const isValidUrl = (() => { try { return Boolean(new URL(data.meetingUrl)); } catch { return false; } })();
if (!isValidUrl) { ctx.addIssue({ ... }); }
```

### sonarjs/different-types-comparison

`!==` comparison between types where one side can never equal the other. Common when a function returns `T | null` and code also checks `!== undefined`.

```ts
// WRONG — teacher is TeacherSelectType | null, never undefined
teachers.filter((t): t is TeacherSelectType => t !== undefined && t !== null);

// RIGHT — only null check is needed
teachers.filter((t): t is TeacherSelectType => t !== null);
```

### eslint/no-new

Using `new` for side effects without assigning the result. Often appears after removing `void` to satisfy `sonarjs/void-use`.

```ts
// WRONG — new for side effects
try { new URL(data.meetingUrl); } catch { /* handle */ }

// RIGHT — use the IIFE boolean pattern (see sonarjs/void-use above)
```
