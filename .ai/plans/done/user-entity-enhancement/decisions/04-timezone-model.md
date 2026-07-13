# Decision 4: Timezone modeling on `users`

## Status: **DECIDED — 4A**

**Also locked:** early-dev **clean-slate migrations** (Decision **8C**) — OK to drop/recreate the local DB and regenerate migration history. **Do not design incremental backfills** for this change; regenerate a clean Drizzle migration set instead.

---

## Decision: **4A** — IANA `varchar` on `users` + auto-generated GraphQL/TS enum

```
users.timezone              → varchar IANA id (source of truth for the person)
                              e.g. "Africa/Cairo"
                              CHECK is_valid_timezone() on Postgres (bonus)

GraphQL / TypeScript        → enum IanaTimezone (FULL IANA set)
                              generated from Intl.supportedValuesOf("timeZone")
                              no hand-maintained allowlist

DB column type              → varchar / text (NOT a native PG/MySQL ENUM)
                              portable if we add MySQL later

timezones lookup table      → OPTIONAL catalog / FK helper only
                              NOT a second source of truth for users.timezone
                              clients never send timezoneId; server may resolve iana → id

teachers.timezone(*)        → REMOVE (moved to users)
parents.timezone            → REMOVE (moved to users)
students.timezone_override  → KEEP (still per-student override)

Effective student TZ:
  COALESCE(student.timezone_override, parent_user.timezone, academy_default)
```

### Concrete shapes

**DB (person):**

```ts
// users
timezone: varchar("timezone", { length: 100 }).notNull().default("UTC")
// optional: timezoneId FK → timezones.id (server-maintained only)
// CHECK: is_valid_timezone(timezone)  // Postgres
```

**GraphQL:**

```graphql
enum IanaTimezone {
  Africa_Cairo    # serializes as "Africa/Cairo" (codegen naming TBD)
  Asia_Riyadh
  # … all IANA zones, auto-generated
}

type User {
  timezone: IanaTimezone!
}

input UpdateProfileInput {
  timezone: IanaTimezone
}

input TeacherOnboardingInput {
  timezone: IanaTimezone!   # no timezoneId from client
}

input CreateRecurringScheduleInput {
  timezone: IanaTimezone!
}
```

**DST tool (unchanged API):**

```graphql
mutation executeDstBulkUpdate(
  $offsetMinutes: Int!
  $description: String!
): DstMigrationReport!
```

### Shared UI — `TimezoneSelect` (required everywhere)

**One canonical timezone picker** under `frontend/components/ui/input/`. All forms and views must use it — **no ad-hoc** `Select` / `MenuItem` / free-text timezone fields.

**Pattern:** mirror [`CountrySelect.tsx`](../../../frontend/components/ui/input/CountrySelect.tsx) (MUI `Autocomplete`, searchable, locale-aware labels).

**New files:**

| File | Purpose |
|------|---------|
| `frontend/components/ui/input/TimezoneSelect.tsx` | Shared picker component |
| `frontend/components/ui/input/TimezoneSelect.stories.tsx` | Storybook |
| `frontend/lib/timezone.ts` (or `shared/lib/timezone.ts`) | Option list + `getTimezoneDisplayName(iana, locale)` via `Intl` |
| `frontend/components/ui/input/index.ts` | Export `TimezoneSelect` |

**Props (conceptual):**

```ts
export type TimezoneSelectProps = {
  value?: IanaTimezone | null;           // generated GraphQL/codegen type
  onChangeAction: (tz: IanaTimezone) => void;
  onBlurAction?: () => void;
  label?: string;
  required?: boolean;
  fullWidth?: boolean;
  disabled?: boolean;
  autoComplete?: string;
};
```

**Rules:**

1. **Options** — built from generated `IanaTimezone` enum / shared constant (same source as backend codegen); never a hand-picked subset in a view.
2. **Labels** — localized display via `Intl.DateTimeFormat` + `timeZoneName: "longGeneric"` (or equivalent); show IANA id as secondary hint if needed.
3. **Values** — always emit canonical IANA strings (`Africa/Cairo`), never display labels like `(GMT+02:00) Cairo`.
4. **Search** — `Autocomplete` with filter on IANA id + localized name.
5. **Forms** — wire via controlled `value` / `onChangeAction`; integrate with react-hook-form via `Controller` where needed.
6. **No duplicates** — replace inline timezone `Select` in onboarding, profiles, recurring class, student override, etc.

**Use everywhere (replace local pickers):**

