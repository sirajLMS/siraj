# Plan — Parent Profile

References: [spec.md](./spec.md), depends on [shared-shell](../shared-shell/plan.md)

## Architecture

```
ParentProfileContainer
  ├── ProfileShell
  ├── ParentProfileView
  │     ├── AccountSection
  │     ├── ContactSection
  │     ├── SocialSection
  │     ├── BillingSection (scope=other)
  │     ├── IdentitySection (scope=other)
  │     └── AssociatedStudentsGrid (inline)
  └── ParentProfileEditForm
        ├── CoreFieldsSection
        ├── ContactSocialEditSection
        └── BillingEditSection (scope=other)
```

## File paths

| Action | Path |
|--------|------|
| Extend | `frontend/views/profile/parent/ParentProfileContainer.tsx` |
| Create | `frontend/views/profile/parent/ParentProfileView.tsx` |
| Create | `frontend/views/profile/parent/ParentProfileEditForm.tsx` |
| Create | `frontend/views/profile/parent/sections/*.tsx` |
| Reuse (layout) | `ParentStudentsDataGrid.tsx` — pass rows from `profileByUserId`; no internal fetch |
| Reuse | `frontend/views/dashboard/parent/profile/ParentProfileDetails.tsx` (layout reference) |

## Data flow

- Query: `profileByUserId` → `parentOwnProfile` or `parentAdminProfile`
- Students: `associatedStudents` nested on `profileByUserId` (GraphQL only — UI never calls services)
- Own mutation: `updateOwnProfile({ core, parent: ParentOwnProfileUpdateInput })`
- Admin mutation: `updateUserProfile({ core, parent: ParentAdminProfileUpdateInput })`

## GraphQL gaps

- Add `associatedStudents` to unified profile return type
- Wire parent admin billing fields in `updateUserProfile` response

## i18n

Namespace: `profile.parent.*`

## Migration

- Deprecate `frontend/views/dashboard/parent/profile/edit/` stub
- Redirect `/parents/[id]/profile` → `/users/[userId]/profile`

## Risks

- Current parent edit submits only own-scope fields for admin — must fix
- Students grid needs pagination on large families

## Layer pipeline

| Step | Layer | Files |
|------|-------|-------|
| 1 | Types | `backend/types/profile.types.ts`, `backend/types/parent.types.ts` |
| 2 | Repository | extend repo for associated students query |
| 3 | Services | `backend/services/profile/profile.service.ts`, `parent-profile.service.ts` |
| 4 | Pothos | `backend/graphql/pothos/profile.pothos.ts` |
| 5 | GraphQL ops | profile query/mutation |
| 6 | Codegen | `generate:gqlSchema` → `codegen` |
| 7 | Documents | `profile.documents.ts` |
| 8 | Codegen | `codegen` |
| 9 | Frontend types | extend gql generated only |
| 10 | i18n | profile.parent.* |
| 11 | UI | `frontend/views/profile/parent/` |

See [LAYER_PIPELINE.md](../LAYER_PIPELINE.md).

## Orchestration & quality

- [ORCHESTRATION.md](../ORCHESTRATION.md) — subagents, plan-review, lint queue
- [VERIFY.md](../VERIFY.md) — gate after each layer in tasks.md
- [GRAPHQL_PATTERNS.md](../GRAPHQL_PATTERNS.md) — client patterns (if UI/GraphQL)
- [stitch-assets/](../stitch-assets/README.md) — local design reference
- Instruction files: `.github/instructions/backend.instructions.md`, `frontend.instructions.md`, `tests.instructions.md`
