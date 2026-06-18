# Story 1 Implementation Plan — Permissions, Search, Timezones, History & Session Control

**Source story:** `.ai/siraj_stories/1.md` (Part 2, builds on `.ai/siraj_stories/0.md`)  
**Status:** Planning only — do not implement until approved  
**Last updated:** 2026-06-18 (rev 2 — full `classes.*` → `session.*` migration)

---

## Section 1: Core Principles & Strict Rules

### Architectural constraints (checklist)

- [ ] **NO monolithic services.** Use domain services only: `ScheduleService`, `ClassSessionService`, `StudentHistoryService`, `ClassPerformanceService`, `TeacherDashboardService`, `SystemSettingsService`. Never create `DashboardService` or `AppService`.
- [ ] **NO dummy data in backend.** All resolvers delegate to real repositories against PostgreSQL.
- [ ] **Package manager:** Use `~/.bun/bin/bun` for every script, install, test, and codegen command.
- [ ] **GraphQL `id` field:** Every object returned from queries/mutations MUST expose a non-null `id` for Apollo cache compliance.
- [ ] **Frontend hooks:** Use stateful `useQuery` / `useMutation` from `@apollo/client/react` only. **`useLazyQuery` is banned.**
- [ ] **Logging:** Use `import { logger } from '@/backend/lib/logger'` (backend) and `import { logger } from '@/frontend/utils/logger'` (frontend). Never `console.*`.
- [ ] **NO `SUMMARY.md` / `REPORT.md`** files in the repo.
- [ ] **Repositories:** Use `db.select().from(table).leftJoin(...)` — avoid deep `db.query.*.findMany({ with })` when it causes `SQL<unknown>` errors.
- [ ] **Business logic in services only** — not in repositories or GraphQL resolvers.
- [ ] **Localized errors:** All user-facing backend errors via `getBackendTranslations({ locale?, namespace? })`. Propagate `locale` from `ctx.locale` through resolver → service → repository.
- [ ] **Zustand stores:** Types MUST come from `frontend/graphql/generated/gql/graphql-types.ts`. No intermediate mapping layers — fix schema/codegen mismatches at the source.
- [ ] **Production views:** No mock stores in production containers. Mock stores ONLY in `*.stories.tsx` via `Mock*Container` wrappers.
- [ ] **Storybook:** Subcomponents receive data/actions as props so stories never import real Apollo or real stores.
- [ ] **Repo tests:** 100% line+function coverage for every new/touched repository file under `backend/db/test/repo/` per `backend/db/test/AGENTS.md`.
- [ ] **GraphQL integration tests:** New/extended operations tested under `frontend/graphql/test/` per `frontend/graphql/AGENTS.md`.
- [ ] **Seeders:** Every touched table gets `seedOrGet` updates per `backend/db/seeds/AGENTS.md`. Run `bun run scripts/dbActions.ts push` before `bun run db seed` after schema changes.

### Story 1 RBAC permissions (canonical — ONLY these for story wrappers)

Extracted from `.ai/siraj_stories/1.md`:

| Permission key | Group | UI / API gate |
|---|---|---|
| `dashboard.search` | Academy Admin | Admin schedule search input |
| `schedule.view_timezones` | Academy Admin | Your / Teacher / Student time columns + timezone disclaimer |
| `history.view_calendar` | Academy Admin | Student history calendar grid |
| `history.view_details` | Academy Admin | `ClassDetailsModal` on history page |
| `session.override_actions` | Academy Admin | `AdminActionsBar` on `/classes/[id]` |
| `teacher.view_dashboard` | Teacher | Render `TeacherDashboardContainer` |
| `session.activate_class` | Teacher | `SessionActivateButton`, teacher `ActionsPanel` activate |
| `system.enforce_time_window` | System Automated | API-only gate in `ClassSessionService.activate()` |

### Part 1 permissions retained (merged into Academy Admin group)

From `.ai/siraj_stories/0.md`:

- `auth.login`, `auth.view_own_profile`
- `dashboard.view_metrics`, `dashboard.filter_metrics`
- `schedule.view_list`, `schedule.filter_advanced`

### Permission rename policy (Option C — full `classes.*` → `session.*` migration)

**All** `classes.*` permissions are removed from the catalog and re-issued under the `session.*` namespace. This is a **breaking change** across enum, database, seeds, backend services, GraphQL, frontend, Storybook, and navigation config.

#### Complete rename map

| Old key (`classes.*`) | New key (`session.*`) | Old `AppPermission` enum | New `AppPermission` enum |
|---|---|---|---|
| `classes.view_details` | `session.view_details` | `CLASSES_VIEW_DETAILS` | `SESSION_VIEW_DETAILS` |
| `classes.activate` | `session.activate_class` | `CLASSES_ACTIVATE` | `SESSION_ACTIVATE_CLASS` |
| `classes.force_activate` | `session.force_activate` | `CLASSES_FORCE_ACTIVATE` | `SESSION_FORCE_ACTIVATE` |
| `classes.start` | `session.start` | `CLASSES_START` | `SESSION_START` |
| `classes.mark_absent` | `session.mark_absent` | `CLASSES_MARK_ABSENT` | `SESSION_MARK_ABSENT` |
| `classes.request_leave` | `session.request_leave` | `CLASSES_REQUEST_LEAVE` | `SESSION_REQUEST_LEAVE` |
| `classes.admin_leave` | `session.admin_leave` | `CLASSES_ADMIN_LEAVE` | `SESSION_ADMIN_LEAVE` |
| `classes.reschedule` | `session.reschedule` | `CLASSES_RESCHEDULE` | `SESSION_RESCHEDULE` |
| `classes.revert` | `session.revert` | `CLASSES_REVERT` | `SESSION_REVERT` |

#### Story 1 net-new `session.*` permissions (no `classes.*` predecessor)

| New key | Purpose |
|---|---|
| `session.override_actions` | Admin override toolbar (`AdminActionsBar`) — distinct from `session.force_activate` which gates only the force-activate action |
| `session.activate_class` | *(renamed from `classes.activate` — see map above)* |

#### Story 1 net-new non-session permissions

| New key | Namespace |
|---|---|
| `dashboard.search` | `dashboard.*` |
| `schedule.view_timezones` | `schedule.*` |
| `history.view_calendar` | `history.*` |
| `history.view_details` | `history.*` — **not** the same as `session.view_details` |
| `teacher.view_dashboard` | `teacher.*` |
| `system.enforce_time_window` | `system.*` |

#### Permission boundary clarifications after migration

| Permission | Gates |
|---|---|
| `history.view_details` | `ClassDetailsModal` on `/students/[id]/history` (calendar drill-down) |
| `session.view_details` | `/classes/[id]` page — teacher-facing class instance view |
| `session.override_actions` | `AdminActionsBar` on `/classes/[id]` (force activate, stop, generate log, delete) |
| `session.force_activate` | API/service check for force-activate mutation specifically |
| `session.activate_class` | Teacher activate button + standard activation mutation |
| `session.reschedule` | Admin layout branch in `ClassDetailsContainer` (replaces `classes.reschedule` check) |

#### PostgreSQL enum migration strategy

`permissions.key` uses `app_permission` enum (`backend/db/schema/enums.ts` ← `shared/lib/enum.ts`).

