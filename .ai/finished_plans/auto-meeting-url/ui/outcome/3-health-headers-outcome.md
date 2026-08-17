# Task 3: Redesign MeetingIntegrationsHealthHeaders with MetricCardGrid

## Summary

Replaced the raw `Card` + `Grid` layout in `MeetingIntegrationsHealthHeaders` with a three-tier `ResponsiveViewSwitch` architecture that switches between `DesktopMetricCardGrid` (desktop) and `MobileMetricCardGrid` (mobile). The component renders 4 metric cards (Total Providers, Connected, Issues, Disconnected) using the `MetricItem` shape from `shared.types.ts`. All label strings come pre-resolved from the ViewModel's `labels` prop — no `useAppTranslation` in the view component.

## Files Created

| # | File | Purpose |
|---|------|---------|
| 1 | `frontend/common/views/dashboard/settings/components/meetingIntegrations/__shared__/meetingIntegrationsHealthHeadersShared.tsx` | Shared scaffold component with `renderSkeleton`/`renderMetrics` slot props |
| 2 | `frontend/common/views/dashboard/settings/components/meetingIntegrations/__shared__/meetingIntegrationsHealthHeadersShared.helpers.ts` | `buildHealthHeaderMetrics()` — builds 4 `MetricItem[]` from `MeetingIntegrationsViewModel` |
| 3 | `frontend/common/views/dashboard/settings/components/meetingIntegrations/__shared__/index.ts` | Barrel for `__shared__` |
| 4 | `frontend/desktop/views/dashboard/settings/components/meetingIntegrations/meetingIntegrationsHealthHeaders.desktop.tsx` | Desktop variant — `DesktopMetricCardGrid` with `size={{ xs: 6, md: 3 }}` |
| 5 | `frontend/desktop/views/dashboard/settings/components/meetingIntegrations/index.ts` | Desktop barrel (also re-exports `ConnectedAccountsTable.desktop`) |
| 6 | `frontend/mobile/views/dashboard/settings/components/meetingIntegrations/meetingIntegrationsHealthHeaders.mobile.tsx` | Mobile variant — `MobileMetricCardGrid` with horizontal scroll skeleton |
| 7 | `frontend/mobile/views/dashboard/settings/components/meetingIntegrations/index.ts` | Mobile barrel (also re-exports `ConnectedAccountsTable.mobile`) |

## Files Modified

| # | File | Change |
|---|------|--------|
| 1 | `frontend/common/views/dashboard/settings/components/meetingIntegrations/MeetingIntegrationsHealthHeaders.tsx` | Completely rewritten as switcher — uses `createLazyView` + `ResponsiveViewSwitch` to lazy-load desktop/mobile variants |

## Files NOT Modified (and why)

| File | Reason |
|------|--------|
| `frontend/common/views/dashboard/settings/tabs/meetingIntegrations/__shared__/meetingIntegrationsTabShared.tsx` | Consumer — uses `<MeetingIntegrationsHealthHeaders viewModel={viewModel} />`. Public API unchanged (still `{ viewModel }` prop), so no consumer update needed. |
| `frontend/common/views/dashboard/settings/types/meetingIntegrations.types.ts` | Already has `SettingsMeetingIntegrationsLabels` with `totalProviders`, `connectedProviders`, `providersWithIssues`, `disconnectedProviders` keys — no type changes needed. |
| `frontend/common/types/shared.types.ts` | `MetricItem` interface already correct shape — no changes needed. |

## Verification Results (sub-loop.ts --lifecycle lint)

All 8 files passed tsgo → oxlint → biome → lint:type-aware:

| File | tsgo | oxlint | biome | lint:type-aware | Exit |
|------|------|--------|-------|-----------------|------|
| `__shared__/meetingIntegrationsHealthHeadersShared.tsx` | ✅ | ✅ | ✅ | ✅ | 0 |
| `__shared__/meetingIntegrationsHealthHeadersShared.helpers.ts` | ✅ | ✅ | ✅ | ✅ | 0 |
| `__shared__/index.ts` | ✅ | ✅ | ✅ | ✅ | 0 |
| `MeetingIntegrationsHealthHeaders.tsx` (switcher) | ✅ | ✅ | ✅ | ✅ | 0 |
| `meetingIntegrationsHealthHeaders.desktop.tsx` | ✅ | ✅ | ✅ | ✅ | 0 |
| desktop `index.ts` barrel | ✅ | ✅ | ✅ | ✅ | 0 |
| `meetingIntegrationsHealthHeaders.mobile.tsx` | ✅ | ✅ | ✅ | ✅ | 0 |
| mobile `index.ts` barrel | ✅ | ✅ | ✅ | ✅ | 0 |

## Architecture

```
MeetingIntegrationsHealthHeaders.tsx (common switcher)
  ├── createLazyView → desktop variant (lazy import)
  └── createLazyView → mobile variant (lazy import)

Desktop variant:
  └── MeetingIntegrationsHealthHeadersShared (shared scaffold)
      ├── renderSkeleton → Grid + Skeleton (4 cards, xs:6 md:3)
      └── renderMetrics → DesktopMetricCardGrid

Mobile variant:
  └── MeetingIntegrationsHealthHeadersShared (shared scaffold)
      ├── renderSkeleton → Box + Skeleton (horizontal fixed-width)
      └── renderMetrics → MobileMetricCardGrid
```

### MetricItem Construction (buildHealthHeaderMetrics)

The `buildHealthHeaderMetrics` function in the `.helpers.ts` file computes 4 `MetricItem` objects:

