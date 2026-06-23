# Appendix: File Creation Summary & Dependencies

### File Creation Summary
The implementation plan involves creating and modifying files across multiple application layers.

**Database & Migration:**
- `backend/db/migration/4-story-12-permissions.sql` (New Migration)
- `shared/lib/enum.ts` (Modified: add new AppPermission enum fields)

**Repositories:**
- `backend/db/repo/learning-resource.repository.ts` (Modified: `deleteResource` method)
- `backend/db/test/repo/learning-resource.repository.test.ts` (Modified: add tests)
- `backend/db/repo/report.repository.ts` (New: `generateAttendanceReport`)
- `backend/db/test/repo/report.repository.test.ts` (New: add tests)

**Services:**
- `backend/services/resource/learning-resource.service.ts` (Modified: `deleteResource`)
- `backend/services/resource/test/learning-resource.service.test.ts` (Modified: add tests)
- `backend/services/report/report.service.ts` (New: `generateAttendanceReport`)
- `backend/services/report/test/report.service.test.ts` (New: add tests)

**GraphQL Backend (Pothos):**
- `backend/graphql/pothos/resource.pothos.ts` (Modified: `deleteLearningResource` mutation)
- `backend/graphql/pothos/report.pothos.ts` (New: query and object types)
- `backend/graphql/pothos/index.ts` (Modified: export report.pothos)

**GraphQL Frontend (Apollo):**
- `frontend/graphql/sharedDocuments/resource.documents.ts` (Modified: `DeleteLearningResourceMutation`)
- `frontend/graphql/sharedDocuments/report.documents.ts` (New: `GenerateAttendanceReportQuery`)
- `frontend/graphql/test/resource.test.ts` (Modified: integration tests)
- `frontend/graphql/test/report.test.ts` (New: integration tests)

**Frontend Views & Stores:**
- `frontend/views/dashboard/resources/components/ResourceCard.tsx` (Modified: delete button + dialog)
- `frontend/views/dashboard/reports/` (New: reporting UI containers and views)
- `shared/messages/en.ts` (Modified: Add translation keys for UI dialogs and reporting fields)

### Task Dependency Graph
The tasks MUST be executed strictly in the following order:

1. **Task A**: Migration & Enum (`backend/db/migration`, `shared/lib/enum.ts`)
2. **Task B**: Resource Repository (`learning-resource.repository.ts`)
3. **Task C**: Resource Service (`learning-resource.service.ts`)
4. **Task D**: Resource Testing (`learning-resource.repository.test.ts`, `learning-resource.service.test.ts`)
5. **Task E**: Reporting Repository (`report.repository.ts`)
6. **Task F**: Reporting Service (`report.service.ts`)
7. **Task G**: Reporting Testing (`report.repository.test.ts`, `report.service.test.ts`)
8. **Task H**: GraphQL Pothos (`resource.pothos.ts`, `report.pothos.ts`)
9. **Task I**: Frontend Documents (`resource.documents.ts`, `report.documents.ts`)
10. **Task J**: GraphQL Integration Tests (`resource.test.ts`, `report.test.ts`)
11. **Task K**: Frontend UI Resource Deletion (`ResourceCard.tsx`)
12. **Task L**: Frontend UI Reporting (`frontend/views/dashboard/reports`)
13. **Task M**: UI Testing & Storybook (`ResourceCard.stories.tsx`, reporting stories)
14. **Task N**: i18n Translations (`shared/messages/en.ts`)
