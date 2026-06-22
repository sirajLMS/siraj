## Section 1: Core Principles

### 1.1 Do NOT change the user facing requirements
These technical plans are designed to fulfill the exact user story written by the product manager in `.ai/siraj_stories/10.md`. Any technical design decision that alters the user flow, creates unexpected friction, or drops a feature described in the source story is strictly prohibited. The system-automated enforcement of `SUSPENDED` and `ON_LEAVE` must operate exactly as specified.

### 1.2 Database interactions
All database operations must use Drizzle ORM. No raw SQL queries for complex queries unless absolutely necessary (e.g., conditional aggregation logic using `sql\`` with `mapWith(Number)`). All side effects across multiple tables (e.g., freezing classes, updating student status) must be executed within a single database transaction `t` to ensure atomicity.

### 1.3 State management & UI
Components in `frontend/views/` should rely on Apollo Client's `useQuery` hooks for real data fetching. The status tracking view will be migrated from `mockStatusTrackingStore` to real GraphQL data fetching using `statusTrackingScheduleQueryDocument`. All UI state transitions mapping `studentStatus`, `isFrozen`, and `executionState` to the frontend `SessionStatus` must be handled accurately.

### 1.4 Code styling
- Use Bun as the package manager (`~/.bun/bin/bun`).
- Run code quality checks: `bun biome:check`, `bun lint`, `bun tsgo`.
- Code must follow the established architectural layers (Repositories -> Services -> GraphQL Pothos).

### 1.5 Quality Gates
All tasks must pass the following quality gate verbatim:

**Quality Gate — Per-File Validation:**
- [ ] `bun tsgo` on working files passes with 0 TypeScript errors & 0 warnings, after creating/modifying a single file
- [ ] `bun biome:check` on working files passes with 0 errors & 0 warnings, after creating/modifying a single file
- [ ] `bun lint` on working files passes with 0 errors & 0 warnings, after creating/modifying a single file
- [ ] `bun codescene` on working files passes with 0 errors & 0 warnings, after creating/modifying a single file
- [ ] `loop over tsgo, biome:check, lint, codescene` on working files till no issues at all, after creating/modifying a single file

**Quality Gate — Task Completion Validation:**
- [ ] `bun tsgo` on working files passes with 0 TypeScript errors & 0 warnings, after completing all steps
- [ ] `bun biome:check` on working files passes with 0 errors & 0 warnings, after completing all steps
- [ ] `bun lint` on working files passes with 0 errors & 0 warnings, after completing all steps
- [ ] `bun codescene` on working files passes with 0 errors & 0 warnings, after completing all steps
- [ ] `loop over tsgo, biome:check, lint, codescene` on working files till no issues at all, after completing all steps

### 1.6 Authentication & Authorization
New system automated actions must be gated by the new permissions `system.enforce_suspended_lock` and `system.process_student_leave`. These are evaluated intrinsically inside the relevant internal services, invoked by an authorized actor calling `StudentLifecycleService.changeStudentStatus()` (who must possess `student.manage_status`).

### 1.7 Testing Requirements
1. **Repository Layer:** New repository methods (`bulkFreezeStudentClasses`, `bulkUnfreezeStudentClasses`, `getStatusTrackingRows`) must be unit tested in `backend/db/test/repo/scheduling.repository.test.ts`.
2. **GraphQL Integration:** The new `statusTrackingSchedule` query must have integration tests to verify access control (admin authorized, teacher unauthorized) and correct data payload (frozen status, student status).
