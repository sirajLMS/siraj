# Task 6 — Customize header button (permission-gated)

## Summary

Added a new `CustomizeButton` component to the dashboard header (both
desktop and mobile) that renders an amber, permission-gated CTA linking
to the current URL with `?customize=1` appended (existing query params
preserved). The button is the dashboard-level entry point to the
site-appearance customizer overlay (mounted in Task 6.1 by reading the
`customize` search param).

The button only renders when the current user holds
`AppPermission.SETTINGS_APPEARANCE_MANAGE` (Task 1 enum, Task 3
codegen). For users without the permission, `RequirePermission` renders
its default `null` fallback — no button, no layout shift, no info leak.

## Requirements Coverage

- **AC-18** — Dashboard header exposes a "Customize" entry point.
  - `CustomizeButton` is rendered as the first element of the desktop
    `TopNavbarIslandDesktop` (leftmost slot in the header toolbar,
    before `ThemeSwitcher`) and the mobile `NavbarChrome` `rightSlot`
    (before `ThemeSwitcher`). Both layouts now show the amber button on
    every dashboard route.
- **AC-19** — The CTA navigates to the customizer overlay via the
  `?customize=1` search param.
  - The button is a Next.js `<Link>` (via `component={Link}` on MUI
    `Button`) whose `href` is built from `usePathname()` + a clone of
    `useSearchParams()` with `customize=1` set. Existing query params
    (e.g. `?tab=appearance`, `?classId=123`) are preserved by the
    `URLSearchParams` clone-and-set pattern — only `customize` is
    added/overwritten. Task 6.1 will read `customize` from
    `useSearchParams` in the root layout / dashboard shell and mount
    `CustomizeToolbar` + `CustomizeSidebar`.

## Files Modified

### Created (1 new file)

1. **`frontend/common/views/dashboard/components/navbar/CustomizeButton.tsx`** (~50 lines)
   - Self-contained client component (needs `usePathname` /
     `useSearchParams` / `useAppTranslation` hooks).
   - Wraps its body in `<RequirePermission
     permissions={AppPermission.SettingsAppearanceManage}>` — the
     same permission wrapper used by `NotificationButton` in the same
     folder, so the pattern is consistent with the existing navbar
     residents. No `fallback` prop means the default `null` is used
     when the user lacks the permission (button simply does not
     render).
   - Builds the customize href declaratively:
     `const customizeParams = new URLSearchParams(searchParams?.toString() ?? ""); customizeParams.set("customize", "1"); const href = pathname + "?" + customizeParams.toString();`
     This preserves any existing query params (e.g. `?tab=appearance`)
     because `URLSearchParams` is constructed from the current search
     string and only `customize` is set — other entries are untouched.
   - Renders an MUI `Button` with:
     - `component={Link}` — integrates with the Next.js App Router via
       the `@/shared/i18n/link` wrapper (which defaults
       `prefetch={false}` to avoid the dashboard prefetch loop
       documented in `shared/i18n/link.tsx`).
     - `variant="contained"` + `color="warning"` — the MUI `warning`
       palette token is the amber family (`lightPalette.ts` comments
       explicitly call out "Soft warm amber background" for the
       adjacent `pendingContainer` token). This satisfies the task
       spec "amber color (from theme, not hardcoded hex)" without
       introducing any hex/rgb literal (frontend/AGENTS.md
       "NO hardcoded colors").
     - `sx={{ color: theme => theme.palette.onWarning }}` — overrides
       the contained variant's default `contrastText` foreground with
       the Material 3 `onWarning` sibling token, per the AGENTS.md
       rule "Use Material 3 `on<Color>` siblings instead of
       `contrastText`".
     - `size="small"` — matches the navbar's compact control density.
     - `startIcon={<PaletteOutlined />}` — the same icon used by the
       Settings → Appearance tab nav entry (Task 5,
       `settingsTabs.config.ts`), so the user sees a consistent glyph
       in both places.
   - Label comes from `t.customizeButton` (new i18n string, see below).

### Edited (4 existing files)

2. **`frontend/common/views/dashboard/components/navbar/index.ts`**
   - Added `export * from "./CustomizeButton";` as the first barrel
     entry (alphabetical order ahead of `LanguageSwitcher`).

