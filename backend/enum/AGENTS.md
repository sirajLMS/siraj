# Backend Enum Layer

## Purpose

This directory contains all backend enum definitions, organized by domain. Each file follows the `{domain}.enum.ts` naming convention, mirroring the `backend/types/` layer.

## Rules

### Backend-Only
- Enums in this directory are **backend-only**.
- Frontend code must use GraphQL codegen enums from `@/frontend/graphql/generated/gql/graphql-types` instead of importing from `@/backend/enum`.
- Shared layer code (`shared/`) must not import from `@/backend/enum` — shared code is used by both frontend and backend. Define cross-layer enums in `shared/constants/` instead; see `shared/AGENTS.md`.

### Import Convention
- Prefer deep imports: `import { StudentStatus } from "@/backend/enum/student-lifecycle.enum"`.
- The barrel `index.ts` is available for convenience but deep imports are preferred (same pattern as `backend/types/`).

### File Organization
- One file per domain, matching the corresponding `backend/types/{domain}.types.ts` file name.
- Related enums in the same domain go in the same file (e.g., `InvoiceStatus`, `InvoiceType`, `PaymentMethod` in `billing.enum.ts`).
- Const objects like `ALLOWED_STATUS_TRANSITIONS` live alongside their related enum in the domain file.

### Adding New Enums
1. Identify the domain file (or create a new one following the naming convention).
2. Add the enum to the appropriate `{domain}.enum.ts` file.
3. Add the file to `index.ts` if it's a new file.
4. If the enum should be exposed via GraphQL, register it in `backend/graphql/pothos/enum.pothos.ts` and run codegen.