| Current location | Action |
|------------------|--------|
| `frontend/views/dashboard/teachers/onboarding/**` | Use `TimezoneSelect` |
| `frontend/views/dashboard/profile/**` | Use `TimezoneSelect` |
| `frontend/views/dashboard/teachers/profile/**` | Use `TimezoneSelect` |
| `frontend/views/dashboard/classes/recurring/**` | Use `TimezoneSelect` |
| `frontend/views/dashboard/teachers/schedule/weekly/components/CreateRecurringClassDialog.tsx` | Use `TimezoneSelect` |
| Any future form with a timezone field | Use `TimezoneSelect` |

**i18n:** default label via `useTranslations("ui.timezoneSelect")` (add `shared/messages/**` keys).

---

## Why we chose 4A (this variant)

1. **GraphQL typesafety** — clients cannot send display junk like `(GMT+02:00) Cairo`; only generated enum members.
2. **No long-run human maintenance** — zone list comes from `Intl` / runtime tzdata via a codegen script + CI stale check; nobody edits 400+ values by hand.
3. **DB portability** — store `varchar`, not a native DB ENUM; app/GraphQL own validation. Postgres `is_valid_timezone()` CHECK is optional hardening, not the design dependency.
4. **DST stays correct** — DST logic already keys off IANA **strings** + offset snapshots (`booking_timezone`, `utc_offset_snapshot`, etc.). Moving person TZ to `users` only requires trigger/read-path updates; the DST model itself does not change.
5. **Rejected 4B** (curated small allowlist) — blocks legitimate global users; needs product updates forever.
6. **Rejected 4C** (FK-only, no varchar on users) — extra joins, awkward snapshots, forces perpetual seed sync of `timezones` as source of truth.
7. **Rejected native PG ENUM of all IANA** — painful alters, not MySQL-friendly, renames are messy; GraphQL/TS enum is enough.

### `users.timezone` varchar vs `timezones` table

| Piece | Role |
|-------|------|
| `users.timezone` | **Required** source of truth — who is in which zone |
| `timezones` table | **Optional** catalog / FK target for schedules (`timezone_id`); metadata only |
| DST correctness | Comes from IANA string + live/`AT TIME ZONE` / stored offset snapshots — **not** from `timezones.base_offset_minutes` |

Keep `timezones` only if we still want int FKs on scheduling tables. Do **not** require both columns as dual sources of truth on `users`.

---

## How automatic IANA enum updates work

1. Script reads `Intl.supportedValuesOf("timeZone")`.
2. Emits `backend/enum/timezone.enum.ts` + Pothos `IanaTimezone` enum.
3. CI fails if generated output is stale after runtime/tzdata bumps.
4. `bun run generate:gqlSchema` + `bun codegen` refresh client types.
5. **No DB ENUM migration** when IANA adds a zone — column stays `varchar`.

This is separate from **DST migration** (admin/tool that shifts class times when offsets change). Enum regen ≠ DST runs.

---

## DST alignment (required follow-ups)

Existing logic: [`backend/db/migration/timezone_dst_logic.sql`](../../../backend/db/migration/timezone_dst_logic.sql).

| Piece | Change under 4A |
|-------|-----------------|
| `trg_snapshot_booking_timezone` | Today reads `teachers.timezone` → must read `users.timezone` via teacher → user |
| `trg_teachers_timezone_id_sync` | Move to `users` or drop if we stop storing `timezone_id` on the person |
| `auto_adjust_dst_bookings` / offset helpers | Keep — still use IANA varchar + snapshots |
| `executeDstBulkUpdate` GraphQL | Unchanged args |
| Student effective TZ resolution | Parent TZ from `users` (via parent → user), not `parents.timezone` |

---

## Migration note (clean-slate)

We are still in **early development**. Per Decision **8C**:

- Drop/recreate local DB as needed.
- Regenerate Drizzle migrations from the new schema (do **not** write hand-crafted data backfills for teacher/parent → users timezone).
- Seeds and tests create data in the new shape directly.
- Do **not** spend design effort on production-safe incremental timezone migrations.

---

## Files that need to change

### New

| File | Why |
|------|-----|
| `backend/enum/timezone.enum.ts` | Generated full IANA enum (committed output of codegen) |
| `scripts/` timezone enum generator (path TBD, e.g. `scripts/generate-iana-timezone-enum.ts`) | Auto-generate enum from `Intl` |
| `backend/graphql/pothos/timezone.pothos.ts` (or shared enums module) | Pothos `IanaTimezone` enum registration |
| `frontend/components/ui/input/TimezoneSelect.tsx` | **Canonical timezone picker — use everywhere** |
| `frontend/components/ui/input/TimezoneSelect.stories.tsx` | Storybook for shared picker |
| `frontend/lib/timezone.ts` | Timezone options + localized display names for UI |