1. Remove all `CLASSES_*` values from `AppPermission` enum in `shared/lib/enum.ts`.
2. Add all `SESSION_*` values (migrated + `SESSION_OVERRIDE_ACTIONS`).
3. Run `bun run scripts/dbActions.ts push` — Drizzle generates enum migration.
4. If PostgreSQL cannot drop old enum values in-place, add a one-off SQL migration under `backend/db/migration/` that:
   - `UPDATE permissions SET key = 'session.view_details' WHERE key = 'classes.view_details'` (repeat for each mapping), **or**
   - Truncate and re-run `seed-permissions.ts` if safe for dev environments.
5. Grep entire repo for `classes.` permission string literals and `Classes` / `CLASSES_` enum members — **zero remaining references** before merge.

#### Catalog structure change

Replace `createPermissions("Scheduling", "classes", [...])` in `permission-catalog.ts` with a single `createPermissions("Session", "session", [...])` block containing **all** migrated actions plus `override_actions`. The `classes` resource string is **deleted** from the catalog entirely.

### Teacher dashboard gate

- **`teacher.view_dashboard`** — sole permission to render `TeacherDashboardContainer`.
- **`schedule.view_assigned`** — data scoping only (service layer filters rows to logged-in teacher ID).

### Timezone resolution (documented in schema comments)

```
effective_student_timezone =
  students.timezone_override   -- nullable per-student override
  ?? parents.timezone          -- NEW column on parents
  ?? system_settings key `default_timezone` (fallback, default `UTC`)
```

**NOT** `class_instances.booking_timezone` for display purposes.

### Activation time window (`system_settings`)

- `session_activation_window_before_minutes` — default `5`
- Upper bound: **`scheduled_end_at`** (end-of-duration, no extra after-buffer setting)

### History UX (confirmed — no new routes)

| Feature | Component | Route |
|---|---|---|
| Calendar | `CalendarGrid`, `ClassSessionList`, `MobileWeeklyScroller` | `/students/[id]/history` |
| Session drill-down | `ClassDetailsModal` | Same route (modal, no navigation) |
| Live session control | `ClassDetailsContainer` | `/classes/[id]` |

### Routes (already exist — do not add)

- `app/[locale]/(dashboard)/dashboard/page.tsx`
- `app/[locale]/(dashboard)/classes/[id]/page.tsx`
- `app/[locale]/(dashboard)/students/[id]/history/page.tsx`
- `app/[locale]/(dashboard)/teachers/dashboard/page.tsx` → redirects `?mode=teacher`
- `app/[locale]/(dashboard)/teachers/dashboard/active/page.tsx` → redirects `?mode=teacher-active`

---

## Section 2: Granular Task Breakdown

---

### Task A — Schema: Timezones, Performance, Permissions Enum

**Target files:**

- `backend/db/schema/parents.ts`
- `backend/db/schema/students.ts`
- `backend/db/schema/scheduling.ts` (new `classInstancePerformance` table)
- `backend/db/schema/index.ts`
- `backend/db/schema/enums.ts` (via `shared/lib/enum.ts`)
- `shared/lib/enum.ts`
- `backend/types/class-instance-performance.types.ts` (new)
- `backend/types/index.ts`

**Action plan:**

1. Add to `parents` table:
   ```ts
   timezone: varchar("timezone", { length: 100 }).notNull().default("UTC"),
   ```
   Add CHECK: `is_valid_timezone(${table.timezone})` matching `teachers.ts` pattern.

2. Add to `students` table:
   ```ts
   timezoneOverride: varchar("timezone_override", { length: 100 }),
   ```
   Add table-level comment block:
   ```ts
   /**
    * Student effective timezone for schedule display:
    *   COALESCE(students.timezone_override, parents.timezone, academy default)
    * When timezone_override IS NULL, inherit from parent record.
    * booking_timezone on class_instances is a booking snapshot only — NOT used for UI localization.
    */
   ```
   Add CHECK when non-null: `timezone_override IS NULL OR is_valid_timezone(timezone_override)`.

3. Create `classInstancePerformance` table in `scheduling.ts` (or new `class-performance.ts`):
   ```ts
   export const classInstancePerformance = pgTable("class_instance_performance", {
     id: uuid("id").defaultRandom().primaryKey(),
     classInstanceId: uuid("class_instance_id").notNull().unique()
       .references(() => classInstances.id, { onDelete: "cascade" }),
     engagementScore: integer("engagement_score"),
     assessmentProgress: integer("assessment_progress"),
     assessmentTotal: integer("assessment_total"),
     focusLevel: varchar("focus_level", { length: 50 }),
     sessionHealth: varchar("session_health", { length: 50 }),
     heatmapData: jsonb("heatmap_data").$type<number[]>(),
     latencyMs: integer("latency_ms"),
     authorizationLabel: varchar("authorization_label", { length: 100 }),
     attendanceRate: integer("attendance_rate"),
     avgGrade: varchar("avg_grade", { length: 10 }),
     lastClassDaysAgo: integer("last_class_days_ago"),
     createdAt: timestamp(...).notNull(),
     updatedAt: timestamp(...).notNull(),
   });
   ```

4. Update `shared/lib/enum.ts` `AppPermission`:
   - **Remove** all `CLASSES_*` members (`CLASSES_VIEW_DETAILS`, `CLASSES_ACTIVATE`, `CLASSES_FORCE_ACTIVATE`, `CLASSES_START`, `CLASSES_MARK_ABSENT`, `CLASSES_REQUEST_LEAVE`, `CLASSES_ADMIN_LEAVE`, `CLASSES_RESCHEDULE`, `CLASSES_REVERT`).
   - **Add** all `SESSION_*` members per the full rename map in Section 1.
   - **Add** story net-new: `DASHBOARD_SEARCH`, `SCHEDULE_VIEW_TIMEZONES`, `HISTORY_VIEW_CALENDAR`, `HISTORY_VIEW_DETAILS`, `SESSION_OVERRIDE_ACTIONS`, `TEACHER_VIEW_DASHBOARD`, `SYSTEM_ENFORCE_TIME_WINDOW`.
   - Verify `appPermissionEnum` in `backend/db/schema/enums.ts` still derives from `Object.values(AppPermission)`.

5. Run `~/.bun/bin/bun run scripts/dbActions.ts push` to apply schema + enum migration.

---

### Task B — Permissions Catalog, Seeds & System Settings

**Target files:**

- `backend/db/seeds/permission-catalog.ts`
- `backend/db/seeds/seed-permissions.ts`
- `backend/db/seeds/system-settings.ts`
- `backend/db/seeds/seed-parents.ts`
- `backend/db/seeds/seed-students.ts`
- `backend/db/seeds/seed-class-instances.ts`
- `backend/db/seeds/seed-class-performance.ts` (new)
- `backend/db/seeds/seed-class-status-events.ts` (new, if not exists)
- `backend/db/seeds/index.ts`

**Action plan:**

1. **Delete** the `createPermissions("Scheduling", "classes", [...])` block entirely.

