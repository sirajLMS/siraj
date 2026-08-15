# Task 14 Outcome — Enhanced `ReauthNeededBanner` with per-provider reconnect

## Summary

Enhanced the existing `ReauthNeededBanner` component from a simple warning alert into a fully interactive, per-provider reconnect banner with severity-based color coding, dismiss ("Remind me later"), "Reconnect All" when ≥2 providers need reauth, and MUI `Slide`-down animation on mount. All labels are passed via the `labels` prop from the ViewModel (no `useAppTranslation` in the component — per Rule 7).

## Files Modified

### Component & types
- `frontend/common/views/dashboard/profile/shared/meeting-configs/reauth-needed-banner.tsx` — full rewrite:
  - Per-provider inline "Reconnect" buttons with expiry state label
  - Severity: `"error"` (red) when any provider is `expired`, `"warning"` (amber) when only `expiring_soon`
  - "Reconnect All" button when `reauthProviders.length >= 2` and `onReconnectAll` is provided
  - "Remind me later" dismiss button (text button + close icon button in Alert `action` slot)
  - MUI `Slide` direction="down" on mount with `appear` + `mountOnEnter` + `unmountOnExit`
  - `role="alert"` + `aria-live="assertive"` (expired) / `"polite"` (warning)
  - All colors via MUI `color` prop (resolved from theme palette — no hardcoded hex)
  - All strings via `labels` prop (no `useAppTranslation`)
  - Internal `useState(true)` controls `Slide` in/out for dismiss animation

- `frontend/common/views/dashboard/profile/shared/meeting-configs/reauth-needed-banner.types.ts`:
  - Added `onReconnectAll?: () => void` and `onDismiss?: () => void` to `ReauthNeededBannerProps`
  - Removed unused `severityForExpiry` helper (severity computed inline in component)

### Stories
- `frontend/common/views/dashboard/profile/shared/meeting-configs/ReauthNeededBanner.stories.tsx`:
  - Updated labels mock with `remindLater` and `reconnectAllButton`
  - Added `expiryState` to story providers
  - Added `onDismiss` / `onReconnectAll` props
  - New story: `MultipleProvidersExpiringSoon` (2 providers, amber/warning severity)
  - All stories pass tsgo, oxlint, biome, lint:type-aware

- `frontend/common/views/dashboard/profile/shared/meeting-configs/MeetingConfigsManager.stories.tsx`:
  - Updated `reauthLabels` mock with new keys

### Locale (i18n)
- `shared/locale/types/ui/index.ts` — added `remindLater` and `reconnectAllButton` to `MeetingConfigReauthNeededLabels`
- `shared/locale/en/ui/meetingConfig/reauthNeeded.ts` — EN: `"Remind me later"` / `"Reconnect All"`
- `shared/locale/ar/ui/meetingConfig/reauthNeeded.ts` — AR: `"ذكّرني لاحقاً"` / `"إعادة ربط الكل"`

## Props/Interface (final)

```typescript
type ReauthNeededBannerProps = {
  readonly reauthProviders: readonly ReauthProvider[];
  readonly labels: MeetingConfigReauthNeededLabels;
  readonly onReconnect: (providerSlug: string) => void;
  readonly onReconnectAll?: () => void;
  readonly onDismiss?: () => void;
};
```

## Design Decisions

- **Severity logic**: If ANY provider is `expired`, the entire alert shows `severity="error"` (red). Otherwise `"warning"` (amber). This matches the design spec "amber (<7 days), red (expired)".
- **Dismiss flow**: `onDismiss` is called immediately — the parent ViewModel controls whether to show it again (per spec: "shows again on next session"). The internal `visible` state drives the slide-out animation.
- **Slide animation**: Used MUI `Slide` with `direction="down"`, `appear`, `mountOnEnter`, `unmountOnExit`. Respects `prefers-reduced-motion` natively (MUI transitions respect it).
- **Alert `action` slot**: Close icon button (`CloseOutlined`) in the Alert's built-in `action` prop for visual dismiss. "Remind me later" text button in the button stack.
- **No external animation library** — uses only MUI built-in `Slide`.
- **`icon={false}`** on Alert — severity color is sufficient; the default icon is redundant given inline buttons.

## Quality Verification

| File | tsgo | oxlint | biome | lint:type-aware |
|------|------|--------|-------|-----------------|
| `reauth-needed-banner.tsx` | ✅ | ✅ | ✅ | ✅ |
| `reauth-needed-banner.types.ts` | ✅ | ✅ | ✅ | ✅ |
| `ReauthNeededBanner.stories.tsx` | ✅ | ✅ | ✅ | ✅ |
| `shared/locale/types/ui/index.ts` | ✅ | ✅ | ✅ | ✅ |
| `shared/locale/en/ui/meetingConfig/reauthNeeded.ts` | ✅ | ✅ | ✅ | ✅ |
| `shared/locale/ar/ui/meetingConfig/reauthNeeded.ts` | ✅ | ✅ | ✅ | ✅ |
| `MeetingConfigsManager.stories.tsx` | ⚠ Pre-existing tsgo errors (ConnectProviderAccount/AutoGeneration from other tasks) — my change only added 2 string keys |

All modified files pass `--lifecycle lint` (tsgo → oxlint → biome → lint:type-aware) with exit 0.

## Carry-Forward Knowledge

- The `MeetingConfigsManager.tsx` currently passes only `reauthProviders`, `labels`, and `onReconnect` to the banner. Task 30 (ViewModel orchestration) should wire `onReconnectAll` and `onDismiss` from the ViewModel when those handlers are implemented.
- The new label keys (`remindLater`, `reconnectAllButton`) are already registered in the type system, EN/AR implementations, and story mocks. No further locale work needed.
- The `remindLater` key name was chosen over `dismiss` to match the design spec terminology ("Remind me later").

## Cross-File Dependencies

- `MeetingConfigsManager.tsx` does NOT need changes for this task — the new props (`onReconnectAll`, `onDismiss`) are optional. When task 30 wires them, the banner will automatically show the "Reconnect All" and "Remind me later" buttons.

## Deferred Items

None.