### Schema / DB

| File | Why |
|------|-----|
| `backend/db/schema/users.ts` | Add `timezone` (+ optional `timezoneId`) + CHECK |
| `backend/db/schema/teachers.ts` | Remove `timezone` / `timezoneId` |
| `backend/db/schema/parents.ts` | Remove `timezone` + CHECK |
| `backend/db/schema/students.ts` | Update effective-TZ docs; keep `timezoneOverride` |
| `backend/db/schema/timezones.ts` | Keep as optional catalog; document non-source-of-truth role |
| `backend/db/schema/scheduling.ts` | Confirm snapshot columns stay varchar; FK optional |
| `backend/db/schema/teacher-availability.ts` | Same — varchar snapshots; optional FK |
| `backend/db/schema/staff.ts` | Align if staff timezone was assumed on role table |
| `backend/db/migration/timezone_dst_logic.sql` | Retarget triggers to `users.timezone` |
| `backend/db/migration/1-extensions.sql` / drizzle extensions | Keep `is_valid_timezone()` for Postgres CHECKs |
| `backend/drizzle/**` | **Regenerate** clean migration set (8C) — do not patch old SQL by hand |

### Types

| File | Why |
|------|-----|
| `backend/types/` user / profile types | `timezone: IanaTimezone` on user return/submit types |
| `backend/types/teacher.types.ts` | Drop person timezone fields |
| `backend/types/parent.types.ts` | Drop person timezone fields |
| `backend/types/teacher-onboarding.types.ts` | `timezone: IanaTimezone`; drop client `timezoneId` |
| `backend/types/profile.types.ts` | Profile read/write uses users timezone |
| `backend/types/scheduling.types.ts` | Schedule inputs use `IanaTimezone` |
| `backend/types/student.types.ts` | Effective TZ resolution types/docs |
| `backend/types/teacher-availability.types.ts` | Enum-typed timezone fields where exposed |

### Repositories

| File | Why |
|------|-----|
| `backend/db/repo/teacher.repository.ts` | Stop reading/writing teacher timezone; join users |
| `backend/db/repo/parent.repository.ts` | Same for parents |
| `backend/db/repo/scheduling/**` | Resolve teacher/parent TZ from users; student COALESCE update |
| `backend/db/repo/teacher-availability.repository.ts` | Align timezone writes |
| `backend/db/repo/dst-migration.repository.ts` | Ensure schedule TZ still varchar; person TZ via users if needed |
| `backend/db/repo/` any profile / staff repos touching timezone | Point at `users` |

### Services

| File | Why |
|------|-----|
| `backend/services/teacher/teacher-onboarding.service.ts` | Persist timezone on users |
| `backend/services/parent/parent-onboarding.service.ts` | Same |
| `backend/services/profile/profile.service.ts` | Same |
| `backend/services/parent/parent-profile.service.ts` | Same |
| `backend/services/staff/staff-profile.service.ts` | Same |
| `backend/services/schedule/recurring-class.service.ts` | Accept `IanaTimezone` |
| `backend/services/schedule/schedule.service.ts` / `schedule-query.service.ts` | Display TZ from users |
| `backend/services/teacher/teacher-portal.service.ts` | Same |
| `backend/services/teacher/teacher-dashboard.service.ts` | Same |
| `backend/services/system/dst-migration.service.ts` | Only if it assumed teacher-table timezone |
| `backend/lib/timezone.ts` | Keep helpers; validate against generated enum / `Intl` |

### GraphQL (Pothos + mutations)

| File | Why |
|------|-----|
| `backend/graphql/pothos/teacher-onboarding.pothos.ts` | `IanaTimezone!`; drop client `timezoneId` |
| `backend/graphql/pothos/parent-onboarding.pothos.ts` | `IanaTimezone` |
| `backend/graphql/pothos/profile.pothos.ts` | `IanaTimezone` |
| `backend/graphql/pothos/parent-profile.pothos.ts` | Expose from users |
| `backend/graphql/pothos/staff-profile.pothos.ts` | Same |
| `backend/graphql/pothos/recurring-class.pothos.ts` | `IanaTimezone`; drop/ignore client `timezoneId` |
| `backend/graphql/pothos/schedule.pothos.ts` | Viewer/schedule TZ args |
| `backend/graphql/pothos/class-session.pothos.ts` | `studentTimezone` / `teacherTimezone` as enum |
| `backend/graphql/pothos/availability-search.pothos.ts` | Enum-typed timezone fields |
| `backend/graphql/pothos/teacher-portal.pothos.ts` | Same |
| `backend/graphql/mutation/schedule.mutation.ts` | Pass enum through |
| `backend/graphql/utils/class-session.utils.ts` | Resolve TZ from users |
| `backend/graphql/pothos/index.ts` | Export timezone enum module |

