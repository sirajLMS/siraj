# Timezone Enhancement — Specification

**Status:** Implementation  
**Decision:** [04-timezone-model.md](../user-entity-enhancement/decisions/04-timezone-model.md) — **4A**  
**Migration:** [08-migration-strategy.md](../user-entity-enhancement/decisions/08-migration-strategy.md) — **8C clean-slate**

---

## Problem

Person timezone is split across `teachers` (varchar + FK + trigger) and `parents` (varchar only). GraphQL exposes free `String` fields, allowing invalid display labels like `(GMT+02:00) Cairo`. Typesafety is weak and maintenance is fragmented.

## Locked decisions

| Topic | Choice |
|-------|--------|
| Storage | `users.timezone` IANA `varchar(100) NOT NULL DEFAULT 'UTC'` |
| GraphQL/TS | Auto-generated full `IanaTimezone` enum from `Intl.supportedValuesOf("timeZone")` |
| DB column | `varchar` only — no native PG/MySQL ENUM |
| `users.timezoneId` | **Skip** — optional FK on scheduling tables only |
| `timezones` table | Optional catalog; not source of truth for users |
| Role tables | Remove `teachers.timezone` / `parents.timezone` |
| Students | Keep `timezone_override`; effective TZ via parent user |
| UI | `TimezoneSelect` + `TimezoneDisplay` under `frontend/components/ui/` |
| Imports | `@/` alias only — no relative `../` or `./` |

## Data model

```
users.timezone              varchar IANA (source of truth)
students.timezone_override  varchar nullable
recurring_schedules.*       varchar snapshots + optional timezone_id FK (unchanged pattern)
class_instances.*           booking_timezone snapshots (unchanged)
```

**Student effective timezone:**

`COALESCE(student.timezone_override, parent_user.timezone, academy_default)`

## GraphQL contract

- Enum `IanaTimezone` — full IANA set; keys like `Africa_Cairo`, values `"Africa/Cairo"`
- Person/profile/onboarding inputs use `IanaTimezone` — no client `timezoneId`
- Schedule/recurring inputs use `IanaTimezone`
- `executeDstBulkUpdate` unchanged (`offsetMinutes`, `description`)

## UI components

| Component | Path | Role |
|-----------|------|------|
| `TimezoneSelect` | `frontend/components/ui/input/TimezoneSelect.tsx` | Editable searchable picker |
| `TimezoneDisplay` | `frontend/components/ui/display/TimezoneDisplay.tsx` | Read-only formatted display |

Mirror `CountrySelect` / `CountryDisplay` patterns. Use everywhere — no ad-hoc timezone `Select` in views.

## DST alignment

- `timezone_dst_logic.sql`: booking snapshot trigger reads `users.timezone` via teacher → user join
- Remove `trg_teachers_timezone_id_sync` (no teacher timezone column)
- Offset helpers and `auto_adjust_dst_bookings` unchanged

## Constraints

- Read layer AGENTS.md before editing each layer
- Backend: types → repo → service → pothos (no repos in resolvers)
- Frontend: codegen types from `graphql-types.ts`; Apollo hooks from `@apollo/client/react`
- DB tests: `runInRollback`, pass `tx`, no `expect().rejects.toThrow()` inside rollback
- Localized errors via `getBackendTranslations`

## Out of scope

- Currency, payment methods, phone, status, meeting configs, staff_profiles
- Full person-field migration beyond timezone

## Acceptance criteria

1. `users.timezone` is sole person TZ source; role columns removed
2. GraphQL rejects invalid timezone strings at parse layer
3. `resolveStudentTimezone` uses parent → user join
4. DST triggers read from `users.timezone`
5. All timezone forms use `TimezoneSelect`; grids use `TimezoneDisplay` where applicable
6. `bun tsgo`, db tests, graphql tests pass
7. Seeds create data in new shape