2. **Add** unified session catalog block:
   ```ts
   ...createPermissions("Session", "session", [
     ["view_details", "View class/session instance details page"],
     ["activate_class", "Activate a class within time window"],
     ["force_activate", "Force activate a class (bypass time window)"],
     ["start", "Start a class session"],
     ["mark_absent", "Mark student as absent"],
     ["request_leave", "Request class leave"],
     ["admin_leave", "Admin excused leave on a class"],
     ["reschedule", "Reschedule a class"],
     ["revert", "Revert class to pending state"],
     ["override_actions", "Admin override toolbar on class details page"],
   ]),
   ```
   Plus story additions in their own namespaces:
   ```ts
   ...createPermissions("Dashboard", "dashboard", [["search", "Global search on admin schedule table"]]),
   ...createPermissions("Scheduling", "schedule", [["view_timezones", "View multi-timezone schedule columns"]]),
   ...createPermissions("History", "history", [
     ["view_calendar", "View student class history calendar"],
     ["view_details", "View session metadata in history modal drill-down"],
   ]),
   ...createPermissions("Teacher", "teacher", [["view_dashboard", "Access teacher dashboard"]]),
   ...createPermissions("System", "system", [["enforce_time_window", "Validate activation time window"]]),
   ```

3. Rename `COMMON_CLASS_PERMISSIONS` → `COMMON_SESSION_PERMISSIONS`:
   ```ts
   const COMMON_SESSION_PERMISSIONS = [AppPermission.SESSION_VIEW_DETAILS] as const;
   ```

4. Update `ACADEMY_ADMIN_PERMISSION_KEYS` (replace + merge):
   ```ts
   export const ACADEMY_ADMIN_PERMISSION_KEYS = [
     AppPermission.AUTH_LOGIN,
     AppPermission.AUTH_VIEW_OWN_PROFILE,
     AppPermission.DASHBOARD_VIEW_METRICS,
     AppPermission.DASHBOARD_FILTER_METRICS,
     AppPermission.DASHBOARD_SEARCH,
     AppPermission.SCHEDULE_VIEW_LIST,
     AppPermission.SCHEDULE_FILTER_ADVANCED,
     AppPermission.SCHEDULE_VIEW_TIMEZONES,
     AppPermission.HISTORY_VIEW_CALENDAR,
     AppPermission.HISTORY_VIEW_DETAILS,
     AppPermission.SESSION_OVERRIDE_ACTIONS,
     AppPermission.SESSION_VIEW_DETAILS,
     AppPermission.SESSION_FORCE_ACTIVATE,
     AppPermission.SESSION_RESCHEDULE,
     AppPermission.SESSION_REVERT,
     AppPermission.SESSION_ADMIN_LEAVE,
   ] as const;
   ```

5. Update `TEACHER_DEFAULT_PERMISSION_KEYS` (all `CLASSES_*` → `SESSION_*`):
   ```ts
   export const TEACHER_DEFAULT_PERMISSION_KEYS = [
     AppPermission.AUTH_LOGIN,
     AppPermission.AUTH_VIEW_OWN_PROFILE,
     AppPermission.DASHBOARD_VIEW,
     AppPermission.TEACHER_VIEW_DASHBOARD,
     AppPermission.SCHEDULE_VIEW_ASSIGNED,
     AppPermission.SESSION_ACTIVATE_CLASS,
     AppPermission.SESSION_VIEW_DETAILS,
     AppPermission.SESSION_START,
     AppPermission.SESSION_MARK_ABSENT,
     AppPermission.SESSION_REQUEST_LEAVE,
     AppPermission.RESOURCES_LIST,
   ] as const;
   ```

6. Update `PARENT_DEFAULT_PERMISSION_KEYS` — replace `COMMON_CLASS_PERMISSIONS` with `COMMON_SESSION_PERMISSIONS` and `CLASSES_REQUEST_LEAVE` → `SESSION_REQUEST_LEAVE`:
   ```ts
   export const PARENT_DEFAULT_PERMISSION_KEYS = [
     ...COMMON_DASHBOARD_PERMISSIONS,
     AppPermission.SCHEDULE_VIEW_FAMILY,
     ...COMMON_SESSION_PERMISSIONS,
     AppPermission.SESSION_REQUEST_LEAVE,
     AppPermission.COMPLAINTS_LIST,
   ] as const;
   ```

7. Update `STAFF_DEFAULT_PERMISSION_KEYS` — replace `COMMON_CLASS_PERMISSIONS` with `COMMON_SESSION_PERMISSIONS`.

8. Add `SYSTEM_AUTOMATED_PERMISSION_KEYS = [AppPermission.SYSTEM_ENFORCE_TIME_WINDOW]` and seed a `system_automated` permission group in `seed-permissions.ts` (internal, not assigned to demo users).

9. `seed-permissions.ts`: on conflict, ensure old `classes.*` rows are deleted or migrated — add explicit cleanup:
   ```ts
   await db.delete(permissions).where(inArray(permissions.key, DEPRECATED_CLASSES_KEYS));
   ```
   where `DEPRECATED_CLASSES_KEYS` lists all 9 old `classes.*` enum values (cast as needed during transition).

10. Add to `system-settings.ts`:
   ```ts
   { key: "session_activation_window_before_minutes", value: "5", dataType: "integer", category: "scheduling", ... },
   { key: "default_timezone", value: "UTC", dataType: "string", category: "scheduling", ... },
   ```

11. Update `seed-parents.ts`: set `timezone: "Africa/Cairo"` (or demo-appropriate IANA) on all seeded parents.

12. Update `seed-students.ts`: set `timezoneOverride: null` on default student; add one student with `timezoneOverride: "Europe/London"` to test override chain.

13. Create `seed-class-performance.ts` with `seedOrGet` — one performance row per seeded `class_instances` record used in demos.

14. Seed `class_status_events` for completed instances (for history modal "download logs").

15. Run `~/.bun/bin/bun run db seed`.

---

### Task C — Repository: System Settings

**Target files:**

- `backend/db/repo/system-settings.repository.ts` (new)
- `backend/db/repo/index.ts`
- `backend/db/test/repo/system-settings.repository.test.ts` (new)

**Action plan:**

1. Create namespace `SystemSettingsRepository`:
   ```ts
   export async function getByKey(key: string, tx?: DBTransaction): Promise<SystemSettingSelectType | null>
   export async function getIntValue(key: string, defaultValue: number, tx?: DBTransaction): Promise<number>
   export async function getStringValue(key: string, defaultValue: string, tx?: DBTransaction): Promise<string>
   ```

2. `getIntValue`: parse `value` as integer; return `defaultValue` if missing.

3. Write tests with `runInRollback` — cover: existing key, missing key (default), invalid integer fallback.

4. Verify: `~/.bun/bin/bun run test:coverage backend/db/test/repo/system-settings.repository.test.ts` → 100%.

---

### Task D — Repository: Timezone Helper + Scheduling Extensions

**Target files:**

- `backend/db/repo/scheduling.repository.ts`
- `backend/lib/timezone.ts` (new — pure formatting helpers)
- `backend/db/test/repo/scheduling.repository.test.ts` (extend or create)

**Action plan:**

