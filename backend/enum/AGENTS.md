# Backend Enum Layer

## Purpose

This directory contains all backend enum definitions, organized by domain. Each sub-directory groups related enum files and ships its own `index.ts` barrel. This mirrors the sub-directory layout of the `backend/types/` layer.

## Layout

```
backend/enum/
├── index.ts             (top-level barrel — re-exports every sub-directory)
└── <domain>/            one sub-directory per domain, each with its own barrel
```

Each sub-directory contains its own `index.ts` barrel that re-exports every `*.enum.ts` file in that sub-directory. The top-level `backend/enum/index.ts` re-exports every sub-directory barrel.

## Rules

### Backend-Only
- Enums in this directory are **backend-only**.
- Frontend code must use GraphQL codegen enums from `@/frontend/common/graphql/generated/gql/graphql` instead of importing from `@/backend/enum`.
- Shared layer code (`shared/`) must not import from `@/backend/enum` — shared code is used by both frontend and backend. Define cross-layer enums in `shared/constants/` instead; see `shared/AGENTS.md`.

### Import Convention
- Prefer deep imports: `import { SomeEnum } from "@/backend/enum/<subdir>/<entity>.enum"`.
- The barrel `index.ts` is available for convenience but deep imports are preferred (same pattern as `backend/types/`).

### File Organization
- One file per logical domain, grouped under the matching sub-directory.
- Related enums in the same domain go in the same file.
- Const objects derived from an enum (allowed transitions, lookup maps) live alongside the enum in the domain file.
- File naming follows the convention `backend/enum/<subdir>/<entity>.enum.ts`.

### Adding New Enums
1. Identify the appropriate sub-directory (or create a new one following the sub-directory convention).
2. Add the enum to the matching `<entity>.enum.ts` file in that sub-directory (create a new file if needed).
3. If a new file was created, add `export * from "./<entity>.enum";` to the sub-directory's `index.ts`.
4. If a new sub-directory was created, add `export * from "./<subdir>";` to the top-level `backend/enum/index.ts`.
5. If the enum should be exposed via GraphQL, register it in `backend/graphql/pothos/shared/enum.pothos.ts` and run codegen.

### Extending Existing Enums
- Add values to an existing `pgEnum` via idempotent `ALTER TYPE … ADD VALUE` migration SQL plus the enum source file — never create a parallel new enum.
- Cross-layer values (needed by frontend/shared) belong in `shared/constants/`, with `backend/enum/` re-exporting per the cross-layer migration rules.

## Linting Rules

- NEVER use `oxlint-disable` comments; fix Oxlint & ESLint/sonarjs findings at the root cause.
