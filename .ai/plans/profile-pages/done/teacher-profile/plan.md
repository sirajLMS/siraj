# Plan — Teacher Profile

References: [spec.md](./spec.md), depends on [shared-shell](../shared-shell/plan.md)

## Architecture

```
TeacherProfileContainer
  ├── ProfileShell (shared-shell)
  ├── TeacherProfileView (view mode)
  │     ├── AccountSection
  │     ├── ContactSection
  │     ├── CompensationSection (read-only own)
  │     ├── StatsSection
  │     └── AdminOnlySection (scope=other)
  └── TeacherProfileEditForm (edit mode)
        ├── CoreFieldsSection (name, email, avatar)
        ├── ContactEditSection
        └── AdminTeacherEditForm (scope=other, full fields)
```

## File paths

| Action | Path |
|--------|------|
| Extend | `frontend/views/profile/teacher/TeacherProfileContainer.tsx` |
| Extend | `frontend/views/profile/teacher/TeacherProfileView.tsx` |
| Extend | `frontend/views/profile/teacher/TeacherProfileEditForm.tsx` |
| Create | `frontend/views/profile/teacher/sections/AccountSection.tsx` |
| Create | `frontend/views/profile/teacher/sections/AdminOnlySection.tsx` |
| Create | `frontend/views/profile/teacher/sections/CompensationSection.tsx` |
| Create | `frontend/views/profile/teacher/sections/StatsSection.tsx` |
| Create | `frontend/views/profile/teacher/TeacherAdminEditForm.tsx` |
| Migrate from | `frontend/views/dashboard/teachers/profile/` (admin form patterns) |

## Data flow

GraphQL endpoints only — [DATA_POLICY.md](../DATA_POLICY.md).

- Query: `profileByUserId` → `teacherOwnProfile` (scope=own) or `teacherAdminProfile` (scope=other)
- Own mutation: `updateOwnProfile({ core, teacher: { phone, zoomLink } })`
- Admin mutation: `updateUserProfile({ core, teacher: TeacherProfileUpdateInputType })`

## GraphQL gaps to close

- Ensure `updateUserProfile.teacher` returns all admin fields after mutation
- Consider exposing `zoomPassword` as set-only field (never return plaintext)

## i18n

Namespace: `profile.teacher.*` — extend `shared/messages/types/profile.ts`

## Migration

- Deprecate `frontend/views/dashboard/teachers/own-profile/` after parity
- Redirect `/teachers/me/profile` already points to `/profile`
- Admin teacher dashboard profile can redirect to `/users/[userId]/profile`

## Risks

- Admin edit form complexity — migrate from dashboard in slices
- Encrypted nationalId/zoomPassword display — mask in view, set-new in edit

## Layer pipeline

Follow [LAYER_PIPELINE.md](../LAYER_PIPELINE.md) in order:

| Step | Layer | Files |
|------|-------|-------|
| 1 | Types | `backend/types/profile.types.ts`, `backend/types/teacher.types.ts` |
| 2 | Services | `backend/services/profile/profile.service.ts`, `backend/services/teacher/` |
| 3 | Pothos | `backend/graphql/pothos/profile.pothos.ts` |
| 4 | GraphQL ops | `backend/graphql/query/profile.query.ts`, `mutation/profile.mutation.ts` |
| 5 | Codegen | `bun run generate:gqlSchema` → `bun codegen` |
| 6 | Documents | `frontend/graphql/sharedDocuments/profile.documents.ts` |
| 7 | Codegen | `bun codegen` |
| 8 | Frontend types | `frontend/types/` — extend `Operations.ProfileByUserIdQuery` only if needed |
| 9 | i18n | `shared/messages/types/profile.ts`, en, ar |
| 10 | UI | `frontend/views/profile/teacher/` |

No schema/migration/repo changes unless new fields require DB columns.

**Instruction files:** `backend/types/AGENTS.md`, `backend/services/AGENTS.md`, `backend/graphql/AGENTS.md`, `frontend/graphql/sharedDocuments/AGENTS.md`, `frontend/views/AGENTS.md`

## Orchestration & quality

- [ORCHESTRATION.md](../ORCHESTRATION.md) — subagents, plan-review, lint queue
- [VERIFY.md](../VERIFY.md) — gate after each layer in tasks.md
- [GRAPHQL_PATTERNS.md](../GRAPHQL_PATTERNS.md) — client patterns (if UI/GraphQL)
- [stitch-assets/](../stitch-assets/README.md) — local design reference
- Instruction files: `.github/instructions/backend.instructions.md`, `frontend.instructions.md`, `tests.instructions.md`