1. Add `resolveStudentTimezone(studentId, tx?, locale?)`:
   ```ts
   const [row] = await tx
     .select({
       override: students.timezoneOverride,
       parentTimezone: parents.timezone,
     })
     .from(students)
     .innerJoin(parents, eq(students.parentId, parents.id))
     .where(eq(students.id, studentId))
     .limit(1);
   return row?.override ?? row?.parentTimezone ?? await SystemSettingsRepository.getStringValue("default_timezone", "UTC", tx);
   ```

2. Add `formatInstantInTimezone(iso: Date, ianaTimezone: string): string` in `backend/lib/timezone.ts` using `Intl.DateTimeFormat` or a tested formatter.

3. Extend `getDailySchedule` signature:
   ```ts
   export async function getDailySchedule(
     date: Date,
     options?: {
       teacherId?: string;
       search?: string;
       viewerTimezone?: string;
       locale?: string;
     },
     tx?: DBTransaction
   )
   ```

4. Search implementation (server-side, requires caller to have gated `dashboard.search`):
   ```ts
   import { fullTextSearch } from "@/backend/db/query.extensions";
   // Join students + teacher users for name search
   const nameSearchCondition = search
     ? or(
         fullTextSearch(sql`COALESCE(${students.name}, '')`, search, "simple"),
         fullTextSearch(sql`COALESCE(${users.name}, '')`, search, "simple")
       )
     : undefined;
   ```
   Apply in `where(and(baseConditions, nameSearchCondition))`.

5. Map each row to include computed fields:
   ```ts
   {
     ...classInstance,
     student, teacher,
     yourTimeFormatted: formatInstantInTimezone(scheduledStartAt, viewerTimezone),
     teacherTimeFormatted: formatInstantInTimezone(scheduledStartAt, teacher.timezone),
     studentTimeFormatted: formatInstantInTimezone(scheduledStartAt, await resolveStudentTimezone(studentId)),
     durationMinutes: classInstance.durationMinutes,
     status: mapExecutionToUiStatus(classInstance),
   }
   ```

6. Add `getClassInstanceById(id, locale?)` — join student, teacher, parent, performance; return full detail shape.

7. Add state transition methods:
   - `activateClassInstance(id, actorUserId, { force: boolean }, tx?, locale?)`
   - `stopClassInstance(id, actorUserId, tx?, locale?)`
   - `softDeleteClassInstance(id, actorUserId, tx?, locale?)`
   - Each inserts `class_status_events` row with `from_state`/`to_state` JSONB.

8. Write/extend repo tests — 100% coverage on all new methods. Use `setupTeacher`, `setupStudent`, `teacherAssignments` before booking per `AGENTS.md`.

---

### Task E — Repository: Class Performance

**Target files:**

- `backend/db/repo/class-performance.repository.ts` (new)
- `backend/db/test/repo/class-performance.repository.test.ts` (new)

**Action plan:**

1. Methods:
   ```ts
   getByClassInstanceId(classInstanceId, tx?)
   upsertForClassInstance(classInstanceId, input, tx?)
   ```

2. Tests: get existing, get missing (null), upsert insert, upsert update.

3. Coverage: 100%.

---

### Task F — Repository: Student History

**Target files:**

- `backend/db/repo/student-history.repository.ts` (new)
- `backend/db/test/repo/student-history.repository.test.ts` (new)

**Action plan:**

1. `getMonthlyCalendar(studentId, year, month, locale?)`:
   ```ts
   // SELECT class_instances WHERE studentId = ? AND scheduled_start_at in month range
   // Return Map<dayOfMonth, SessionSummary>
   ```
   SessionSummary: `{ id, title, time, duration, status, instructor, timeSlot, room, notes }` mapped from `class_instances` + teacher name + `remarks`.

2. `getMonthlyMetrics(studentId, year, month)`:
   ```ts
   // totalClasses, attendanceRate, hoursStudied, performance (from performance table aggregate or avgGrade)
   ```

3. `getSessionDetail(classInstanceId, locale?)` — for `ClassDetailsModal`.

4. Tests: empty month, month with sessions, metrics calculation, detail fetch.

5. Coverage: 100%.

---

### Task G — Service Layer

**Target files:**

- `backend/services/schedule/schedule.service.ts`
- `backend/services/session/class-session.service.ts` (new)
- `backend/services/history/student-history.service.ts` (new)
- `backend/services/performance/class-performance.service.ts` (new)
- `backend/services/teacher/teacher-dashboard.service.ts` (new)
- `backend/services/system/system-rules.service.ts` (new)

**Action plan:**

1. **ScheduleService.getDailySchedule** — add permission gates:
   ```ts
   await PermissionsService.hasPermission(userId, AppPermission.SCHEDULE_VIEW_LIST);
   if (search) {
     await PermissionsService.hasPermission(userId, AppPermission.DASHBOARD_SEARCH);
   }
   const viewerTimezone = await resolveViewerTimezone(userId); // from user profile or parents/teachers
   const list = await SchedulingRepository.getDailySchedule(date, { teacherId, search, viewerTimezone, locale });
   return list.map(item => ({ id: item.id, ... }));
   ```

2. **ClassSessionService.activate(userId, classInstanceId, locale?)**:
   ```ts
   await PermissionsService.hasPermission(userId, AppPermission.SESSION_ACTIVATE_CLASS);
   const instance = await SchedulingRepository.getClassInstanceById(classInstanceId, locale);
   await SystemRulesService.assertActivationTimeWindow(instance); // checks SYSTEM_ENFORCE_TIME_WINDOW logic
   // window: now >= scheduledStartAt - beforeMinutes AND now <= scheduledEndAt
   // on fail: throw getBackendTranslations({ locale, namespace: "errors" })("missedClassTime")
   return SchedulingRepository.activateClassInstance(classInstanceId, userId, { force: false }, undefined, locale);
   ```

3. **ClassSessionService.forceActivate(userId, classInstanceId, locale?)** — gate on `SESSION_OVERRIDE_ACTIONS` **and** `SESSION_FORCE_ACTIVATE` (toolbar visible with override_actions; mutation enforces force_activate).

4. **ClassSessionService.stop / delete / start / markAbsent / requestLeave / adminLeave / reschedule / revert** — each method gates on its corresponding `SESSION_*` permission (`SESSION_START`, `SESSION_MARK_ABSENT`, `SESSION_REQUEST_LEAVE`, `SESSION_ADMIN_LEAVE`, `SESSION_RESCHEDULE`, `SESSION_REVERT`).

5. **ClassSessionService.stop / delete** — gate on `SESSION_OVERRIDE_ACTIONS` for admin paths.

6. **StudentHistoryService** — gate `HISTORY_VIEW_CALENDAR` for calendar/metrics; `HISTORY_VIEW_DETAILS` for session detail.

7. **TeacherDashboardService.getDashboard(userId, date, mode, locale?)**:
   ```ts
   await PermissionsService.hasPermission(userId, AppPermission.TEACHER_VIEW_DASHBOARD);
   await PermissionsService.hasPermission(userId, AppPermission.SCHEDULE_VIEW_ASSIGNED);
   const teacherId = await TeacherRepository.getTeacherIdByUserId(userId);
   // return metrics, scheduleRows (with zoomMeetingUrl, activateEnabled computed from time window), progressFeed
   ```

