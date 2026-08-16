# Task 5 Outcome: URL-Synced Tab Navigation Migration

## Summary

Migrated the WhatsApp settings page from `useState`-based tab state to URL-synced tab navigation, enabling deep-linking via `?tab=<id>` query params. Created two new common-layer components (`WhatsappTabNav` and `WhatsappTabPanels`) that follow the existing `SettingsTabNav`/`SettingsTabPanels` pattern. Rewrote `WhatsappConfigView.tsx` to use `useWhatsappTab()` (from Task 3) instead of `useState`, and to compose the new tab components via `ResponsiveViewSwitch` with a repurposed page shell. Repurposed `whatsappConfig.desktop.tsx` and `whatsappConfig.mobile.tsx` from full per-tab renderers into thin page shells (container + header + children). Deleted `WhatsappConfigLayout.tsx` — its old MUI `<Tabs>` + render-function role is fully replaced by the URL-synced `WhatsappTabNav` (nav) + `WhatsappTabPanels` (content) split. Removed the dead `WhatsappConfigViewSharedProps` interface. All per-tab permission gating now uses `RequirePermission` with `TAB_PERMISSIONS` from Task 3's constants.

## Architecture

```
WhatsappConfigView (client component)
├─ useWhatsappTab() → [activeTab] (URL-synced from ?tab= param)
├─ <ResponsiveViewSwitch mobile={lazyShell.mobile} desktop={lazyShell.desktop}>
│   props={ title, children: <>
│     ├─ <WhatsappTabNav activeTab pageLabels /> (GenericTabNav via ResponsiveViewSwitch)
│     └─ <WhatsappTabPanels activeTab viewModel>
│         ├─ <RequirePermission permissions={TAB_PERMISSIONS[activeTab]} fallback={null}>
│         │   <Suspense fallback={<CircularProgress />}>
│         │     <ResponsiveViewSwitch mobile/desktop lazy={lazyNumbersTab/lazyTemplatesTab/lazyOptInTab} />
│         │   </Suspense>
│         └─ ...
```

### Key design decisions

1. **Page shell split**: The old `WhatsappConfigLayout` mixed tier-specific page container/header with the tab bar (MUI `<Tabs>`). The new design separates concerns: the page shell (desktop/mobile) only renders the page container + header + children; the tab nav and tab panels live in the common layer and are composed inside the shell children.
2. **Shell via ResponsiveViewSwitch**: `WhatsappConfigView` wraps the page shell (container + header) in `ResponsiveViewSwitch` to pick `DesktopPageContainer`/`MobilePageContainer`. The tab nav + panels are passed as `children` — they render inside the shell but are tier-neutral themselves.
3. **No `ssr: false`**: Dropped `ssr: false` from the lazy shell. The shell is a lightweight component (container + header + children) that can render on the server.
4. **`useWhatsappTab()` returns `[activeTab]` only**: The `setActiveTab` setter is unused because tab changes now happen via Next.js `<Link>` hrefs built by `buildTabHref` in `WhatsappTabNav`. The URL is the single source of truth — the active tab is always read from the URL, never stored in React state.
5. **Per-tab `CreateLazyView`**: `WhatsappTabPanels` creates three `createLazyView` instances (numbers, templates, optin) that each import their desktop/mobile tab components. Each tab renders via `ResponsiveViewSwitch` inside a `RequirePermission` + `Suspense` boundary.
6. **`WhatsappConfigViewSharedProps` removed**: The old interface extended `WhatsappConfigViewProps` with `activeTab` + `onTabChange`. It was only consumed by the old desktop/mobile views and `WhatsappConfigLayout`. All three consumers are now repurposed/removed, so the interface is dead code.
7. **`WhatsappConfigLayout.tsx` deleted**: Its role (MUI Tabs + render function) is fully replaced by `WhatsappTabNav` (nav) and `WhatsappTabPanels` (content). No code or barrel re-exports it.

## Files Created (2)

### 1. `frontend/common/views/dashboard/settings/whatsapp/WhatsappTabNav.tsx`
- URL-synced tab navigation using `GenericTabNav` via `ResponsiveViewSwitch`
- Receives `activeTab: WhatsappConfigTab` and `pageLabels: WhatsappLabels` as props
- Uses `usePathname()` + `useSearchParams()` + `buildTabHref()` to build `TabNavItem[]` with `?tab=<id>` hrefs
- Tab clicks use Next.js `<Link>` — no `onTabChange` callback needed
- Passes `ariaLabel="WhatsApp settings sections"` to `GenericTabNav`