3. **`frontend/desktop/views/dashboard/components/topNavbarIsland.desktop.tsx`**
   - Added `CustomizeButton` to the named import from the navbar
     barrel.
   - Rendered `<CustomizeButton />` as the first child inside the
     `<>` fragment (before `<ThemeSwitcher />`).

4. **`frontend/mobile/views/dashboard/components/dashboardLayout.mobile.tsx`**
   - Added `CustomizeButton` to the named import from the navbar
     barrel.
   - Rendered `<CustomizeButton />` as the first child inside the
     `NavbarChrome` `rightSlot` fragment (before `<ThemeSwitcher />`).

5. **i18n — 3 files edited** to add the `customizeButton` label:
   - `shared/locale/types/dashboard/core/layout.ts` — added
     `readonly customizeButton: string;` to `DashboardCoreLayoutLabels`.
   - `shared/locale/en/dashboard/core/layout.ts` — added
     `customizeButton: "Customize",`.
   - `shared/locale/ar/dashboard/core/layout.ts` — added
     `customizeButton: "تخصيص",`.
   - **Why `Dashboard.CoreLayout` and not `Dashboard.Settings.appearance`?**
     The button lives in the global dashboard header (not the Settings
     tab), and `NavbarChrome` already consumes
     `Translation.Dashboard.CoreLayout` for `appTitle`. Putting the
     label in the same namespace keeps header chrome strings together
     and avoids cross-namespace coupling. The `appearance.*`
     sub-namespace remains the home for in-tab labels (Task 5.1), with
     the longer `enterCustomizeMode` string used by the tab's primary
     CTA — the header button uses the shorter `customizeButton` because
     header real estate is scarce.

## Design Adherence

### Permission gating pattern

Matches `NotificationButton.tsx` (same folder): wraps its body in
`<RequirePermission permissions={[AppPermission.NotificationViewAlerts]}>`.
`CustomizeButton` uses the same wrapper with
`AppPermission.SettingsAppearanceManage`. The `RequirePermission`
component internally calls `useUserStore().hasPermission(...)` and
returns the `fallback` (default `null`) when unauthorized — so the
button is completely absent from the DOM for users without the
permission, with no layout shift.

### Theme color usage

`color="warning"` is the MUI palette shorthand for
`theme.palette.warning`. The `warning` palette is augmented in
`frontend/common/providers/theme/types.ts` with `M3ColorSiblings<"warning">`,
so `theme.palette.onWarning`, `theme.palette.warningContainer`, and
`theme.palette.onWarningContainer` are all available. The button uses:
- Background: `theme.palette.warning.main` (via `color="warning"` on
  the contained variant).
