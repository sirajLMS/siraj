# Timezone Enhancement — Tasks

Check off as completed. See [plan.md](./plan.md) for phase details.

## Phase 0 — Planning

- [x] Create `spec.md`
- [x] Create `plan.md`
- [x] Create `tasks.md`

## Phase 1 — Codegen + types + libs

- [ ] Add `scripts/generate-iana-timezone-enum.ts`
- [ ] Add `generate:iana-timezones` to `package.json`
- [ ] Run generator → `shared/constants/iana-timezones.ts`
- [ ] Run generator → `backend/enum/timezone.enum.ts`
- [ ] Export from `backend/enum/index.ts`
- [ ] Extend `backend/lib/timezone.ts` (`isValidIanaTimezone`)
- [ ] Add `frontend/lib/timezone.ts`
- [ ] Update `backend/types/user.types.ts`
- [ ] Update `backend/types/teacher.types.ts`
- [ ] Update `backend/types/parent.types.ts`
- [ ] Update `backend/types/teacher-onboarding.types.ts`
- [ ] Update `backend/types/scheduling.types.ts`
- [ ] Update `backend/types/student.types.ts`
- [ ] Update `backend/types/teacher-availability.types.ts`
- [ ] Gate: `bun tsgo`

## Phase 2 — Schema + migration

- [ ] Add `timezone` to `backend/db/schema/users.ts` + CHECK
- [ ] Remove timezone from `backend/db/schema/teachers.ts`
- [ ] Remove timezone from `backend/db/schema/parents.ts`
- [ ] Update `backend/db/schema/students.ts` comment
- [ ] Update `backend/db/migration/timezone_dst_logic.sql`
- [ ] Regenerate Drizzle migrations (8C)
- [ ] Update seeds for `users.timezone`
- [ ] Gate: db tests

## Phase 3 — Repositories

- [ ] `backend/db/repo/user.repository.ts` — updateTimezone
- [ ] `backend/db/repo/teacher.repository.ts`
- [ ] `backend/db/repo/parent.repository.ts`
- [ ] `backend/db/repo/scheduling/shared.ts` — resolveStudentTimezone
- [ ] `backend/db/repo/scheduling/scheduling-queries.repository/daily-schedule.utils.ts`
- [ ] `backend/db/repo/scheduling/recurring.ts`
- [ ] `backend/db/repo/teacher-availability.repository.ts`
- [ ] Gate: `test:db`

## Phase 4 — Services

- [ ] `backend/services/teacher/teacher-onboarding.service.ts`
- [ ] `backend/services/parent/parent-onboarding.service.ts`
- [ ] `backend/services/profile/profile.service.ts`
- [ ] `backend/services/parent/parent-profile.service.ts`
- [ ] `backend/services/staff/staff-profile.service.ts`
- [ ] `backend/services/schedule/recurring-class.service.ts`
- [ ] `backend/services/schedule/schedule.service.ts`
- [ ] `backend/services/teacher/teacher-portal.service.ts`
- [ ] `backend/graphql/utils/class-session.utils.ts`
- [ ] Gate: service tests + `tsgo`

## Phase 5 — Pothos + GraphQL

- [ ] Register `IanaTimezonePothosObject` in `enum.pothos.ts`
- [ ] Update all pothos files with timezone fields
- [ ] Update `schedule.mutation.ts`
- [ ] `bun run generate:gqlSchema` + `bun codegen`
- [ ] Gate: `test:graphql`

## Phase 6 — Frontend documents

- [ ] `profile.documents.ts`
- [ ] `parent-profile.documents.ts`
- [ ] `staff-profile.documents.ts`
- [ ] `schedule.documents.ts`
- [ ] `class-session.documents.ts`
- [ ] `availability-search.documents.ts`
- [ ] `teacher-portal.documents.ts`
- [ ] Re-run codegen

## Phase 7 — UI components

- [ ] `TimezoneSelect.tsx` + stories
- [ ] `TimezoneDisplay.tsx` + stories
- [ ] Export from input/display index
- [ ] i18n `ui.timezoneSelect`

## Phase 8 — View usages

- [ ] Teacher onboarding
- [ ] Parent/teacher profiles
- [ ] Recurring class forms
- [ ] CreateRecurringClassDialog
- [ ] Form schemas + hooks
- [ ] Schedule grids (TimezoneDisplay)

## Phase 9 — Verification

- [ ] `bun tsgo`
- [ ] `bun biome:check`
- [ ] Lint queue on touched files
- [ ] `test:db` + `test:graphql`
- [ ] `quality-gate`
