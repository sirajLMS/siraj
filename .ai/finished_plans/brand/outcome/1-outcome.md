# Task 1 — Add `SETTINGS_APPEARANCE_MANAGE` enum value

## Summary
Added the new permission enum value `SETTINGS_APPEARANCE_MANAGE = "settings.appearance_manage"`
to the `AppPermission` enum in `backend/enum/permissions/permission.enum.ts`, in the
existing `// Settings (...)` block, placed immediately after
`SETTINGS_SITE_CONTENT_MANAGE` (logical grouping with the other site-wide
`*_MANAGE` permission).

This unblocks all downstream phases that reference
`AppPermission.SettingsAppearanceManage` (Pothos resolvers, page-permissions,
`withPageAuth`, and GraphQL codegen in Task 3).

## Requirements Coverage
- **AC-3** — Backend enum value `SETTINGS_APPEARANCE_MANAGE` exists with the
  exact string value `"settings.appearance_manage"` per `decisions.md` §4
  (Persistence shape & ownership).

## Files Modified
- `backend/enum/permissions/permission.enum.ts` — added one line:
  ```ts
  SETTINGS_APPEARANCE_MANAGE = "settings.appearance_manage",
  ```
  inserted between `SETTINGS_SITE_CONTENT_MANAGE` and `SETTINGS_TIMEZONES_VIEW`.

### Diff (exact hunk)
```diff
   SETTINGS_SITE_CONTENT_MANAGE = "settings.site_content_manage",
+  SETTINGS_APPEARANCE_MANAGE = "settings.appearance_manage",
   SETTINGS_TIMEZONES_VIEW = "settings.timezones_view",
```

## Placement Rationale
- The `// Settings (...)` block groups all `SETTINGS_*` permissions.
- Placement after `SETTINGS_SITE_CONTENT_MANAGE` keeps the two site-wide
  `*_MANAGE` permissions (site-content + appearance) adjacent — they share the
  same access pattern (both granted to `super_admin` + `academy_admin` in
  Task 1.1).
- Does not disrupt the existing `SETTINGS_EDIT_*` group ordering or the
  trailing `SETTINGS_EDIT_MEETING_INTEGRATIONS` (added in a prior feature).
- No barrel/index.ts change required — `permission.enum.ts` is already exported
  via `backend/enum/permissions/index.ts` and `backend/enum/index.ts`.

## AGENTS.md Rules Applied
- **Root `AGENTS.md`**: Type-checking uses `bun tsgo` (tsgo, not tsc).
- **`backend/enum/AGENTS.md`**:
  - Enums in this directory are backend-only (frontend will consume the
    codegen-derived `AppPermission.SettingsAppearanceManage` after Task 3).
  - One file per logical domain — `permissions/permission.enum.ts` is the
    correct file; no new file or sub-directory needed.
  - No `oxlint-disable` comments added.

## Verification — Sub-loop `bun tsgo`
Per the task spec, the sub-loop is `bun tsgo`.

```bash
$ cd /home/ahmed/Projects/siraj && bun tsgo
$ bun run scripts/restore-next-env-dts.ts && bun run scripts/lib/run-locked-cmd.ts tsgo tsgo -b --noEmit
[process-lock] Enqueued request for "tsgo" (PID: 1542159)
[process-lock] Acquired lock for "tsgo" (PID: 1542159). Executing...
[process-lock] Released lock for "tsgo" (PID: 1542159)
EXIT=0
---ERRORS---
0   # grep -c "error TS" /tmp/tsgo-out.txt
```

- **Exit code**: 0
- **`error TS` count**: 0
- **Baseline (Task 0.1)**: 0 — no regression introduced.

## Carry-Forward Knowledge
1. **Enum value & string**: `AppPermission.SETTINGS_APPEARANCE_MANAGE` =
   `"settings.appearance_manage"` (snake_case key, dot-path string value).
2. **GraphQL codegen naming**: After Task 3 runs
   `bun run generate:gqlSchema && bun codegen`, the generated TypeScript enum
   will be exposed as `AppPermission.SettingsAppearanceManage` (Pothos enums
   are PascalCase in the GraphQL schema, then codegen emits them as TS enum
   members). Task 5 wires this into `page-permissions.types.ts` as
   `[AppPermission.SettingsAppearanceManage, AppPermission.SettingsView]`.
3. **Seed SQL key**: The permission `key` column value must be exactly
   `settings.appearance_manage`; `category` = `settings`;
   `slug` = `appearance_manage`. Task 1.1 mirrors `7b-settings-permissions-data.sql`.
4. **Group grants**: Per `decisions.md` §5, both `super_admin` and
   `academy_admin` receive this permission — Task 1.1 inserts both
   `group_permissions` rows.
5. **No frontend code should import from `@/backend/enum`** — the frontend
   consumes the codegen enum only. Task 3 verifies the generated enum exists.
6. **Placement convention**: New `SETTINGS_*` permissions may be added in the
   existing `// Settings (...)` block; ordering is logical (group `*_MANAGE`
   together), not strictly alphabetical.

## Files NOT Modified
- No other files were modified in this task. The barrel
  `backend/enum/permissions/index.ts` and `backend/enum/index.ts` already
  re-export `permission.enum.ts`; no changes were needed there.
