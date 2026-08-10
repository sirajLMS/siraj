# Shared Types Pattern (Cross-Layer Type Definitions)

When a type definition is used by both backend and frontend, it MUST live in `shared/types/` to avoid cross-layer duplication.

## Why This Pattern Exists

Before this pattern, identical type definitions existed in both `backend/types/` and `frontend/common/.../types/`. For example, the notification-alerts interface (65 lines) was duplicated in:
- `backend/types/notifications/notification-alerts.metadata.types.ts`
- `frontend/common/views/dashboard/components/navbar/notifications/types/notificationDrawer.types.ts`

This created a risk of type drift — if one definition was updated, the other could become stale.

## The Pattern

### Structure

```
shared/types/
  <domain>.types.ts    # Canonical type definition (accessible from all layers)
```

### Import Rules

- Backend imports: `import type { X } from "@/shared/types/<domain>"`
- Frontend imports: `import type { X } from "@/shared/types/<domain>"`
- Both layers import from the SAME canonical file

### Layer Isolation

- `shared/` layer MAY be imported by both `backend/` and `frontend/`
- `backend/` layer MUST NOT import from `frontend/`
- `frontend/` layer MUST NOT import from `backend/`
- `shared/` layer MUST NOT import from `backend/` or `frontend/`

## Rules

- MUST place cross-layer types in `shared/types/`
- MUST use `import type` for type-only imports
- MUST NOT duplicate type definitions across layers
- MUST NOT place cross-layer types in `backend/types/` or `frontend/.../types/`

## Example (Task 1.8)

Created `shared/types/notification-alerts.types.ts` with the shared 65-line interface. Both backend and frontend now import from this canonical location.

## Related Documents

- `shared/AGENTS.md`
- `backend/types/AGENTS.md`
- `.ai/plans/duplications/outcome/1.8-notification-types-shared-outcome.md`
