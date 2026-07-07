# Plan — Teacher Banking

References: [spec.md](./spec.md), depends on [teacher-profile](../teacher-profile/plan.md), [shared-shell](../shared-shell/plan.md)

## Architecture

```
TeacherProfileContainer (tab=banking, scope=other only)
  └── TeacherBankingTab
        ├── TeacherBankingView (masked fields)
        ├── TeacherBankingEmptyState
        └── TeacherBankingEdit (or CTA to onboarding flow)
```

## File paths

| Action | Path |
|--------|------|
| Create | `frontend/views/profile/teacher/banking/TeacherBankingTab.tsx` |
| Create | `frontend/views/profile/teacher/banking/TeacherBankingView.tsx` |
| Create | `frontend/views/profile/teacher/banking/TeacherBankingEmptyState.tsx` |
| Reuse | `backend/db/repo/teacher-banking.repository.ts` |
| Reuse | `backend/services/teacher/teacher-onboarding.service.ts` (banking logic) |

## Data flow

- Extend `profileByUserId` with `bankingSummary` (nullable, scope=other + teacher only)
- Tab lazy-load (if needed): dedicated GraphQL query document + `useQuery` with `skip` — still GraphQL endpoint only
- Mask encrypted fields server-side before GraphQL response

## GraphQL

- Add `TeacherBankingSummary` type to profile pothos
- Permission gate: admin only

## i18n

Namespace: `profile.banking.*`

## Risks

- Encrypted field display — never log or expose plaintext in network tab
- Banking immutability rules from `TeacherBankingRepository` must be respected

## Layer pipeline

| Step | Layer | Files |
|------|-------|-------|
| 1 | Types | `TeacherBankingSummaryReturnType` in profile or teacher types |
| 2 | Repository | `teacher-banking.repository.ts` (exists) |
| 3 | Services | mask encrypted fields in ProfileService or banking service |
| 4 | Pothos | `bankingSummary` on unified profile (admin only) |
| 5–9 | Codegen + Documents | extend profile.documents.ts |
| 10 | UI | `frontend/views/profile/teacher/banking/` |

Depends on [teacher-profile](../teacher-profile/) types/pothos being stable.

See [LAYER_PIPELINE.md](../LAYER_PIPELINE.md).

## Orchestration & quality

- [ORCHESTRATION.md](../ORCHESTRATION.md) — subagents, plan-review, lint queue
- [VERIFY.md](../VERIFY.md) — gate after each layer in tasks.md
- [GRAPHQL_PATTERNS.md](../GRAPHQL_PATTERNS.md) — client patterns (if UI/GraphQL)
- [stitch-assets/](../stitch-assets/README.md) — local design reference
- Instruction files: `.github/instructions/backend.instructions.md`, `frontend.instructions.md`, `tests.instructions.md`