8. **TeacherDashboardService.createManualEntry(userId, input, locale?)** — creates ad-hoc `class_instances` row for teacher's assigned student.

9. **TeacherDashboardService.logSupportRequest(userId, input, locale?)** — inserts into `complaints` or `admin_audit_logs` with category `TEACHER_SUPPORT`.

10. **TeacherDashboardService.getHandbookDownloadUrl(userId, locale?)** — query `site_content` slug `teacher-handbook` or `resources` table; return signed URL via `StorageRepository`.

---

### Task H — GraphQL Pothos Types & Resolvers

**Target files:**

- `backend/graphql/pothos/schedule.pothos.ts`
- `backend/graphql/pothos/class-session.pothos.ts` (new)
- `backend/graphql/pothos/student-history.pothos.ts` (new)
- `backend/graphql/pothos/teacher-dashboard.pothos.ts` (new)
- `backend/graphql/pothos/index.ts`
- `backend/graphql/query/schedule.query.ts`
- `backend/graphql/query/class-session.query.ts` (new)
- `backend/graphql/query/student-history.query.ts` (new)
- `backend/graphql/query/teacher-dashboard.query.ts` (new)
- `backend/graphql/mutation/class-session.mutation.ts` (new)
- `backend/graphql/mutation/teacher-dashboard.mutation.ts` (new)
- `backend/graphql/query/index.ts`
- `backend/graphql/mutation/index.ts`

**Action plan:**

1. Extend `DailyScheduleListDefinition`:
   ```ts
   export type DailyScheduleListDefinition = {
     id: string;
     yourTime: string;
     teacherTime: string;
     studentTime: string;
     duration: number;
     status: string;
     student: DailyScheduleListUserItem;
     teacher: DailyScheduleListUserItem;
   };
   ```

2. Extend `dailyScheduleList` query args:
   ```ts
   args: {
     date: t.arg.string({ required: true }),
     teacherId: t.arg.string({ required: false }),
     search: t.arg.string({ required: false }),
   }
   ```

3. Add `classInstance(id: ID!)` query returning:
   ```ts
   ClassInstanceDetail {
     id, courseName, instanceId, scheduledDate, startTime, endTime,
     durationMinutes, status, remarks, hasTimezoneMismatch, studentTimezone,
     student { id, name, grade, level, avatarUrl },
     teacher { name, title, avatarUrl },
     performance { engagementScore, assessmentProgress, focusLevel, sessionHealth, heatmapData, latencyMs, ... }
     zoomMeetingUrl
   }
   ```

4. Add `studentClassHistory(studentId: ID!, year: Int!, month: Int!)` query:
   ```ts
   StudentClassHistory {
     id  # cache key: `history-${studentId}-${year}-${month}`
     studentName, metrics { totalClasses, attendanceRate, hoursStudied, performance },
     sessions: [StudentHistorySession]  # includes dayOfMonth
   }
   ```

5. Add `studentClassSessionDetail(classInstanceId: ID!)` for modal.

6. Add `teacherDashboard(date: String!)` and `teacherActiveDashboard(date: String!)` queries.

7. Add `classStatusEvents(classInstanceId: ID!)` for download logs.

8. Mutations (each resolver delegates to `ClassSessionService` with matching `SESSION_*` permission gate):
   ```ts
   activateClass(classInstanceId: ID!): ClassInstanceDetail!           # session.activate_class
   forceActivateClass(classInstanceId: ID!): ClassInstanceDetail!     # session.force_activate + session.override_actions
   stopClass(classInstanceId: ID!): ClassInstanceDetail!              # session.override_actions
   startClass(classInstanceId: ID!): ClassInstanceDetail!             # session.start
   markClassAbsent(classInstanceId: ID!): ClassInstanceDetail!        # session.mark_absent
   requestClassLeave(classInstanceId: ID!, reason: String): ClassInstanceDetail!  # session.request_leave
   adminExcuseClassLeave(classInstanceId: ID!): ClassInstanceDetail!  # session.admin_leave
   rescheduleClass(classInstanceId: ID!, input: RescheduleClassInput!): ClassInstanceDetail!  # session.reschedule
   revertClass(classInstanceId: ID!): ClassInstanceDetail!            # session.revert
   deleteClassInstance(classInstanceId: ID!): Boolean!                # session.override_actions
   createTeacherManualClassEntry(input: CreateManualClassEntryInput!): ClassInstanceDetail!
   logTeacherSupportRequest(input: LogSupportRequestInput!): SupportRequestResult!
   ```

9. Run:
   ```bash
   ~/.bun/bin/bun run generate:gqlSchema
   ~/.bun/bin/bun codegen
   ```

---

### Task I — Frontend GraphQL Documents

**Target files:**

- `frontend/graphql/sharedDocuments/schedule.documents.ts`
- `frontend/graphql/sharedDocuments/class-session.documents.ts` (new)
- `frontend/graphql/sharedDocuments/student-history.documents.ts` (new)
- `frontend/graphql/sharedDocuments/teacher-dashboard.documents.ts` (new)

**Action plan:**

1. Extend `dailyScheduleListQueryDocument`:
   ```graphql
   query dailyScheduleList($date: String!, $teacherId: String, $search: String) {
     dailyScheduleList(date: $date, teacherId: $teacherId, search: $search) {
       id
       yourTime
       teacherTime
       studentTime
       duration
       status
       student { id name }
       teacher { id name }
     }
   }
   ```

2. Add `classInstanceQueryDocument`, `activateClassMutationDocument`, `stopClassMutationDocument`, `forceActivateClassMutationDocument`, `deleteClassInstanceMutationDocument`.

3. Add `studentClassHistoryQueryDocument`, `studentClassSessionDetailQueryDocument`, `classStatusEventsQueryDocument`.

4. Add `teacherDashboardQueryDocument`, `teacherActiveDashboardQueryDocument`, `createTeacherManualClassEntryMutationDocument`, `logTeacherSupportRequestMutationDocument`, `teacherHandbookUrlQueryDocument`.

5. Re-run codegen.

---

### Task J — Frontend Stores (Real + Mock)

**Target files:**

- `frontend/stores/classDetailsStore.ts` (new)
- `frontend/stores/mockClassDetailsStore.ts` (keep, align interface)
- `frontend/stores/studentHistoryStore.ts` (new)
- `frontend/stores/mockStudentHistoryStore.ts` (keep, move shared types to `frontend/stores/types/` or export from real store)
- `frontend/stores/teacherDashboardStore.ts` (new)
- `frontend/stores/mockTeacherDashboardStore.ts` (keep)
- `frontend/stores/mockTeacherDashboardActiveStore.ts` (merge into mock teacher store or keep separate for stories)
- `frontend/stores/dashboardStore.ts` (extend if needed for server search debounce state)

**Action plan:**

1. `classDetailsStore.ts`:
   ```ts
   import type { ClassInstanceDetail } from "@/frontend/graphql/generated/gql/graphql-types";
   interface ClassDetailsState {
     isWarningDismissed: boolean;
     dismissWarning: () => void;
     // NO instance data — container holds Apollo data; store only UI ephemeral state
   }
   ```

2. `studentHistoryStore.ts` — UI state only: `selectedDay`, `selectedWeek`, `currentMonth`, setters. Data from Apollo in container.