1. **Total Providers**: `DnsOutlined` icon, `count: providers.length`
2. **Connected**: `CheckCircleOutlined` icon, `count: providers.filter(p => p.credentialsHealthy).length`
3. **Issues**: `WarningOutlined` icon, `count: providers.reduce((sum, p) => sum + p.reauthNeededCount, 0)`
4. **Disconnected**: `CloudOffOutlined` icon, `count: providers.filter(p => !p.credentialsHealthy).length`, `variant: "error"` when count > 0

State handling:
- **Loading**: Returns metrics with `count: 0`, no `label` (skeleton shown via `renderSkeleton` slot)
- **Error**: All metrics get `variant: "error"`
- **Empty**: All metrics show 0 with resolved label strings (`label` field)
- **Disconnected > 0**: Disconnected card gets `variant: "error"`

## Carry-Forward Knowledge for Future Subtasks

### Three-Tier Barrel File Naming (CRITICAL)

When creating barrel `index.ts` files in `frontend/desktop/` or `frontend/mobile/` directories, the `export * from` path MUST include the `.desktop`/`.mobile` suffix:

```typescript
// ✅ Correct — includes the tier suffix
export * from "./meetingIntegrationsHealthHeaders.desktop";
export * from "./ConnectedAccountsTable.desktop";

// ❌ Wrong — TS2307 Cannot find module
export * from "./meetingIntegrationsHealthHeaders";
```

This is because `moduleResolution: "bundler"` in `tsconfig.json` does NOT auto-resolve `.desktop.tsx` as an extension variant of `./SomeName`. The existing pattern (e.g., `frontend/desktop/components/ui/filter/index.ts`) always includes the suffix.

### createLazyView Import Location

`createLazyView` is exported from `@/frontend/common/components/ui/container/createLazyView.ts` (a separate file), NOT from `ResponsiveViewSwitch.tsx`. It is also re-exported through the `@/frontend/common/components/ui/container` barrel. When importing, either:
- Import directly: `import { createLazyView } from "@/frontend/common/components/ui/container/createLazyView"`
- Import from barrel: `import { createLazyView } from "@/frontend/common/components/ui/container"`

### react-refresh/only-export-components Rule

A `.tsx` file that exports a component CANNOT also export plain functions — the `react-refresh/only-export-components` ESLint rule fires. Solution: extract helper functions into a separate `.helpers.ts` file (which is a `.ts` file, not `.tsx`, so the rule doesn't apply). This is the pattern used by `meetingIntegrationsHealthHeadersShared.helpers.ts`.

### oxlint no-map-spread Rule

When using `.map()` with spread operators, oxlint fires `no-map-spread`. Use `Object.assign({}, obj, { key: val })` instead of `{ ...obj, key: val }` inside `.map()` callbacks.

### MetricItem Shape Confirmed

The confirmed `MetricItem` shape from `shared.types.ts`:
```typescript
interface MetricItem {
  key: string;
  count: number | string;
  labelKey: string;
  icon: SvgIconComponent;
  label?: string;
  subLabel?: string;
  variant?: "default" | "error" | "highlight" | "danger";
}
```
Use `count` (NOT `value`), `labelKey`/`label` (NOT `label` as the value field), `variant` (NOT `color`).

### Pre-Existing i18n Keys Available

The `SettingsMeetingIntegrationsLabels` type (in `meetingIntegrations.types.ts`) already defines:
- `totalProviders`
- `connectedProviders`
- `providersWithIssues`
- `disconnectedProviders`

These will be resolved by the ViewModel (Task 29) via `useAppTranslation(Translation.Dashboard.SettingsMeetingIntegrations)` and passed down as the `labels` prop.

### DesktopMetricCardGrid / MobileMetricCardGrid Import Paths

- Desktop: `import { DesktopMetricCardGrid } from "@/frontend/desktop/components/ui/card/MetricCardGrid"`
- Mobile: `import { MobileMetricCardGrid } from "@/frontend/mobile/components/ui"` (from the top-level mobile UI barrel)

### ViewProps Pattern

The `MeetingIntegrationsHealthHeaders` component receives `viewModel` as a prop directly (not via a hook). This is a sub-component — the ViewModel hook (`useMeetingIntegrationsViewModel`, Task 29) lives in the parent `MeetingIntegrationsTabView`. The desktop/mobile variant functions take `viewModel: Readonly<MeetingIntegrationsViewModel>` directly as their parameter.

## Cross-File Dependencies Discovered

| Dependency | Direction | Notes |
|------------|-----------|-------|
| `MeetingIntegrationsHealthHeaders.tsx` → `createLazyView` | Import | From `@/frontend/common/components/ui/container/createLazyView` |
| `MeetingIntegrationsHealthHeaders.tsx` → `ResponsiveViewSwitch` | Import | From `@/frontend/common/components/ui/container/ResponsiveViewSwitch` |
| Desktop/mobile variants → `MeetingIntegrationsHealthHeadersShared` | Import | Shared scaffold in `__shared__/` |
| `buildHealthHeaderMetrics` → `MetricItem` type | Type | From `@/frontend/common/types/shared.types` |
| `buildHealthHeaderMetrics` → `MeetingIntegrationsViewModel` | Type | From `@/frontend/common/views/dashboard/settings/types/meetingIntegrations.types` |
| `meetingIntegrationsTabShared.tsx` → `MeetingIntegrationsHealthHeaders` | Consumer | Uses `{ viewModel }` prop — no change needed |

## Requirements Coverage

- **AC-1.1** (MetricCardGrid for health cards): ✅ Replaced raw Card+Grid with DesktopMetricCardGrid/MobileMetricCardGrid