- Foreground: `theme.palette.onWarning` (via explicit `sx` override,
  replacing the contained variant's default `contrastText`).

No hex/rgb literals, no string-based palette access — complies with
frontend/AGENTS.md "Theme and Styling Rules".

### Link vs. button+router.push

Used `component={Link}` + `href` rather than `onClick` +
`router.push(...)`. Reasons:
1. **Semantic**: a navigation CTA is a link, not a button action.
   Screen readers announce it as "link" and users can
   ctrl/middle-click to open in a new tab.
2. **Prefetch control**: the `@/shared/i18n/link` wrapper defaults
   `prefetch={false}` — the dashboard prefetch loop documented in
   `link.tsx` is avoided.
3. **No `window.location.href`**: the in-tab CTA in
   `AppearanceSettingsTab.tsx` (Task 5.2) uses `window.location.href`
   inside an `onClick`, but that approach loses middle-click/keyboard
   nav. The header CTA can compute its href declaratively from
   `usePathname` + `useSearchParams`.
4. **Pattern precedent**: `StyledViewProfileButton = styled(Link)`
   in `profileCardShared.ts` uses the same `Link`-as-navigable-button
   pattern.

### `useSearchParams` SSR safety

`useSearchParams()` returns `null` during static rendering and a live
`URLSearchParams` on the client. The component handles both via
`searchParams?.toString() ?? ""` — when null, the href is
`${pathname}?customize=1` (no existing params to preserve), which is
correct. The dashboard is a dynamic route (auth-gated,
`withPageAuth`), so `useSearchParams` returns a live value at runtime;
the null guard is defensive only.

No `<Suspense>` boundary is needed around `CustomizeButton` because
the dashboard layout is dynamic (not statically prerendered) —
`useSearchParams` does not trigger Suspense fallbacks in dynamic
routes. The same pattern is used by `useTabbedPane.ts` and
`TeacherProfileEditForceCompleteGuard.tsx` without Suspense wrappers.

## Cross-file Dependencies

### Producers (this task)

- `frontend/common/views/dashboard/components/navbar/CustomizeButton.tsx`
  — the new component.
- `frontend/common/views/dashboard/components/navbar/index.ts` —
  barrel re-export.
- `frontend/desktop/views/dashboard/components/topNavbarIsland.desktop.tsx`
  — desktop render site.
- `frontend/mobile/views/dashboard/components/dashboardLayout.mobile.tsx`
  — mobile render site.
- `shared/locale/types/dashboard/core/layout.ts` — type addition.
- `shared/locale/en/dashboard/core/layout.ts` — EN impl.
- `shared/locale/ar/dashboard/core/layout.ts` — AR impl.

### Consumers (existing, read but not modified)

- `AppPermission.SettingsAppearanceManage` (Task 1 enum, Task 3
  codegen at `frontend/common/graphql/generated/gql/graphql.ts`).
- `RequirePermission` (`frontend/common/components/auth/RequirePermission.tsx`)
  — reads `useUserStore().hasPermission(...)`.
- `Link` (`shared/i18n/link.tsx`) — the Next.js `<Link>` wrapper with
  `prefetch={false}` default.
- `Translation.Dashboard.CoreLayout` (`@/shared/locale`) — the i18n
  namespace; `customizeButton` is the new key.
- `PaletteOutlined` (`@mui/icons-material`) — the icon; same glyph
  used by the Settings → Appearance tab nav entry.

### Downstream (Task 6.1 will consume)

- **`?customize=1` search param** — Task 6.1 reads
  `useSearchParams().get("customize")` in the root layout / dashboard
  shell and conditionally renders `CustomizeToolbar` above and
  `CustomizeSidebar` beside the app. This task produces the param;
  Task 6.1 consumes it.

## Quality Verification

### Per-file `sub-loop.ts --lifecycle codescene`

```
$ CODESCENE_BIN=/home/ahmed/.local/bin/cs bun run scripts/health/sub-loop.ts \
    frontend/common/views/dashboard/components/navbar/CustomizeButton.tsx \
    --lifecycle codescene

✅ tsgo passed
✅ oxlint passed
✅ biome:check passed
✅ lint:type-aware passed
✅ check:duplicates passed
✅ codescene passed
✅ All checks for lifecycle "codescene" passed for CustomizeButton.tsx
```

Also ran codescene sub-loop on the two edited view files:

```
$ bun run scripts/health/sub-loop.ts \
    frontend/desktop/views/dashboard/components/topNavbarIsland.desktop.tsx \
    --lifecycle codescene
✅ All 6 checks passed (tsgo / oxlint / biome / lint:type-aware / duplicates / codescene)

$ bun run scripts/health/sub-loop.ts \
    frontend/mobile/views/dashboard/components/dashboardLayout.mobile.tsx \
    --lifecycle codescene
✅ All 6 checks passed
```

The three i18n locale files (type + EN + AR) are covered by the
project-wide `bun tsgo` run below; they don't have their own codescene
lifecycle because they're data-only modules with no component logic.

### Project-wide `bun tsgo`

Exit 0, 0 `error TS` lines (matches Phase 0.1 baseline of 0 errors;
no regression introduced by the new file or the four edited files).

## Decisions

- **Single shared component vs. desktop/mobile split.** The navbar
  folder convention has no `.desktop.tsx` / `.mobile.tsx` split for
  its existing residents (`ThemeSwitcher`, `LanguageSwitcher`,
  `NotificationButton`, `UserMenuButton` are all single shared
  components). `CustomizeButton` follows the same pattern — the MUI
  `size="small"` prop keeps the button compact enough for both the
  64px desktop toolbar and the mobile `NavbarChrome`, and no
  `useMediaQuery` is needed.

- **`color="warning"` for amber.** The task spec says "amber color
  (from theme, not hardcoded hex)". MUI's `warning` palette is the
  amber family — `lightPalette.ts` line comment confirms the
  `pendingContainer` token (a sibling in the same warm-amber family)
  is "Soft warm amber background". Using `color="warning"` is the
  idiomatic MUI shorthand for `theme.palette.warning.main` and is
  already used elsewhere in the appearance feature
  (`AppearanceSettingsTab.tsx` uses `<Chip color="warning">` for the
  draft badge). No new theme tokens needed.

- **`customizeButton` label in `DashboardCoreLayoutLabels` vs.
  `SettingsAppearanceTabLabels`.** The header button is global dashboard
  chrome, not Settings-tab content. `DashboardCoreLayoutLabels` is the
  namespace consumed by `NavbarChrome` (for `appTitle`) — colocating
  the new label there keeps all header chrome strings in one type.
  The appearance sub-namespace remains the home for in-tab labels.
  The two labels (`customizeButton` = "Customize" vs.
  `enterCustomizeMode` = "Enter Customize Mode") are intentionally
  different: the header button is space-constrained and needs a
  one-word label; the in-tab CTA has room for the longer phrasing.

- **No `fallback` prop on `RequirePermission`.** The default `null`
  fallback means unauthorized users see no button at all — no
  "locked" icon, no "no permission" text. This matches the
  `NotificationButton` pattern (which also uses no `fallback`) and
  is the right UX for a global header CTA: showing a disabled or
  "locked" button to every user would clutter the header for the
  majority of users who don't have appearance-management permission.
  Permission-gated tabs/pages can afford a `noPermission` fallback
  because the user navigated there explicitly; a header button is
  ambient chrome and should be invisible when not applicable.

## Carry-Forward / Deferred

- **Customizer overlay mount** — Task 6.1. The `?customize=1` search
  param is produced by this button but not yet consumed; Task 6.1
  reads it in the root layout / dashboard shell and mounts
  `CustomizeToolbar` + `CustomizeSidebar` + collapses the dashboard
  sidebar to icon-only.
- **Active state styling** — When the customizer overlay is open
  (`?customize=1` is present), the button could visually indicate
  "active". Deferred to Task 6.1 / 6.2 — the toolbar's Exit button is
  the primary "leave customizer" affordance, so the header button
  doesn't strictly need an active state. If the design calls for it,
  Task 6.1 can read `useSearchParams().get("customize")` and pass an
  `active` prop.
- **Storybook stories** — Not added in this task. The existing
  navbar residents have stories (`UserMenuButton.stories.tsx`) but
  they're optional; `CustomizeButton` is simple enough (permission
  gate + link) that a story would be low-value. If a story is wanted
  for the permission-gated render, it can be added in a follow-up.