3. `teacherDashboardStore.ts` — UI state only: `mode`, filter date. Data from Apollo.

4. Update `mock*Store` files to use same TypeScript interfaces exported from a shared `frontend/views/dashboard/types/` file that mirrors GraphQL shapes (or import from codegen).

---

### Task K — Admin Dashboard: Search, Timezones, RequirePermission

**Target files:**

- `frontend/views/dashboard/dashboard/AdminDashboardContainer.tsx`
- `frontend/views/dashboard/dashboard/DashboardView.tsx`
- `frontend/views/dashboard/dashboard/components/ScheduleOverviewSection.tsx`
- `frontend/views/dashboard/dashboard/components/ScheduleOverviewDataGrid.tsx`
- `frontend/views/dashboard/types/dashboard.ts`
- `frontend/views/dashboard/dashboard/AdminDashboardContainer.stories.tsx`

**Action plan:**

1. Remove client-side search filter from `AdminDashboardContainer` (lines filtering `mappedRows` by `filters.searchQuery`). Pass `search: filters.searchQuery || null` to `dailyScheduleListQueryDocument` variables.

2. Extend `ScheduleRow` type:
   ```ts
   export interface ScheduleRow {
     id: string;          // real UUID for routing
     classId: string;     // display "#CLS-{id}"
     student: string;
     teacher: string;
     yourTime: string;
     teacherTime?: string;
     studentTime?: string;
     time: string;        // legacy single column fallback
     status: ClassStatus;
   }
   ```

3. `ScheduleOverviewSection` — wrap search `TextField` in:
   ```tsx
   <RequirePermission permissions={[AppPermission.DashboardSearch]}>
     <TextField ... />
   </RequirePermission>
   ```

4. `ScheduleOverviewDataGrid` — add columns `yourTime`, `teacherTime`, `studentTime` wrapped:
   ```tsx
   <RequirePermission permissions={[AppPermission.ScheduleViewTimezones]}>
     {/* timezone columns */}
   </RequirePermission>
   ```
   Hide timezone columns when permission absent; show single `time` column (mapped from `yourTime`).

5. Wire details `IconButton` → `router.push(\`/classes/${row.id}\`)` using `useRouter` from `next/navigation` with locale prefix via existing i18n pattern.

6. Map `AdminDashboardContainer` rows from GraphQL `yourTime`/`teacherTime`/`studentTime` fields directly (no manual `formatTimeRange` once API returns formatted strings).

---

### Task L — Class Details: Mock → Real + Storybook Split

**Target files:**

- `frontend/views/dashboard/classes/details/ClassDetailsContainer.tsx`
- `frontend/views/dashboard/classes/details/ClassDetailsContainer.stories.tsx`
- `frontend/views/dashboard/classes/details/admin/ClassDetailsAdminView.tsx`
- `frontend/views/dashboard/classes/details/admin/AdminActionsBar.tsx`
- `frontend/views/dashboard/classes/details/teacher/ClassDetailsTeacherView.tsx`
- `frontend/views/dashboard/classes/details/teacher/ActionsPanel.tsx`
- `frontend/views/dashboard/classes/details/teacher/TimezoneWarningBanner.tsx`
- `app/[locale]/(dashboard)/classes/[id]/page.tsx`

**Action plan:**

1. Refactor `ClassDetailsContainer.tsx`:
   - Import `useUserStore` from `@/frontend/stores/userStore` (not mock).
   - Import `useParams` for `id`.
   - `useQuery(classInstanceQueryDocument, { variables: { id } })`.
   - `useMutation` for activate/stop/forceActivate/delete.
   - Remove all `useClassDetailsStore` imports.
   - Gate admin vs teacher view:
     ```ts
     const canOverride = hasPermission(AppPermission.SessionOverrideActions);
     const canView = hasPermission(AppPermission.SessionViewDetails);
     ```
   - Admin branch: `canOverride` → `ClassDetailsAdminView` (replaces old `ClassesReschedule` check).
   - Teacher branch: `canView` → `ClassDetailsTeacherView` (replaces old `ClassesViewDetails` check).
   - Pass `instance` and all mutation handlers as props to view components.

2. Wrap in `ClassDetailsAdminView`:
   ```tsx
   <RequirePermission permissions={[AppPermission.SessionOverrideActions]}>
     <AdminActionsBar onForceActivate={...} onStop={...} onDelete={...} />
   </RequirePermission>
   <RequirePermission permissions={[AppPermission.ScheduleViewTimezones]}>
     <TimezoneWarningBanner ... />
   </RequirePermission>
   ```

3. Wrap activate in `ActionsPanel` parent or panel itself with `SESSION_ACTIVATE_CLASS`.

4. Update prop types: replace `ClassInstance` from `dashboard.ts` with `ClassInstanceDetail` from codegen. Update child components to use new field names.

5. `ClassDetailsContainer.stories.tsx` — create `MockClassDetailsContainer`:
   ```tsx
   export function MockClassDetailsContainer() {
     const instance = useClassDetailsStore(s => s.instance);
     // same JSX as current AdminViewWrapper/TeacherViewWrapper
   }
   export default { component: MockClassDetailsContainer, ... }
   ```

---

### Task M — Student History: Mock → Real + Storybook Split

**Target files:**

- `frontend/views/dashboard/students/history/StudentHistoryContainer.tsx`
- `frontend/views/dashboard/students/history/StudentHistoryView.tsx`
- `frontend/views/dashboard/students/history/StudentHistoryContainer.stories.tsx`
- `frontend/views/dashboard/students/history/components/*.tsx`
- `app/[locale]/(dashboard)/students/[id]/history/page.tsx`

**Action plan:**

1. `StudentHistoryContainer.tsx`:
   ```tsx
   export function StudentHistoryContainer() {
     const params = useParams<{ id: string }>();
     const [currentMonth, setCurrentMonth] = useState(new Date());
     const { data, loading } = useQuery(studentClassHistoryQueryDocument, {
       variables: { studentId: params.id, year, month },
     });
     // handlers for modal, month change, mutations for modal actions
     return <StudentHistoryView ...props />;
   }
   ```

2. Strip `useStudentHistoryStore` from `StudentHistoryView` — accept all data via props.

3. Wrap subcomponents:
   ```tsx
   <RequirePermission permissions={[AppPermission.HistoryViewCalendar]}>
     <StudentHistoryDesktop ... />
     <StudentHistoryMobile ... />
   </RequirePermission>
   <RequirePermission permissions={[AppPermission.HistoryViewDetails]}>
     {isModalOpen && <ClassDetailsModal onViewAssignments={...} onDownloadLogs={...} />}
   </RequirePermission>
   ```

4. Wire `ClassDetailsModal` buttons:
   - `viewAssignments` → query resources or navigate to student resources (existing route).
   - `downloadLogs` → `useQuery(classStatusEventsQueryDocument)` → trigger browser download of JSON/text.

5. Move mock wiring to `MockStudentHistoryContainer` in `.stories.tsx`.

6. Update child component type imports from `mockStudentHistoryStore` → shared types file aligned with GraphQL.

---

### Task N — Teacher Dashboard: 100% Real, All Buttons Wired

**Target files:**