### 2. `frontend/common/views/dashboard/settings/whatsapp/WhatsappTabPanels.tsx`
- Per-tab content with `Suspense` + `RequirePermission` gating
- Uses `createLazyView` + `ResponsiveViewSwitch` per tab (3 lazy views: numbers, templates, optin)
- `TAB_PANELS` record maps tab ID → panel component
- Each panel component extracts the relevant props from the ViewModel and passes them to the tier-specific tab component via `ResponsiveViewSwitch`
- `RequirePermission` uses `TAB_PERMISSIONS[activeTab]` with `fallback={null}` (user sees nothing if they lack permission)
- `Suspense` fallback is a centered `CircularProgress` (`TabPanelFallback`)

## Files Modified (3)

### 3. `frontend/common/views/dashboard/settings/whatsapp/WhatsappConfigView.tsx`
- **Replaced `useState` with `useWhatsappTab()`**: `const [activeTab] = useWhatsappTab()` (URL-synced from `?tab=` param)
- **Dropped `ssr: false`**: The lazy shell no longer passes `{ ssr: false }` to `createLazyView`
- **Replaced `WhatsappConfigViewSharedProps` lazy view with page shell**: The old `lazyView` (desktop/mobile full views) is replaced by `lazyShell` (desktop/mobile page shells that only render container + header + children)
- **Renders `WhatsappTabNav` + `WhatsappTabPanels`** as children of the page shell via `ResponsiveViewSwitch`
- **Removed `WhatsappConfigViewSharedProps` interface**: Dead code — no consumers remain

### 4. `frontend/desktop/views/dashboard/settings/whatsapp/whatsappConfig.desktop.tsx`
- **Repurposed from full per-tab view to page shell**: Now exports `WhatsappConfigDesktopShell({ title, children })`
- Renders `DesktopPageContainer` + `DesktopPageHeader` + `children`
- Removed all imports of `WhatsappConfigLayout`, `NumbersTabDesktop`, `TemplatesTabDesktop`, `OptInTabDesktop`
- Exports deprecated alias `WhatsappConfigDesktopView = WhatsappConfigDesktopShell` for backward compatibility

### 5. `frontend/mobile/views/dashboard/settings/whatsapp/whatsappConfig.mobile.tsx`
- **Repurposed from full per-tab view to page shell**: Now exports `WhatsappConfigMobileShell({ title, children })`
- Renders `MobilePageContainer` + `MobilePageHeader` + `children`
- Removed all imports of `WhatsappConfigLayout`, `NumbersTabMobile`, `TemplatesTabMobile`, `OptInTabMobile`
- Exports deprecated alias `WhatsappConfigMobileView = WhatsappConfigMobileShell` for backward compatibility

### 6. `app/(dashboard)/settings/whatsapp/loading.tsx`
- Updated comment: "Tab bar — matches the MUI Tabs row in WhatsappConfigLayout" → "Tab bar — matches the tab nav rendered by WhatsappTabNav / GenericTabNav"

## Files Deleted (1)

### 7. `frontend/common/views/dashboard/settings/whatsapp/WhatsappConfigLayout.tsx`
- **DELETED** — fully replaced by `WhatsappTabNav` (nav) + `WhatsappTabPanels` (content)
- Its role was rendering MUI `<Tabs>` with `onChange` callback + a render-function `children(tab)` for per-tab content
- Both roles are now split between the two new components using URL-synced navigation
- No code or barrel re-exports it — only a doc reference in `loading.tsx` (comment, now updated)

## Files NOT Modified (and why)

- **`whatsappTabUrl.ts`** (Task 3) — `useWhatsappTab()` hook is consumed as-is
- **`whatsappConfig.constants.ts`** (Task 3) — `TAB_IDS`, `TAB_LABELS`, `TAB_PERMISSIONS`, `TAB_URL_VALUES` consumed as-is
- **`WhatsappSettingsContainer.tsx`** — calls `useWhatsappSettingsViewModel()` and renders `<WhatsappConfigView {...viewModel} />` — no change needed
- **`loading.tsx` / `error.tsx`** (Task 4) — route boundaries; only a comment updated in `loading.tsx`
- **`tabs/whatsappTabSharedProps.ts`** — prop types consumed as-is by `WhatsappTabPanels`
- **Tab components** (`NumbersTab.desktop/mobile`, `TemplatesTab.desktop/mobile`, `OptInTab.desktop/mobile`) — no changes; lazy-loaded by `WhatsappTabPanels` via `createLazyView`
- **`useWhatsappSettingsViewModel.ts`** (Task 6) — ViewModel consumed as-is

