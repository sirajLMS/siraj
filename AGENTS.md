# AGENTS.md

This document provides essential context for AI agents working in this codebase. It focuses on non-obvious patterns, gotchas, and commands that aren't self-evident from reading individual files.

## Project Overview

Siraj is a Next.js 16 (App Router) full-stack application using:
- **Runtime**: Bun (not Node.js)
- **Frontend**: React 19, MUI v9, Apollo Client v4, Zustand
- **Backend**: Pothos GraphQL, Drizzle ORM, PostgreSQL
- **Testing**: Bun test runner, Vitest for Storybook, Playwright for E2E
- **i18n**: next-intl with locale-based routing (`/[locale]/...`)

## Essential Commands

All commands use Bun. The specific binary path `~/.bun/bin/bun` is required in some environments.

```bash
# Development
bun run dev                    # Start dev server with Turbopack on port 3000
bun run dev:safe               # Safe dev mode via scripts/safe-dev.ts

# Build & Type Check
bun run build                  # Next.js production build
bun run tsgo                   # Fast TypeScript checking (tsgo, not tsc)

# Linting & Formatting
bun run lint                   # ESLint with auto-fix and caching
bun run format                 # Biome formatter
bun run biome:check            # Biome lint + format + unsafe fixes

# GraphQL Code Generation (REQUIRED after schema/document changes)
bun run generate:gqlSchema     # Generate GraphQL schema from Pothos
bun codegen                    # Generate TypeScript types from schema

# Testing (layer-specific)
bun run test                   # All tests
bun run test:db                # Database repository tests (parallel)
bun run test:db:sequential     # Database tests (sequential, for debugging)
bun run test:graphql           # GraphQL integration tests
bun run test:ui:components     # UI component tests
bun run test:ui:e2e            # End-to-end tests

# Quality Gates
bun quality-gate               # Automated quality verification (tsgo → biome → lint → codescene → sonar)
bun quality-gate:fresh         # Reset state and run fresh

# Database
bun run db                     # Database actions via scripts/dbActions.ts
```

## Architecture Layers

The codebase follows strict layer separation. Each layer has its own `AGENTS.md` with detailed rules.

### Layer Hierarchy (read layer-specific AGENTS.md before working in each)

| Layer | Path | AGENTS.md Location |
|-------|------|-------------------|
| App Router | `app/` | `app/AGENTS.md` |
| Frontend Views | `frontend/views/` | `frontend/views/AGENTS.md` |
| Frontend Stores | `frontend/stores/` | `frontend/stores/AGENTS.md` |
| Frontend GraphQL | `frontend/graphql/` | `frontend/graphql/AGENTS.md` |
| Backend Services | `backend/services/` | `backend/services/AGENTS.md` |
| Backend GraphQL/Pothos | `backend/graphql/` | `backend/graphql/AGENTS.md` |
| Database Repositories | `backend/db/repo/` | `backend/db/repo/AGENTS.md` |
| Database Seeds | `backend/db/seeds/` | `backend/db/seeds/AGENTS.md` |
| Backend Types | `backend/types/` | `backend/types/AGENTS.md` |

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

### Database Testing Critical Rules
- **ALWAYS use `runInRollback` wrapper** for database tests
- **ALWAYS pass `tx` to ALL repository methods** inside transactions - mixing `tx` queries with `db`-backed repo calls causes deadlocks
- **NEVER use `expect(...).rejects.toThrow()` inside `runInRollback`** - causes deadlocks. Use try/catch helper pattern instead
- **NEVER query seed data** - always create test data using helpers in `entity-setup.ts`
- Verify entity-setup helper signatures before use - they vary significantly

### GraphQL Document Conventions
- Documents live in `frontend/graphql/sharedDocuments/<domain>.documents.ts`
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
- All user-facing error messages must use `next-intl` via `getBackendTranslations`
- Accept optional `locale?: string` parameter in services/repositories
- Never hardcode error strings

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

`bun run lint` is heavyweight and **MUST NOT be run concurrently** by multiple sub-agents — it causes resource contention and intermittent failures. Instead, use the **lint queue server** which serializes all lint requests through a single process.

### Starting the server

Before dispatching any sub-agents that will run lint, start the queue server as a background process:

```bash
~/.bun/bin/bun run scripts/lint-queue-server.ts
```

This listens on `http://localhost:4777`.

### Submitting lint requests (from sub-agents)

Each sub-agent should **NOT** run `bun run lint` directly. Instead, submit a request to the queue:

**PowerShell (recommended for sub-agents):**
```powershell
$files = @("backend/types/foo.types.ts","frontend/stores/barStore.ts")  # ALL files the sub-agent modified
$body = @{ id = "phase8"; files = $files } | ConvertTo-Json
Invoke-RestMethod -Uri http://localhost:4777/lint -Method POST -ContentType 'application/json' -Body $body
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
- **`bun run lint`** — **ALWAYS use the queue server instead**

## AI Agent Communication Rules

- **NEVER create summary markdown files** (SUMMARY.md, CHANGES.md, REPORT.md, etc.)
- **DO respond in chat** with clear summary of what was done
- Exception: Documentation files that are part of project structure (README.md, CONTRIBUTING.md)

## File Organization

### Frontend
- `frontend/views/dashboard/` - Domain-organized page components
- `frontend/stores/` - Zustand stores (mock stores for Storybook)
- `frontend/components/ui/` - Shared UI components (AppDataGrid, MetricCard, PageContainer, etc.)
- `frontend/graphql/sharedDocuments/` - GraphQL documents by domain
- `frontend/graphql/generated/` - Auto-generated types (do not edit)

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
- `frontend/graphql/test/` - GraphQL integration tests (use testClient, not raw fetch)
- `test/ui/components/` - Component tests
- `test/ui/e2e/` - End-to-end tests

## Important References

- `frontend/COMPONENT_PATTERNS.md` - Dashboard UI patterns
- `frontend/IMPLEMENTATION_LEARNINGS.md` - Error resolutions from past mistakes
- `frontend/NEW_PAGE_WORKFLOW.md` - Required workflow for new pages
- `frontend/THEME_PALETTE.md` - Color tokens and access patterns
- `docs/IDEMPOTENCY.md` - Idempotency patterns
- `.github/CODE_REVIEW_CHECKLIST.md` - Code review guidelines
