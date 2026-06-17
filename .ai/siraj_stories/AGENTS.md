# Siraj Stories - Planning & Execution Guidelines for AI Agents

When working on any story or sprint in the `.ai/siraj_stories/` directory, AI Agents **MUST** strictly adhere to the following planning and execution protocol. **Failure to follow these instructions will result in immediate rejection by the user.**

## 1. Deep Context & System Analysis
Before writing any code or proposing an implementation plan, you must perform deep analysis:
- **Do not assume implementation completeness**: Just because a database schema exists does NOT mean the repository, service, or GraphQL definitions exist. You must verify and implement all missing layers.
- **Trace the full stack**: A typical feature involves Drizzle (DB), Domain Services (Backend Logic), Pothos (Backend API), Apollo Documents (Frontend API), Zustand Stores (State), and React Components (Views). You must plan for every single layer.
- **Transitioning from Mock to Real**: 
  - If a story involves features currently existing as mock UI pages or using dummy data/layouts (e.g., mock Zustand stores or mock Navigation configs), you MUST plan a strict migration path to real implementations.
  - This involves hooking up the real backend repositories, real GraphQL queries, transitioning to real Zustand stores with strict typing, migrating the layout wrappers (e.g., `DashboardLayoutContainer`), and completely discarding the mock data.
- **Data Seeding Lifecycle**:
  - Whenever new tables are introduced or new permissions are defined in the sprint, you MUST update the seeders in `backend/db/seeds`.
  - Check the existing permissions in `permission-catalog.ts` and add any missing sprint permissions.
  - Update `seed-permissions.ts` and ensure each new table gets its own `seedOrGet` seeder pattern integrated into `index.ts`.
  - **Schema Synchronization:** You MUST run `bun run scripts/dbActions.ts push` before running `bun run db seed` if you altered any schema files.
  - **Constraints & Enums:** Seed data MUST respect PostgreSQL specific values (e.g., EXACT enum strings like `"ACTIVATED"`) and `CHECK` constraints found in `backend/db/schema/*.ts`.
  - **Drizzle Safety:** Use standard `db.select().from(table)` in seeders rather than relational queries to avoid complex generic type errors. If strict `Entity` types are unavailable for dependency injection, create new types under `backend/types/` in the specified type file (one type per table) and update `backend/types/index.ts` if needed, rather than using inline types or `any`.

## 2. Planning Requirements
Your implementation plan (`implementation_plan.md`) must be hyper-detailed and strictly follow this specific structure:

### Section 1: Core Principles & Strict Rules
List out all architectural rules and constraints explicitly at the top of your plan. This serves as a checklist.
- Explicitly declare the ban on generic monolithic services.
- Explicitly declare the ban on dummy data in the backend.
- Reiterate that `~/.bun/bin/bun` must be used for everything.
- Demand the `id` field in all GraphQL responses.
- Explicitly mention `useQuery` usage and stateful handling.
- Explicitly state `import { logger }` must be used over `console.*`.
- Reiterate the ban on `SUMMARY.md` or `REPORT.md`.
- **CRITICAL:** Explicitly state the exact permissions extracted from the current sprint file (e.g., `0.md`) that will be used for RBAC. You must read the sprint file and apply ONLY the permissions defined within it.

### Section 2: Granular Task Breakdown
Break down the work into lettered tasks (Task A, Task B, etc.). For each task, you MUST specify:
- **Target File(s)**: The exact paths to the files being created or modified.
- **Action Plan**: Numbered, step-by-step instructions. 
  - **CRITICAL RULE ON DETAIL**: The plan MUST be extremely detailed. Do not use generic phrases like "implement the frontend component" or "add the GraphQL query." You MUST write out the exact Drizzle queries, explicit Pothos configurations, exact Apollo GraphQL tags, and describe the precise TypeScript types and React hooks involved. Never skip details, never use pseudo-code, and never summarize. A generic plan is an immediate failure.

### Section 3: Strict Verification & Integrity Protocol
At the bottom of the plan, list the exact terminal commands you will run to verify the code without asking for permission (e.g., `~/.bun/bin/bun run generate:gqlSchema`, `~/.bun/bin/bun codegen`, `~/.bun/bin/bun tsgo`, `~/.bun/bin/bun run lint`).

