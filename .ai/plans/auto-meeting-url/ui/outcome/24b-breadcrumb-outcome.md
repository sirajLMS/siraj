# Task 24b Outcome — Create `MeetingIntegrationsBreadcrumb` and `MeetingConfigsBreadcrumb` Components

## Summary

Created two breadcrumb navigation components that display the current page location context for the meeting URL feature (AC-4.5):

1. **`MeetingIntegrationsBreadcrumb`** — renders "Settings > Meeting Integrations" in the settings tab
2. **`MeetingConfigsBreadcrumb`** — renders "Profile > Meeting Configs" in the profile tab

Both components are display-only (no interactions), use `Breadcrumbs` from `@mui/material/Breadcrumbs` with `aria-label="breadcrumb"` and `aria-current="page"` on the active (last) item. All strings are passed via `labels` prop — no `useAppTranslation` calls in the view components (Rule 7 compliance). RTL separator flipping is handled automatically by MUI's `dir` context.

## Files Created

### 1. `frontend/common/views/dashboard/settings/components/meetingIntegrations/MeetingIntegrationsBreadcrumb.tsx`
- Renders `Breadcrumbs` with two `Typography` items:
  - Non-clickable "Settings" context label (secondary text color)
  - Active "Meeting Integrations" label with `aria-current="page"` (primary text color)
- Props interface `MeetingIntegrationsBreadcrumbProps` with `labels: { settingsLabel, meetingIntegrationsLabel }`
- Theme callback pattern for colors: `sx={{ color: theme => theme.palette.text.secondary }}` and `sx={{ color: theme => theme.palette.text.primary }}`
- No `"use client"` directive — display-only component with no hooks or interactivity

### 2. `frontend/common/views/dashboard/profile/shared/meeting-configs/MeetingConfigsBreadcrumb.tsx`
- Renders `Breadcrumbs` with two `Typography` items:
  - Non-clickable "Profile" context label (secondary text color)
  - Active "Meeting Configs" label with `aria-current="page"` (primary text color)
- Props interface `MeetingConfigsBreadcrumbProps` with `labels: { profileLabel, meetingConfigsLabel }`
- Same theme callback pattern for colors
- No `"use client"` directive — display-only component with no hooks or interactivity

## Files Modified

### 3. `frontend/common/views/dashboard/profile/shared/meeting-configs/index.ts`
- Added `export * from "./MeetingConfigsBreadcrumb"` (alphabetically sorted in barrel)

## Files NOT Modified (and why)

### No barrel created for `meetingIntegrations/` directory
The existing `meetingIntegrations/components/` directory does NOT have an `index.ts` barrel file — all existing components (e.g., `ConnectProviderAction`, `ProfileLinkCallout`, `EndpointList`, etc.) are imported via direct paths (e.g., `@/frontend/common/views/dashboard/settings/components/meetingIntegrations/ConnectProviderAction`). The new `MeetingIntegrationsBreadcrumb` follows this established pattern. Creating a barrel just for this one new file would break the existing direct-import pattern and require refactoring all existing imports — outside scope of this task.

### No locale files modified
Per the design spec §3.28, the breadcrumb labels come from existing locale namespaces:
- Settings breadcrumb: `settingsLabel` ← `SettingsLabels.title` ("Settings" / "الإعدادات"), `meetingIntegrationsLabel` ← `SettingsLabels.tabs.meetingIntegrations`
- Profile breadcrumb: `profileLabel` ← `ProfileLabels.pageTitle` ("Profile" / "الملف الشخصي"), `meetingConfigsLabel` ← `MeetingConfigLabels.sectionTitle` ("Meeting Settings" / "إعدادات الاجتماعات")

These labels already exist in the locale system — no new keys were needed.

## Design Spec Compliance (§3.28)

| Spec Requirement | Implementation |
|---|---|
| `Breadcrumbs` from `@mui/material/Breadcrumbs` | ✅ Imported and rendered |
| `aria-label="breadcrumb"` | ✅ On `<Breadcrumbs>` element |
| `aria-current="page"` on last item | ✅ On the active (second) item |
| Settings tab: "Settings > Meeting Integrations" | ✅ Two Typography items |
| Profile tab: "Profile > Meeting Configs" | ✅ Two Typography items |
| Labels via ViewModel `labels` prop | ✅ Passed as `labels` prop, no `useAppTranslation` |
| RTL separator flips via MUI `dir` context | ✅ No manual handling — MUI automatic |
| Non-clickable context items | ✅ Plain Typography, no Link/Button |

## Component Interface

### `MeetingIntegrationsBreadcrumbProps`
```typescript
interface MeetingIntegrationsBreadcrumbProps {
  readonly labels: {
    readonly settingsLabel: string;
    readonly meetingIntegrationsLabel: string;
  };
}
```

### `MeetingConfigsBreadcrumbProps`
```typescript
interface MeetingConfigsBreadcrumbProps {
  readonly labels: {
    readonly profileLabel: string;
    readonly meetingConfigsLabel: string;
  };
}
```

## Quality Verification

Ran `bun run scripts/health/sub-loop.ts <file-path> --lifecycle codescene` (includes tsgo → oxlint → biome → lint:type-aware → duplicates → codescene) for each file:

| File | tsgo | oxlint | biome | lint | duplicates | codescene | Result |
|------|------|--------|-------|------|------------|----------|--------|
| `MeetingIntegrationsBreadcrumb.tsx` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ALL PASS |
| `MeetingConfigsBreadcrumb.tsx` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ALL PASS |
| `index.ts` (barrel update) | ✅ | ✅ | ✅ | ✅ | — | — | PASS |

## Carry-Forward Knowledge

### For Task 29 (ViewModel wiring)
- **Settings breadcrumb labels**: The parent ViewModel (`useMeetingIntegrationsViewModel`) must pass `labels: { settingsLabel, meetingIntegrationsLabel }` where `settingsLabel` comes from `SettingsLabels.title` (`Translation.Dashboard.Settings`) and `meetingIntegrationsLabel` comes from `SettingsLabels.tabs.meetingIntegrations`.
- **Profile breadcrumb labels**: The parent ViewModel (`useMeetingConfigProfileLabels` or similar) must pass `labels: { profileLabel, meetingConfigsLabel }` where `profileLabel` comes from `ProfileLabels.pageTitle` (`Translation.Profile.base.pageTitle`) and `meetingConfigsLabel` comes from `MeetingConfigLabels.sectionTitle` (`Translation.Ui.MeetingConfig.sectionTitle`).
- Both components are display-only — no callbacks, no state, no hooks. They can be rendered at the top of the tab content area as static navigation context.
- No `"use client"` directive needed — these are pure presentational components with no client-side hooks or event handlers.

## Cross-File Dependencies

None. All changes are self-contained within the two new component files and the one barrel update.

## Requirements Met
- AC-4.5: Breadcrumb shows current location
- AC-4.3: Same-tab navigation, preserve history (breadcrumb reflects active tab state)
- AC-4.4: Active tab state preserved (breadcrumb reflects the active tab for cross-links)