- `frontend/views/dashboard/teachers/dashboard/TeacherDashboardContainer.tsx`
- `frontend/views/dashboard/teachers/dashboard/TeacherDashboardContainer.stories.tsx`
- `frontend/views/dashboard/teachers/dashboard/TeacherDashboardView.tsx`
- `frontend/views/dashboard/teachers/dashboard/TeacherDashboardActiveView.tsx`
- `frontend/views/dashboard/teachers/dashboard/utils/teacherDashboardMode.ts`
- `frontend/views/dashboard/dashboard/DashboardContainer.tsx`
- All `frontend/views/dashboard/teachers/dashboard/components/*.tsx`

**Action plan:**

1. Update `shouldRenderTeacherDashboard` / `DashboardContainer`:
   ```ts
   permissions.includes(AppPermission.TeacherViewDashboard)
   ```
   Remove `ScheduleViewAssigned` from render gate (keep for service only).

2. Refactor `TeacherDashboardContainer.tsx`:
   - `useUserStore` from real store.
   - `useQuery(teacherDashboardQueryDocument)` or `teacherActiveDashboardQueryDocument` based on mode.
   - Remove mock store imports.

3. Wire every button:

   | Button | Implementation |
   |---|---|
   | Activate | `useMutation(activateClassMutationDocument)` + refetch dashboard query; show inline error on `missedClassTime` |
   | Join video | `window.open(row.zoomMeetingUrl, "_blank")` — URL from query |
   | Print schedule | `window.print()` after data loaded (schedule section has `print:hidden` CSS via theme) |
   | Manual entry | Open dialog → `createTeacherManualClassEntryMutationDocument` |
   | New session (active) | Same manual entry mutation with active defaults |
   | Download handbook | `useQuery(teacherHandbookUrlQueryDocument)` → `window.open(url)` |
   | Contact coordinator | `logTeacherSupportRequestMutationDocument` with type `COORDINATOR` |
   | Live support | `logTeacherSupportRequestMutationDocument` with type `SUPPORT` |

4. Wrap root:
   ```tsx
   <RequirePermission permissions={[AppPermission.TeacherViewDashboard]}>
     ...
   </RequirePermission>
   ```

5. Wrap each `SessionActivateButton` usage:
   ```tsx
   <RequirePermission permissions={[AppPermission.SessionActivateClass]}>
     <SessionActivateButton ... />
   </RequirePermission>
   ```

6. `MockTeacherDashboardContainer` in `.stories.tsx` using `mockTeacherDashboardStore` + `mockTeacherDashboardActiveStore`.

7. Update `mockNavigationConfig.ts` and `mockUserStore.ts` permission keys to new enum values.

---

### Task O — Global `classes.*` → `session.*` Permission Sweep

**Target files:** Every file referencing deprecated `classes.*` permissions or `CLASSES_*` / `Classes*` enum members.

**Known touch points (non-exhaustive — grep must confirm zero remaining):**

| File | Replacements |
|---|---|
| `shared/lib/enum.ts` | Remove all `CLASSES_*`; add all `SESSION_*` |
| `backend/db/seeds/permission-catalog.ts` | Full catalog restructure (Task B) |
| `frontend/stores/mockUserStore.ts` | All `AppPermission.Classes*` → `AppPermission.Session*` |
| `frontend/views/dashboard/config/mockNavigationConfig.ts` | `ClassesActivate` → `SessionActivateClass`, `ClassesReschedule` → `SessionReschedule`, `ClassesViewDetails` → `SessionViewDetails` |
| `frontend/views/dashboard/classes/details/ClassDetailsContainer.tsx` | `SessionOverrideActions`, `SessionViewDetails` |
| `frontend/views/dashboard/teachers/dashboard/TeacherDashboardContainer.tsx` | `SessionActivateClass` |
| `frontend/views/dashboard/teachers/dashboard/utils/teacherDashboardMode.ts` | `SessionActivateClass` |
| `frontend/graphql/generated/gql/graphql-types.ts` | Regenerated via codegen (do not hand-edit) |
| `.storybook/StoryWrapper.tsx` | Admin permission seed array |
| Any backend service with `AppPermission.CLASSES_*` | Map to `SESSION_*` equivalent |

**Action plan:**

1. Run exhaustive grep:
   ```bash
   rg "Classes(View|Activate|Force|Start|Mark|Request|Admin|Reschedule|Revert)|CLASSES_|classes\.(view_details|activate|force_activate|start|mark_absent|request_leave|admin_leave|reschedule|revert)" frontend backend shared .storybook
   ```
2. Replace every hit with the corresponding `SESSION_*` / `session.*` value per Section 1 rename map.
3. Regenerate GraphQL types:
   ```bash
   ~/.bun/bin/bun run generate:gqlSchema
   ~/.bun/bin/bun codegen
   ```
4. Run `~/.bun/bin/bun tsgo` — **zero** references to `Classes*` permission enum members or `classes.*` permission strings may remain (excluding unrelated identifiers like `TodayClassesSection`, `classesRemaining`, UI copy keys).
5. Add GraphQL integration test asserting `me` query returns `session.activate_class` (not `classes.activate`) for teacher demo user.

---

### Task I18n — Error & UI Messages

**Target files:**

- `shared/messages/en.ts` (+ `ar` counterparts)
- `shared/messages/types/...`

**Action plan:**

1. Add `errors.missedClassTime` = `"YOU MISSED THE CLASS TIME"` (and Arabic translation).
2. Add any new schedule column header keys: `admin.yourTime`, `admin.teacherTime`, `admin.studentTime`.
3. Ensure backend `getBackendTranslations({ namespace: "errors" })` includes `missedClassTime`.

---

### Task P — GraphQL Integration Tests

**Target files:**

- `frontend/graphql/test/schedule.test.ts` (extend)
- `frontend/graphql/test/class-session.test.ts` (new)
- `frontend/graphql/test/student-history.test.ts` (new)
- `frontend/graphql/test/teacher-dashboard.test.ts` (new)

**Action plan:**

1. **schedule.test.ts** — add tests:
   - `dailyScheduleList` with `search` param returns filtered rows.
   - User without `dashboard.search` + search arg → GraphQL error.
   - Response includes `teacherTime`, `studentTime`, `yourTime`.

2. **class-session.test.ts**:
   - Login as teacher → `activateClass` succeeds within window.
   - Activate outside window → `result.error` with missed class time message.
   - Login as academy admin → `forceActivateClass` succeeds.

3. **student-history.test.ts**:
   - Login as academy admin → `studentClassHistory` returns sessions.
   - User without `history.view_calendar` → unauthorized.

4. **teacher-dashboard.test.ts**:
   - Login as teacher → `teacherDashboard` returns rows scoped to teacher.
   - `createTeacherManualClassEntry` creates instance.
   - User without `teacher.view_dashboard` → unauthorized.

5. Use `setupTestServerLifecycle()`, `testClient`, `TypedDocumentNode` imports per `frontend/graphql/AGENTS.md`.

---

### Task Q — Repository Integration Tests (100% Coverage)

**Target files:**

- `backend/db/test/repo/system-settings.repository.test.ts`
- `backend/db/test/repo/scheduling.repository.test.ts` (extend)
- `backend/db/test/repo/class-performance.repository.test.ts`
- `backend/db/test/repo/student-history.repository.test.ts`