## Files Touched

| Path | Action | Lines |
|---|---|---|
| `frontend/common/views/dashboard/components/navbar/CustomizeButton.tsx` | Created | ~50 |
| `frontend/common/views/dashboard/components/navbar/index.ts` | Edited | +1 |
| `frontend/desktop/views/dashboard/components/topNavbarIsland.desktop.tsx` | Edited | +2 |
| `frontend/mobile/views/dashboard/components/dashboardLayout.mobile.tsx` | Edited | +2 |
| `shared/locale/types/dashboard/core/layout.ts` | Edited | +1 |
| `shared/locale/en/dashboard/core/layout.ts` | Edited | +1 |
| `shared/locale/ar/dashboard/core/layout.ts` | Edited | +1 |

## Issues / Open Questions

- **No issues.** All 6 codescene-lifecycle checks pass on the new
  `CustomizeButton.tsx` and both edited view files. Project-wide
  `bun tsgo` reports 0 errors. The permission gate cleanly hides
  the button for unauthorized users with no layout shift. The
  `?customize=1` href is built declaratively from current pathname +
  search params, preserving existing query state.
- **Open question for Task 6.1**: when the customizer overlay is
  mounted via `?customize=1`, should the header `CustomizeButton` be
  hidden (to avoid a redundant CTA while already in customizer mode)
  or kept visible (as a quick "exit" affordance)? The Task 6.1 spec
  has a dedicated Exit button in `CustomizeToolbar`, so hiding the
  header button while `customize=1` is present would avoid double
  affordances. Left to Task 6.1's design pass.