### Frontend GraphQL documents + forms/UI

| File | Why |
|------|-----|
| `frontend/components/ui/input/TimezoneSelect.tsx` | **Replace all ad-hoc timezone inputs** |
| `frontend/components/ui/input/index.ts` | Export `TimezoneSelect` |
| `frontend/lib/timezone.ts` | Options + display helpers for picker |
| `frontend/common/graphql/sharedDocuments/profile.documents.ts` | Select/mutate `IanaTimezone` |
| `frontend/common/graphql/sharedDocuments/parent-profile.documents.ts` | Same |
| `frontend/common/graphql/sharedDocuments/staff-profile.documents.ts` | Same |
| `frontend/common/graphql/sharedDocuments/schedule.documents.ts` | Same |
| `frontend/common/graphql/sharedDocuments/class-session.documents.ts` | Same |
| `frontend/common/graphql/sharedDocuments/availability-search.documents.ts` | Same |
| `frontend/common/graphql/sharedDocuments/teacher-portal.documents.ts` | Same |
| `frontend/views/dashboard/teachers/onboarding/**` | Wire `TimezoneSelect` |
| `frontend/views/dashboard/profile/**` | Wire `TimezoneSelect` |
| `frontend/views/dashboard/teachers/profile/**` | Wire `TimezoneSelect` |
| `frontend/views/dashboard/classes/recurring/**` | Wire `TimezoneSelect` |
| `frontend/views/dashboard/teachers/schedule/weekly/components/CreateRecurringClassDialog.tsx` | Wire `TimezoneSelect` |
| `frontend/views/dashboard/search-schedule/**` | Display TZ (read-only; no picker unless filter added) |
| `frontend/hooks/useCreateTeacherOnboarding.ts` | Input shape |
| `frontend/hooks/useCreateParentOnboarding.ts` | Input shape |
| `frontend/common/graphql/generated/**` | Regenerated via codegen (do not hand-edit) |
| `test/ui/components/**` | Component test for `TimezoneSelect` (optional) |

### Seeds, tests, i18n (as touched by implementation)

| Area | Why |
|------|-----|
| `backend/db/seeds/**` | Seed `users.timezone`; stop seeding role-table timezone |
| `backend/db/test/**` | Entity setup + repo tests for users timezone / COALESCE |
| `backend/services/**/*.test.ts` | Profile/onboarding/schedule tests |
| `frontend/common/graphql/test/**` | GraphQL integration tests for enum args |
| `shared/messages/**` | `ui.timezoneSelect` label + validation copy |

### Explicitly unchanged (API)

| File | Note |
|------|------|
| `backend/graphql/mutation/dst-migration.mutation.ts` | Args stay `offsetMinutes` + `description` |
| `frontend/common/graphql/sharedDocuments/dst-migration.documents.ts` | Same |
| DST run/entry tables | Unchanged |

---

## Implementation phases (when we build)

Order matters — each phase should pass `tsgo` + tests before the next.

### Phase 1 — Codegen + schema

1. Add `scripts/generate-iana-timezone-enum.ts` → `backend/enum/timezone.enum.ts`
2. Register Pothos `IanaTimezone` enum
3. Add `users.timezone` (+ CHECK); remove from `teachers` / `parents`
4. Regenerate clean Drizzle migration (8C)
5. Update `timezone_dst_logic.sql` triggers → `users.timezone`

### Phase 2 — Types + repos + services

1. User/profile/onboarding types use `IanaTimezone`
2. Repos read/write `users.timezone`; student COALESCE via parent → user
3. Services persist timezone on user, not role row

### Phase 3 — GraphQL + codegen

1. Replace `t.string` timezone fields with `IanaTimezone` in Pothos
2. `generate:gqlSchema` + `codegen`
3. GraphQL integration tests for invalid enum rejection

### Phase 4 — Frontend

1. Build `TimezoneSelect` + `frontend/lib/timezone.ts` + Storybook
2. Export from `frontend/components/ui/input/index.ts`
3. Update documents + forms to use generated `IanaTimezone` type
4. Replace every ad-hoc timezone `Select` with `TimezoneSelect` (onboarding, profiles, recurring class, student override)
5. Never use display labels like `(GMT+02:00) Cairo` — component enforces IANA values only

### Phase 5 — Seeds + tests

1. Seeds set `users.timezone` directly
2. Fix db tests, service tests, UI stories

---

## Reply locked

`4A`
