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

# Linting & Formatting (via lint queue — `bun run lint` IS the lint queue client)
bun run lint                   # Full-repo ESLint; this script now IS the lint queue client (calls requestFullRepoLint). Safe for parallel sub-agents — requests are serialized through the lint queue server.
bun run lint:server            # Start the lint queue server (background); required before any `bun run lint` / lint queue client call works
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

## SonarQube Issue Management

When `.scannerwork/sonar-result.json` exists:
1. **DO NOT run new Sonar analysis** - use `scripts/sonar-manager.ts`
2. **Resolve DUPLICATIONS first** (mandatory priority)
3. Use `bun scripts/sonar-manager.ts list-duplicates` and `list-files`
4. Clear entries with `delete --file <path>` or `--all-duplicates`
5. Final verification: both commands must return empty

## Code Quality Workflow

After making changes:
1. Run `bun quality-gate` - it handles tsgo, biome, lint, codescene, sonar sequentially
2. If CODESCENE fails: run `bun run codescene --file <path>` to fix
3. If SONAR_RESULTS fails: use `bun scripts/sonar-manager.ts`
4. Re-run `bun quality-gate` to resume from last failed stage
5. Use `bun quality-gate:fresh` only for clean-slate verification

## Lint Queue Server (REQUIRED for parallel sub-agents)

`bun run lint` used to be heavyweight and **MUST NOT have been run concurrently** by multiple sub-agents — it caused resource contention and intermittent failures. That prohibition is now lifted: as of the `package.json` change, `bun run lint` is no longer a raw eslint invocation — it is a thin wrapper that calls `requestFullRepoLint` from `scripts/lint-queue-client.ts`, so every `bun run lint` invocation already goes through the queue. **You can run `bun run lint` (or `bun lint`) directly now** — it serializes behind the queue server like any other caller.

Sub-agents that lint specific files (instead of the whole repo) should still call `requestLint("id", [files])` from `scripts/lint-queue-client.ts` so they don't waste time linting the entire repo. The whole-repo shortcut `requestFullRepoLint` is what `bun run lint` calls under the hood.

### Starting the server

The queue server MUST be running before any `bun run lint` / lint queue client call works. Start it as a background process:

```bash
~/.bun/bin/bun run scripts/lint-queue-server.ts
```

This listens on `http://localhost:4777`.

### Submitting lint requests (from sub-agents)

For full-repo lint, just run `bun run lint` — it goes through the queue server automatically.

For file-scoped lint (faster, recommended when a sub-agent only touched a handful of files), call the lint queue client directly instead of running the whole-repo script:

**PowerShell (recommended for sub-agents):**
```powershell
$files = @("backend/types/foo.types.ts","frontend/stores/barStore.ts")  # ALL files the sub-agent modified
$body = @{ id = "phase8"; files = $files } | ConvertTo-Json
Invoke-RestMethod -Uri http://localhost:4777/lint -Method POST -ContentType 'application/json' -Body $body
```

**Bash / curl (also works):**
```bash
curl -s -X POST http://localhost:4777/lint \
  -H "Content-Type: application/json" \
  -d '{"id":"phase8","files":["backend/types/foo.types.ts","frontend/stores/barStore.ts"]}'
```

**Response:** `{ success: boolean, output: string, exitCode: number }`

The request **blocks** until the lint run completes (the server processes requests one at a time).

### Health check

```powershell
Invoke-RestMethod -Uri http://localhost:4777/status
# Returns: { running: true, queueLength: 2 }
```

### Other quality commands are safe to run in parallel

- `bun tsgo` — Safe to run concurrently (read-only type checker)
- `bun biome:check` — Safe to run concurrently (lightweight formatter/linter)
- `bun run test:*` — Safe to run concurrently (isolated test runners)
- **`bun run lint`** — Now safe to run directly: as of the `package.json` change, this script just calls `requestFullRepoLint` from `scripts/lint-queue-client.ts`, so it serializes through the queue server like every other caller. For file-scoped lint, call `requestLint` directly.

## Verification Loop (Per-File Level)

When refactoring or creating code, run a per-file verification loop **BEFORE** using the result elsewhere:

1. **After extracting a function** from one file to another: run tsgo + biome + lint-queue-client on the **new file containing the extracted function** BEFORE importing or using it elsewhere.
2. **After creating a new file**: run tsgo + biome + lint-queue-client on the new file BEFORE importing it anywhere.

```bash
bun tsgo                          # Type check (safe to run concurrently)
bun biome:check                   # Biome (safe to run concurrently)
# Lint via queue client for the specific file:
curl -s -X POST http://localhost:4777/lint \
  -H "Content-Type: application/json" \
  -d '{"id":"verify","files":["<the-file>"]}'
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
- Stage order: `tsgo` → `biome:check` → `lint` → `codescene` → `sonar-results`

### Subagent Dispatch Model

- **One subagent per file** — maximum parallelism
- **tsgo uses grouped parallel**: bundle related files (same import chain, same directory, same type
  dependency) into batches. Fix a batch in parallel, verify, then move to the next batch
- **biome/lint/codescene/sonar-results**: full parallel — all files at once

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
| `sonar-results` | same as `codescene` (no sonar-scan) |

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

## Sonar-Scan Prohibition (IMPORTANT)

**SonarQube scan is VERY COSTLY to run. Subagents must NEVER run it.**

- Subagents must **NEVER** run `bun sonar-scan` or `bun scripts/sonar-manager.ts`
- Only the **quality-gate orchestrator** handles sonar stages (SONAR_SCAN, SONAR_RESULTS)
- Subagents work with **existing results** in `.scannerwork/sonar-result.json` — they never
  trigger a new scan
- The `scripts/health/sub-loop.ts` script **hardcodes exclusion** of sonar-scan and
  sonar-manager — there is no flag to enable them
- If a subagent needs sonar duplication/issue data, it queries the existing results via
  `bun scripts/sonar-manager.ts list-duplicates` and `list-files` (read-only operations,
  no scan trigger)

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
- `docs/graphql/dataloader-batching.md` - Pothos DataLoader batching pattern reference
- `.github/CODE_REVIEW_CHECKLIST.md` - Code review guidelines