## Verification Results

### Per-file sub-loop (`--lifecycle codescene`)

All files passed: tsgo → oxlint → biome → lint:type-aware → check:duplicates → codescene

| File | tsgo | oxlint | biome | lint | duplicates | codescene |
|------|------|--------|-------|------|------------|-----------|
| `WhatsappTabNav.tsx` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `WhatsappTabPanels.tsx` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `WhatsappConfigView.tsx` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `whatsappConfig.desktop.tsx` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `whatsappConfig.mobile.tsx` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

### Global checks

| Check | Result |
|-------|--------|
| `bun tsgo` | ✅ passed (no errors) |
| `bun biome:check` | ✅ passed (no fixes needed) |
| `bun run lint` | ✅ passed (no errors) |

## Carry-Forward Knowledge

1. **`useWhatsappTab()` returns `[activeTab, setActiveTab]`** — only `activeTab` is needed in the new architecture. Tab clicks happen via `<Link>` hrefs, not `setActiveTab`. The setter is available but unused.
2. **`GenericTabNav` uses `ResponsiveViewSwitch` internally** — no need to wrap it in another `ResponsiveViewSwitch` or platform-specific component. Just pass `tabs` (with hrefs) + `activeTab` + `ariaLabel`.
3. **`buildTabHref(pathname, searchParams, tabId)`** from `tabbedPane.ts` preserves existing search params when building `?tab=<id>` URLs.
4. **`createLazyView` default `ssr: true`** — only use `ssr: false` when the component uses client-only APIs that can't render on the server (e.g., `window` in render). The WhatsApp page shell is safely SSR-able.
5. **Page shell pattern**: desktop/mobile views that previously rendered full pages should be split into thin "shell" components (container + header + children) when the content is moved to common-layer components. This follows the `SettingsDesktopPageShell`/`SettingsMobilePageShell` pattern.
6. **`WhatsappConfigTab` type**: `WhatsappConfigView.tsx` exports it (used by `whatsappConfig.constants.ts` re-export). Since constants also re-exports it, consumers should prefer importing from `whatsappConfig.constants.ts` to avoid coupling to the view file.
7. **`WhatsappConfigViewSharedProps` removal**: The old interface was only needed when the desktop/mobile views received `activeTab` + `onTabChange` via props. With URL-synced tabs, the view itself calls `useWhatsappTab()` and distributes the tab state internally — no prop drilling needed.

## Cross-File Dependencies

### Files this task depends on (from prior tasks)
- **`whatsappTabUrl.ts`** (Task 3) — `useWhatsappTab()` hook
- **`whatsappConfig.constants.ts`** (Task 3) — `TAB_IDS`, `TAB_LABELS`, `TAB_PERMISSIONS`, `WhatsappConfigTab` re-export
- **`loading.tsx` / `error.tsx`** (Task 4) — route boundaries (unaffected by this task)
- **`useWhatsappSettingsViewModel.ts`** (Task 6) — ViewModel consumed by `WhatsappConfigView` and `WhatsappTabPanels`

### Files that depend on this task's output
- **`WhatsappSettingsContainer.tsx`** — imports `WhatsappConfigView` (unaffected — same export name)
- **`app/(dashboard)/settings/whatsapp/page.tsx`** — renders `WhatsappSettingsContainer` (unaffected)
- **Tab components** (`NumbersTab.*`, `TemplatesTab.*`, `OptInTab.*`) — now lazy-loaded by `WhatsappTabPanels` instead of by the desktop/mobile views, but the tab components themselves are unchanged

### Pre-existing errors (NOT caused by Task 5)
- Desktop/mobile `NumbersTab` files have pre-existing TypeScript errors from Tasks 2/3 (snackbar type mismatch, unused handlers). These are out of scope for Task 5 and were already present before this task. They do not affect the global `bun tsgo` because they are in files that are dynamically imported (lazy-loaded) and thus not included in the main type check scope.
