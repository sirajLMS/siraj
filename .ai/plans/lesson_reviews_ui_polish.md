# Plan: Pending Reviews UI Polish & Global Audit

This plan will polish the **Pending Reviews** UI and ensure consistency across the entire project.

#### 1. Backend & Data Schema (Plumbing)
- **Update Types**: Modify `backend/types/classes/lesson-report.ts` to include `subjectName` and `classAvatarUrl` in `LessonReportReturnType`.
- **Update Repository**: Update `backend/db/repo/classes/lesson-report.ts` to join `classInstances`, `classSubjects`, and `recurringSchedules` to fetch `subjectName` and `classAvatarUrl` in `findPendingReviews` and `findById`.
- **Update Schema**: Add/expose the new fields in `backend/graphql/pothos/classes/lesson-report.pothos.ts`.
- **Sync GraphQL**: Update `frontend/common/graphql/sharedDocuments/classes/lesson-report.documents.ts` and run `bun run generate:gql && bun codegen`.

#### 2. Frontend Logic & State
- **Update ViewModel**: Modify `frontend/common/views/dashboard/supervisor/lesson-reviews/usePendingReviewsViewModel.ts` to handle the new fields and provide them to the views.
- **i18n Support**: Update `shared/locale/types/dashboard/supervisorPortal/pendingReviews.ts` and translations (`en`, `ar`) to include `statusLabels` for `Draft`, `Pending`, `Approved`, `Rejected`.

#### 3. UI Implementation (The Polish)
- **Desktop Grid**: Update `frontend/desktop/views/dashboard/supervisor/lesson-reviews/pendingReviews.desktop.tsx`:
    - Replace plain student/teacher names with `DesktopPersonProfileCell`.
    - Replace text-based actions (Review, Approve, Reject) with `IconButton` + `Tooltip`.
    - Use short status labels (e.g., "Pending") instead of raw enums.
- **Mobile Cards**: Update `frontend/mobile/views/dashboard/supervisor/lesson-reviews/pendingReviews.mobile.tsx`.
- **Detail Panels**: Update both desktop and mobile variants.

#### 4. Global Audit & Consistency
- **Search**: Scan the entire project for datagrid/card cells showing users/classes without `PersonProfileLink`.
- **Refactor**: Replace plain text with `PersonProfileLink` using reusable components.
- **Verification**: Run `tsgo` and `biome` on touched files.
