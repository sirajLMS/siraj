# Shared Layer Rules

## Purpose

The `shared/` layer contains code used by **both** frontend and backend: utilities, i18n messages, domain constants, enums, and cross-layer types. It sits below `app/`, `frontend/`, and `backend/` in the dependency graph — nothing in shared may depend on those layers.

## Layer Isolation (CRITICAL)

- **NEVER** import from `@/frontend/**`, `@/backend/**`, or `@/app/**`.
- Enforced by ESLint `no-restricted-imports` in `eslint.config.mjs` for all `shared/**/*.{ts,tsx}` files.
- If shared code needs a value that currently lives in another layer (enum, type, utility), **move or duplicate the canonical definition into `shared/`** and have the other layer import from shared — not the reverse.

### Positive Pattern

```typescript
// shared/lib/social-links.ts
import { isSafeUrl } from "@/shared/lib/safe-url";

// shared/lib/schedule-instance-dashboard-status.ts
import { ClassExecutionState, ClassOutcome } from "@/shared/constants/class-instance-detail.enum";
```

### Negative Pattern (PROHIBITED)

```typescript
import { isSafeUrl } from "@/frontend/lib/safeRedirect";
import { ClassOutcome } from "@/backend/enum";
import type { InvoiceStatus } from "@/frontend/graphql/generated/gql/graphql-types";
```

## Import Convention

- Always use the `@/` path alias — relative `./` or `../` imports are banned (same rule as `app/`, `backend/`, `frontend/`, `test/`, and `scripts/`).
- Prefer deep imports over barrel files: `import { ClassOutcome } from "@/shared/constants/class-instance-detail.enum"`.
- `**/index.ts` barrel files may use relative `./` sibling re-exports by design (ESLint exception).

## File Organization

| Directory | Purpose | Examples |
|-----------|---------|----------|
| `shared/lib/` | Pure utilities and domain logic with no layer deps | `safe-url.ts`, `social-links.ts`, `phone/`, `logger/` |
| `shared/constants/` | Enums and stable domain constants | `class-instance-detail.enum.ts`, `billing-months.ts`, `permission-group.enum.ts` |
| `shared/types/` | Cross-layer TypeScript types | `billing-view.ts` |
| `shared/messages/` | i18n message definitions and label types | `en.ts`, `ar/`, `types/` |
| `shared/utils/` | General helpers | `date-utils.ts`, `storage.utils.ts` |

## Shared Enums

When frontend and backend both need the same enum values:

1. Define the enum in `shared/constants/{domain}.enum.ts` using the same string values as the backend enum.
2. Use dot access in shared code and tests: `ClassOutcome.PENDING`, `SystemPermissionGroupSlug.SUPER_ADMIN`.
3. Keep `@/backend/enum` for backend-only code; backend services/repos import from there.
4. Frontend should use GraphQL codegen enums for API-facing types, or import from `@/shared/constants/` when shared logic requires the same values.
5. **Never** import `@/backend/enum` from `shared/` — see `backend/enum/AGENTS.md`.

## Extracting Code Into Shared

When moving logic from `frontend/` or `backend/` into `shared/`:

1. Place the implementation in the appropriate `shared/` subdirectory (`lib/`, `constants/`, `types/`).
2. Re-export from the original location if existing consumers should keep their import path (e.g. `frontend/lib/safeRedirect.ts` re-exports `isSafeUrl` from `@/shared/lib/safe-url`).
3. Move or define any required enums/types in `shared/` before updating imports in shared files.
4. Run tests for affected shared modules and verify ESLint passes on changed `shared/**` files.

## i18n Message Types

- Message label types in `shared/messages/types/` must not reference frontend view types or GraphQL codegen types.
- Define canonical status/key unions in `shared/types/` or `shared/constants/` and use those in message type definitions.
- Example: `BillingMonthId` lives in `@/shared/constants/billing-months`; `AdminInvoiceStatus` in `@/shared/types/billing-view`.
