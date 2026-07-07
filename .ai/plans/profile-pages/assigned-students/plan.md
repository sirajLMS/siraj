# Plan — Assigned Students

References: [spec.md](./spec.md), depends on [teacher-profile](../teacher-profile/plan.md), [shared-shell](../shared-shell/plan.md)

## Architecture

```
TeacherProfileContainer (tab=students, scope=other)
  └── AssignedStudentsTab
        ├── GradeFilterBar
        ├── AssignedStudentsDataGrid (desktop)
        ├── AssignedStudentsCardList (mobile)
        └── PaginationFooter
```

## File paths

| Action | Path |
|--------|------|
| Create | `frontend/views/profile/teacher/students/AssignedStudentsTab.tsx` |
| Create | `frontend/views/profile/teacher/students/AssignedStudentsDataGrid.tsx` |
| Create | `frontend/views/profile/teacher/students/AssignedStudentsCardList.tsx` |
| Reuse | `TeacherAssignedStudentsResult` from `backend/types/teacher.types.ts` |
| Backend only | Teacher service/repo method — exposed via Pothos resolver, never called from UI |

## Data flow

- Extend `profileByUserId` with `assignedStudents: { rows, totalCount }` (GraphQL field on unified profile)
- Tab lazy-load (if needed): dedicated GraphQL query document + `useQuery` with `skip` — backend loads via service in resolver only

## GraphQL

- Add `assignedStudents` nested field on unified profile (teacher admin only)

## i18n

Namespace: `profile.students.*`

## Risks

- Performance with large assignment lists — server pagination required

## Layer pipeline

| Step | Layer | Files |
|------|-------|-------|
| 1 | Types | `TeacherAssignedStudentsResult` (exists in teacher.types.ts) |
| 2 | Services | extend ProfileService or TeacherPortalService |
| 3 | Pothos | `assignedStudents` on unified profile |
| 4–9 | Codegen + Documents | profile.documents.ts |
| 10 | UI | `frontend/views/profile/teacher/students/` |

See [LAYER_PIPELINE.md](../LAYER_PIPELINE.md).

## Orchestration & quality

- [ORCHESTRATION.md](../ORCHESTRATION.md) — subagents, plan-review, lint queue
- [VERIFY.md](../VERIFY.md) — gate after each layer in tasks.md
- [GRAPHQL_PATTERNS.md](../GRAPHQL_PATTERNS.md) — client patterns (if UI/GraphQL)
- [stitch-assets/](../stitch-assets/README.md) — local design reference
- Instruction files: `.github/instructions/backend.instructions.md`, `frontend.instructions.md`, `tests.instructions.md`
