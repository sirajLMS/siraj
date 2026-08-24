# Task 5 — Wire the `appearance` tab

## Summary

Added the `appearance` tab to the Settings page tab nav, with its permission
binding, icon, label key, and i18n label stub. The tab becomes visible to any
user holding `SETTINGS_APPEARANCE_MANAGE` or `SETTINGS_VIEW`. The form view
itself (`AppearanceSettingsTab`) lands in Task 5.2; this task only wires the
nav + permissions + label.

## Files modified (6)

### Task-spec files (3)

| # | File | Change |
|---|---|---|
| 1 | `frontend/common/views/dashboard/settings/types/settings.types.ts` | `SettingsTabId` union: added `\| "appearance"`. |
| 2 | `frontend/common/views/dashboard/settings/config/settingsTabs.config.ts` | Imported `PaletteOutlined` from `@mui/icons-material`; appended new tab entry `{ id: "appearance", labelKey: "appearance", permissions: PAGE_PERMISSIONS.settingsAppearance, icon: PaletteOutlined }` to `SETTINGS_TABS`. |
| 3 | `frontend/common/types/page-permissions.types.ts` | Added `settingsAppearance: [AppPermission.SettingsAppearanceManage, AppPermission.SettingsView] as PagePermissions` immediately after `settingsMeetingIntegrations`. |

### Tsgo-gate accommodations (3) — minimal `tabs.appearance` label stub

The task requires `bun tsgo` to report 0 errors. Because
`SettingsTabLabelKey = keyof SettingsLabels["tabs"]`, adding `labelKey:
"appearance"` requires the `appearance` key to exist on the `tabs` interface.
Task 5.1 ("Add `appearance` tab label + form view strings") owns the broader
label work, but its tsgo gate cannot be reached if Task 5 already breaks
the build. To keep the build green without stealing 5.1's substantive scope
(form view strings), I added the **minimal tab-label stub only** — a single
`appearance: string` type + a single placeholder string per locale. Task 5.1
will add the form view strings and can revise the placeholder label as needed.

| # | File | Change |
|---|---|---|
| 4 | `shared/locale/types/dashboard/settings/main.ts` | Added `readonly appearance: string;` to the `SettingsLabels["tabs"]` interface. |
| 5 | `shared/locale/en/dashboard/settings/main.ts` | Added `appearance: "Appearance",` to the `tabs` object. |
| 6 | `shared/locale/ar/dashboard/settings/main.ts` | Added `appearance: "المظهر",` to the `tabs` object. |

## Design adherence

### AC-5 — Tab visibility gated by `SETTINGS_APPEARANCE_MANAGE`

`PAGE_PERMISSIONS.settingsAppearance = [SETTINGS_APPEARANCE_MANAGE,
SETTINGS_VIEW]`. The existing `getVisibleSettingsTabs(hasPermission)` helper
filters tabs whose `permissions` array contains any permission the user holds
— so admins with `SETTINGS_APPEARANCE_MANAGE` (or anyone with the broader
`SETTINGS_VIEW`) will see the new tab. No changes needed to the visibility
helper itself.

### AC-6 — Tab appears in Settings → tab nav

`SETTINGS_TABS` is the single source of truth consumed by the Settings tab
nav (Task 5.2 will wire the lazy `AppearanceSettingsTab` panel into
`SettingsTabPanels.tsx`). Position: appended after `meetingIntegrations` as
the last tab. Icon `PaletteOutlined` is the MUI v9-named variant per
`frontend/AGENTS.md` ("`*Outline` → `*Outlined`").

## Verification

- `bun tsgo` — exit 0, 0 errors (was 1 error before the locale stub
  accommodation: `settingsTabs.config.ts(60,5): error TS2322: Type
  '"appearance"' is not assignable to type '"audit" | "environment" | ...'`).

## Cross-file dependencies (read, not modified)

| Symbol | Imported from | Purpose |
|---|---|---|
| `AppPermission.SettingsAppearanceManage` | `@/frontend/common/graphql/generated/gql/graphql` | Permission enum value created in Task 1 (codegenned in Task 3). Verified present (line 193). |
| `AppPermission.SettingsView` | same | Pre-existing permission used by every other settings tab. |
| `PaletteOutlined` | `@mui/icons-material` | MUI icon; verified the `.d.ts`/`.js` files exist in `node_modules`. |
| `SettingsLabels` | `@/shared/locale/types/dashboard/settings` | Source of `SettingsTabLabelKey` — `keyof SettingsLabels["tabs"]`. |
| `PAGE_PERMISSIONS` | `@/frontend/common/types/page-permissions.types` | The permissions registry consumed by `settingsTabs.config.ts`. |

## Downstream wiring (Task 5.2 — not done here)

- Add a lazy `AppearanceSettingsTab` panel to
  `frontend/common/views/dashboard/settings/SettingsTabPanels.tsx` matching
  the existing `Lazy*` pattern.
- Add `AppPermission.SETTINGS_APPEARANCE_MANAGE` to the `withPageAuth` allow
  list in `app/(dashboard)/settings/page.tsx`.

## Notes

- No `AGENTS.md` files exist for the specific edited directories
  (`frontend/common/views/dashboard/settings/{types,config}/`,
  `frontend/common/types/`, `shared/locale/{types,en,ar}/dashboard/settings/`);
  the root `frontend/AGENTS.md` rules were applied (MUI v9 icon naming,
  theme palette access, no nested ternaries — none triggered).
- The `appearance` tab will render with a "Coming soon" or empty panel until
  Task 5.2 wires `AppearanceSettingsTab` into `SettingsTabPanels.tsx`.
