# Wave 4 — Task Group 13: Storybook Stories — Outcome

## Summary

All 8 Storybook story files for the Quota UI have been created and pass the full codescene lifecycle quality check (tsgo → oxlint → biome → lint:type-aware → duplicates → codescene).

## Files Created

### Billing Container Stories (Tasks 13.1–13.4)

| File | Stories | Mocks |
|------|---------|-------|
| `frontend/common/views/dashboard/billing/quota/QuotaContainer.stories.tsx` | Default, Loading, Empty, ErrorState | `quotasQueryDocument`, `deleteQuotaMutationDocument` |
| `frontend/common/views/dashboard/billing/quota/QuotaDetailContainer.stories.tsx` | Default, Loading, NotFound, ErrorState | `quotaQueryDocument`, `quotaLedgerQueryDocument`, `deleteQuotaMutationDocument` |
| `frontend/common/views/dashboard/billing/quota/QuotaFormContainer.stories.tsx` | Default (create), Edit, ValidationErrors | `createQuotaMutationDocument`, `updateQuotaMutationDocument`, `quotaQueryDocument` |
| `frontend/common/views/dashboard/billing/quota/QuotaInsightsContainer.stories.tsx` | Default, Loading, Empty, ErrorState | `quotasQueryDocument` |

### Audience View Stories (Task 13.5)

| File | Stories | Mocks |
|------|---------|-------|
| `frontend/common/views/dashboard/students/quota/audience/StudentQuotaView.stories.tsx` | Default, Loading, Empty, ErrorState, Exhausted | `studentQuotasQueryDocument`, `quotaLedgerQueryDocument` |
| `frontend/common/views/dashboard/students/quota/audience/ParentQuotaView.stories.tsx` | Default, Loading, Empty | `parentAssociatedStudentsQueryDocument`, `studentQuotasQueryDocument`, `quotaLedgerQueryDocument` |
| `frontend/common/views/dashboard/students/quota/audience/TeacherQuotaView.stories.tsx` | Default, Empty | `teacherAssignedStudentsQueryDocument` |
| `frontend/common/views/dashboard/students/quota/audience/SupervisorQuotaView.stories.tsx` | Default, Loading, Empty, ErrorState, AllStudentsOverview | `quotasQueryDocument` |

## Patterns Used

- **CSF 3.0**: `satisfies Meta<typeof Component>` with `Meta` and `StoryObj` from `@storybook/nextjs-vite`
- **MockedProvider**: From `@apollo/client/testing/react` — wraps each story in Apollo mock state
- **Loading state**: Empty `mocks={[]}` array — Apollo stays in loading state indefinitely
- **Error state**: `error: new Error("...")` in the mock result — triggers Apollo error handling
- **Zustand store seeding**: `useUserStore.setState({ role, permissions, user })` — sets the role and user for the audience view switcher
- **Story naming**: `ErrorState` (not `Error`) used as export name to avoid shadowing the global `Error` constructor — TypeScript `TS2448` resolution
- **Label mocking**: Complete `StudentQuotaLabels` mock objects with all fields from `shared/locale/types/dashboard/students/quota.ts` including function fields (`expiryWarning`, `remainingOfTotal`, `lastEditedAt`, `quotaCount`)

## Quality Verification

All 8 files passed `sub-loop.ts --lifecycle codescene`:
```
✅ tsgo passed
✅ oxlint passed
✅ biome:check passed
✅ lint:type-aware passed
✅ check:duplicates passed
✅ codescene passed
```

## Notes

- Pre-existing tsgo warnings in `test/ui/components/quota/` test files (unused `mobileProps`/`desktopProps` variables) are not related to this task group and were not modified.
- The `StudentQuotaContainer.stories.tsx` file in `frontend/common/views/dashboard/students/quota/` (pre-existing minimal story) was left untouched — new audience stories are co-located with their respective components in the `audience/` subdirectory per the task specification.
