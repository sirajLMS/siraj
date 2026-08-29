# UI Component Test Rules (`test/ui/components/`)

Happy DOM component tests: no server, no browser, mocked Apollo. The full test-writing rules (translation rules, `TestWrapper`, preloads, Apollo mocks, MUI v9 gotchas) live in `test/ui/AGENTS.md` — read those first. This file covers **directory organization only**.

## Running

```bash
bun run test:ui:components        # full suite (preloads live at this dir's root)
bun run test/scripts/run-test.ts test/ui/components/<domain>/<file>.test.tsx  # single file
```

The suite globs this whole directory; preloads are referenced by root path (`test/ui/components/happydom-preload.ts`, etc.), so moving tests between domain dirs never breaks the runner.

## Directory Layout (CRITICAL)

Test files are organized **one subdirectory per domain**, mirroring the component's frontend domain:

- Mirror `frontend/common/views/dashboard/<domain>` / `frontend/common/components/<domain>` (plus the `frontend/desktop/` and `frontend/mobile/` surfaces of the same domain).
- Examples: `meeting-integrations/`, `whatsapp/`, `navigation/`, `students/`, `classes/`, `admin/`, `teachers/dashboard/`, `quota/`, `settings/`.
- Domain dirs may nest where the frontend domains nest: `teachers/dashboard/`, `teachers/schedule/weekly/`.

### Rules

1. **New test files MUST go into the matching domain subdirectory** — never add a test file as a direct child of `test/ui/components/`.
2. **New domain → create the subdirectory**, using the same name as the frontend domain dir (e.g. `billing/`, `cron/`). A domain with a single test file still gets its own dir (`cron/`, `auth/`, `ui/` are precedents).
3. **Direct children of this dir are shared test infrastructure only** — never test files:
   - `TestWrapper.tsx` — Apollo + locale wrapper (import as `@/test/ui/components/TestWrapper`)
   - `happydom-preload.ts`, `translation-preload.ts`, `next-dynamic-mock.ts` — runner preloads
   - `jest-dom.d.ts` — matcher type declarations
4. **Cross-domain shared assets**:
   - `helpers/` — shared mocks and reusable test logic (navigation mocks, session-activate test helpers, etc.)
   - `fixtures/` — shared test data shapes
   - Keep these domain-agnostic. Domain-specific fixtures/helpers belong inside the domain dir (e.g. `classes/recurringSchedulesListFixtures.ts`).
5. Moving a file between domain dirs requires **no import changes** — everything uses `@/` aliases.

## Naming Conventions

- `*.test.ts` / `*.test.tsx` — standard tests
- `{name}.desktop.test.tsx` / `{name}.mobile.test.tsx` — platform variants of the same component
- `{name}.tier.test.tsx` / `{name}.tiers.test.tsx` — permission-tier variants
- Test file name matches the component/module under test (e.g. `MeetingUrlStatusBadge.test.tsx` ↔ `MeetingUrlStatusBadge.tsx`).

## Current Domain Map

| Dir | Covers |
|-----|--------|
| `accounting/` | Payments, package plans, credit hours |
| `admin/` | Admin home dashboard (schedule overview, metric filters) |
| `auth/` | `RequirePermission` and auth components |
| `billing/` | Billing navbar/section components |
| `classes/` | Class details, recurring schedules, audit, status tracking |
| `cron/` | Cron management |
| `dashboard/` | Dashboard container and bridge |
| `meeting-integrations/` | Meeting integrations (settings tab + profile meeting-configs + `ui/display/meetingConfig`) |
| `navigation/` | Sidebar nav configs, breadcrumbs, tab nav |
| `parents/` | Admin parents directory (data grid + student directory grid pagination) |
| `profile/` | Profile views across roles (core, teacher, parent, staff, student, supervisor) |
| `quota/` | Quota views and containers |
| `schedule/` | Search-schedule |
| `settings/` | Settings tabs and customizer |
| `students/` | Student dashboard, sessions, history |
| `supervisor/` | Supervisor domain (pending reviews) |
| `teachers/` | Teacher views (`dashboard/`, `schedule/`, `directory/`, `lesson-reports/`, …) |
| `ui/` | Shared `frontend/common/components/ui/**` components |
| `users/` | Users directory and billing profile |
| `whatsapp/` | WhatsApp settings domain |

Keep this table current when adding/removing a domain dir.