## 3. Strict Layer Architecture Constraints

### A. Database Layer (`backend/db/repo/`)
- **Drizzle Constraints**: Due to strict TypeScript inference limits, you must **avoid** using `db.query.tableName.findMany` with deeply nested `with` relations if it generates `SQL<unknown>` or property missing errors.
- **Solution**: Use standard SQL-like syntax: `db.select().from(table).leftJoin(...)` and map the results manually.

### B. Service Layer (`backend/services/`)
- **Domain-Driven Design**: Services must be scoped to their domain (e.g., `ScheduleService`, `PermissionsService`). 
- **NO Monoliths**: Never create a generic `DashboardService` or `AppService`. 
- **Business Logic Hub**: All orchestration, mapping, and permission checks must live here, not in the repositories or GraphQL resolvers.

### C. Backend GraphQL Layer (`backend/graphql/pothos/`)
- **Nullability**: Pothos fields are `nullable: false` by default. Define `nullable: true` explicitly if the DB allows nulls.
- **Delegation**: Resolvers must delegate complex logic to the `backend/services/` layer.
- **Cache Compliance**: Every object returned MUST expose an `id` field to allow the Frontend Apollo Client to automatically update its cache.

### D. Frontend GraphQL Layer (`frontend/graphql/`)
- **Codegen Lifecycle**: After editing `*.pothos.ts` or `*.documents.ts`, you **MUST** run:
  1. `bun run generate:gqlSchema`
  2. `bun codegen`
- **Hook Restrictions**: You are **BANNED** from using `useLazyQuery`. You must exclusively use stateful `useQuery`.
- **Apollo Setup**: Imports must come from `@apollo/client/react` (e.g., `import { useQuery } from "@apollo/client/react"`).

### E. Frontend Stores (`frontend/stores/`)
- **Zustand Types**: Stores must strictly use the generated GraphQL types from `frontend/graphql/generated/gql/graphql-types.ts` (e.g., `User`).
- **NO Mapping**: Do not create intermediate typescript mappings. Fix type mismatches by updating the backend DB/GraphQL schema and regenerating, so you can directly assign `setUser(data.me as User)`.

### F. Frontend Views (`frontend/views/`)
- **Functional React**: Functional components only. No classes.
- **Sprint-Specific RBAC Enforcement**: Any component requiring specific access MUST be wrapped in the `<RequirePermission permissions={["domain.action"]} />` wrapper. You MUST read the target sprint file (e.g., `0.md`) to extract the EXACT permissions bound to the current features being developed and use those explicit permission strings in the wrappers.
- **Mock Data & Dummy Views Ban (Production)**: Mock data, dummy layouts, and placeholder views are strictly forbidden in production application code. Whenever a sprint involves a dummy page, you MUST migrate it fully to real components, replacing mock queries with real stateful Apollo hooks (`useQuery`) linked to the real generated backend types.
- **Storybook Exception**: While mock data is banned in production, you **MUST KEEP AND USE** dummy data, mock stores, and mock layouts for Storybook files (`*.stories.tsx`). Storybooks are critical for isolated component testing and design, and they must remain entirely decoupled from real Apollo queries and real database states. Do not delete mock data if it is used by a `.stories.tsx` file.

### G. Backend Localization & next-intl (`backend/`)
- **No Hardcoded Errors/Messages**: Hardcoded user-facing error strings, warnings, or messages are strictly forbidden in all repositories, services, and GraphQL resolvers.
- **Translation Helper**: Always use the translation helper utility `getBackendTranslations({ locale?: string, namespace?: string })` (which wraps `next-intl/server`'s `getTranslations`).
- **Locale Propagation**: Ensure the locale is propagated through parameter signature (e.g. `locale?: string`) down from the GraphQL resolver context (`ctx.locale`) into the services and then to the repositories.
- **Graceful Fallback**: If called outside of a Next.js HTTP request context (e.g. in test suites, seeders, or scripts), next-intl should gracefully fall back to the default locale `"ar"` (or the requested locale).

## 4. Final Validation
- You must ensure the project passes strict TypeScript compilation by running `bun tsgo`. Do not leave unresolved type errors.