**Action plan:**

1. Every new repository method gets dedicated test cases inside `runInRollback`.
2. Use `createTestUser`, `setupTeacher`, `setupStudent` from `entity-setup.ts`.
3. After each file: `~/.bun/bin/bun run test:coverage <file>` → confirm 100% lines and functions.
4. Account for pre-existing data per AGENTS.md (delta counts, not absolute).

---

## Section 3: Component Trees (Reference)

### Admin Dashboard

```
DashboardContainer [userStore + meQuery]
└── AdminDashboardContainer [dashboardStore + Apollo dailySchedule*]
    └── DashboardView
        ├── RequirePermission [dashboard.view_metrics] → TodayClassesSection
        └── RequirePermission [schedule.view_list] → ScheduleOverviewSection
            ├── RequirePermission [dashboard.search] → Search TextField
            ├── RequirePermission [schedule.filter_advanced] → ScheduleFilters
            └── ScheduleOverviewDataGrid
                ├── RequirePermission [schedule.view_timezones] → yourTime / teacherTime / studentTime
                └── actions → /classes/[id]
```

### Student History

```
StudentHistoryContainer [Apollo + UI store]
└── StudentHistoryView [props]
    ├── RequirePermission [history.view_calendar] → StudentHistoryDesktop → CalendarGrid
    ├── RequirePermission [history.view_calendar] → StudentHistoryMobile → MobileWeeklyScroller, ClassSessionList
    └── RequirePermission [history.view_details] → ClassDetailsModal
```

### Class Details

```
ClassDetailsContainer [Apollo + classDetailsStore UI state]
├── RequirePermission [session.override_actions] → ClassDetailsAdminView → AdminActionsBar
│   └── force-activate action additionally checks session.force_activate in service layer
└── RequirePermission [session.view_details] → ClassDetailsTeacherView → ActionsPanel
    └── RequirePermission [session.activate_class] on activate button
    └── RequirePermission [schedule.view_timezones] → TimezoneWarningBanner (both views)
```

### Teacher Dashboard

```
RequirePermission [teacher.view_dashboard] → TeacherDashboardContainer [Apollo]
├── TeacherDashboardView [props] → ScheduleDataGrid, ActivationPolicyPanel, print/manual/support
└── TeacherDashboardActiveView [props] → ActiveScheduleDataGrid, SessionActivateButton, NewSession
    └── RequirePermission [session.activate_class] on each SessionActivateButton
```

---

## Section 4: Strict Verification & Integrity Protocol

Run in order after implementation (do not skip):

```bash
# 1. Schema & seeds
~/.bun/bin/bun run scripts/dbActions.ts push
~/.bun/bin/bun run db seed

# 2. GraphQL codegen
~/.bun/bin/bun run generate:gqlSchema
~/.bun/bin/bun codegen

# 3. Repository tests (100% coverage each)
~/.bun/bin/bun run test:coverage backend/db/test/repo/system-settings.repository.test.ts
~/.bun/bin/bun run test:coverage backend/db/test/repo/scheduling.repository.test.ts
~/.bun/bin/bun run test:coverage backend/db/test/repo/class-performance.repository.test.ts
~/.bun/bin/bun run test:coverage backend/db/test/repo/student-history.repository.test.ts

# 4. GraphQL integration tests
~/.bun/bin/bun test frontend/graphql/test/schedule.test.ts
~/.bun/bin/bun test frontend/graphql/test/class-session.test.ts
~/.bun/bin/bun test frontend/graphql/test/student-history.test.ts
~/.bun/bin/bun test frontend/graphql/test/teacher-dashboard.test.ts

# 5. TypeScript & lint
~/.bun/bin/bun tsgo
~/.bun/bin/bun run lint

# 6. Quality gate
~/.bun/bin/bun quality-gate
```

### Manual smoke checklist

- [ ] Academy admin: search filters server-side; timezone columns visible with permission.
- [ ] Academy admin: student history calendar + modal detail open.
- [ ] Academy admin: `/classes/[id]` override toolbar works (force activate, stop, delete).
- [ ] Teacher: dashboard renders only with `teacher.view_dashboard`.
- [ ] Teacher: activate works inside window; shows localized error outside window.
- [ ] Teacher: join video opens Zoom URL; manual entry creates class; handbook downloads.
- [ ] Storybook: all four `Mock*Container` stories render without Apollo.
- [ ] No production file imports `mock*Store` except `*.stories.tsx`.
- [ ] `rg` confirms zero `classes.*` permission strings and zero `CLASSES_*` / `AppPermission.Classes*` enum usage (excluding unrelated UI identifiers).

---

## Appendix A: Files Created (Summary)

| Path | Purpose |
|---|---|
| `backend/db/repo/system-settings.repository.ts` | Settings lookup |
| `backend/db/repo/class-performance.repository.ts` | Performance/heatmap data |
| `backend/db/repo/student-history.repository.ts` | Calendar + metrics |
| `backend/services/session/class-session.service.ts` | Activation + overrides |
| `backend/services/history/student-history.service.ts` | History business logic |
| `backend/services/performance/class-performance.service.ts` | Performance reads |
| `backend/services/teacher/teacher-dashboard.service.ts` | Teacher dashboard data |
| `backend/services/system/system-rules.service.ts` | Time window enforcement |
| `backend/lib/timezone.ts` | IANA formatting helpers |
| `backend/graphql/pothos/class-session.pothos.ts` | Class instance types |
| `backend/graphql/pothos/student-history.pothos.ts` | History types |
| `backend/graphql/pothos/teacher-dashboard.pothos.ts` | Teacher dashboard types |
| `frontend/graphql/sharedDocuments/class-session.documents.ts` | Apollo documents |
| `frontend/graphql/sharedDocuments/student-history.documents.ts` | Apollo documents |
| `frontend/graphql/sharedDocuments/teacher-dashboard.documents.ts` | Apollo documents |
| `frontend/stores/classDetailsStore.ts` | UI ephemeral state |
| `frontend/stores/studentHistoryStore.ts` | UI ephemeral state |
| `frontend/stores/teacherDashboardStore.ts` | UI ephemeral state |
| `backend/db/seeds/seed-class-performance.ts` | Performance seed data |

## Appendix B: Decisions Log

| Decision | Resolution |
|---|---|
| Permission naming | **Option C — full migration:** all `classes.*` → `session.*` across entire catalog; `classes` resource deleted |
| `session.override_actions` vs `session.force_activate` | Toolbar gated by `override_actions`; force-activate mutation also requires `force_activate` |
| `history.view_details` vs `session.view_details` | History modal vs `/classes/[id]` page — distinct permissions, both kept |
| Search | Server-side via `fullTextSearch` on student/teacher names |
| Student timezone | `students.timezone_override ?? parents.timezone ?? default_timezone setting` |
| Activation window end | `scheduled_end_at` (end-of-duration) |
| History details UI | `ClassDetailsModal` on history page (confirmed in code) |
| Teacher dashboard gate | `teacher.view_dashboard` sole render gate |
| Mock stores | Production containers use real Apollo; mocks only in Storybook wrappers |
