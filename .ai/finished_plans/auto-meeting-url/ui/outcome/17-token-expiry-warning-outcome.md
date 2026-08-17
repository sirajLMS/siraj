# Task 17 Outcome — TokenExpiryWarning Component

## Summary

Created `TokenExpiryWarning.tsx` — a shared non-tiered view component in the profile meeting-configs directory that displays a warning banner when a meeting provider's OAuth token is approaching expiry. The component has four states (safe, warning, critical, expired), renders a countdown text ("Expires in X days" / "Expires in X hours" / "Expired"), and includes an inline "Reconnect" button that delegates to a ViewModel callback. All strings are passed via the `labels` prop (no `useAppTranslation` in the component), following `frontend/common/views/AGENTS.md` Rule 7.

## Files Created

- `frontend/common/views/dashboard/profile/shared/meeting-configs/TokenExpiryWarning.tsx`

## Files Modified

- `frontend/common/views/dashboard/profile/shared/meeting-configs/index.ts` — added `export * from "./TokenExpiryWarning"` to barrel

## Files NOT Modified (and why)

- `shared/locale/types/ui/meetingConfigEnhancements.ts` — already has `expiresInDays`, `expiresInHours`, `expired`, and `reconnect` keys (added in Task 1 i18n foundation). No new i18n keys needed.
- `shared/locale/en/ui/meetingConfig/enhancements.ts` — already has EN implementations for all 4 keys. No changes needed.
- `shared/locale/ar/ui/meetingConfig/enhancements.ts` — already has AR implementations (including Arabic pluralization for day/hour counts). No changes needed.
- `useMeetingConfigsManagerViewModel.ts` — NOT modified. The ViewModel wiring (passing `labels.enhancements` slice + `onReconnect` handler + `expiresAt` + `reconnecting` state) is a follow-up task (task 18b / task 30).

## Component Design

### Props Interface

```typescript
export type TokenExpiryLevel = "safe" | "warning" | "critical" | "expired";

export interface TokenExpiryWarningProps {
  readonly labels: Pick<MeetingConfigEnhancementLabels, "expiresInDays" | "expiresInHours" | "expired" | "reconnect">;
  readonly providerName: string;
  readonly expiresAt: Date | null;
  readonly onReconnect: () => void;
  readonly reconnecting?: boolean;
}
```

### States

| State | Condition | Render |
|-------|-----------|--------|
| Safe | `expiresAt` is null or more than 14 days remaining | `null` (not rendered) |
| Warning | ≤7 days remaining (but >24h) | Amber border + `WarningAmberOutlined` icon + "Expires in X days" |
| Critical | ≤24 hours remaining (but >0) | Red border + `ErrorOutlined` icon + "Expires in X hours" |
| Expired | `expiresAt` has passed (≤0ms remaining) | Red border + `ErrorOutlined` icon + "Expired" |

### Thresholds

```typescript
const SAFE_THRESHOLD_MS = 14 * 24 * 60 * 60 * 1000;     // 14 days
const WARNING_THRESHOLD_MS = 7 * 24 * 60 * 60 * 1000;   // 7 days
const CRITICAL_THRESHOLD_MS = 24 * 60 * 60 * 1000;       // 24 hours
```

- **Safe** (>14d): not rendered (returns `null`)
- **Warning** (≤7d, >24h): amber palette (`theme.palette.warning.main`)
- **Critical** (≤24h, >0): red palette (`theme.palette.error.main`), countdown in hours
- **Expired** (≤0): red palette (`theme.palette.error.main`), shows "Expired" label

### Countdown Text

- **Warning**: `labels.expiresInDays(days)` — e.g., "Expires in 5 days"
- **Critical**: `labels.expiresInHours(hours)` — e.g., "Expires in 3 hours" (minimum 1 hour to avoid "Expires in 0 hours")
- **Expired**: `labels.expired` — e.g., "Expired"

### Key Design Decisions

1. **Labels via props (Rule 7)**: The component receives `Pick<MeetingConfigEnhancementLabels, "expiresInDays" | "expiresInHours" | "expired" | "reconnect">` — no `useAppTranslation` call, consistent with `frontend/common/views/AGENTS.md` Rule 7 for domain components under `frontend/common/views/`.

2. **ViewModel callback pattern**: The component does NOT call any mutation or hook directly. It receives `onReconnect()` — the ViewModel owns the reconnection logic (OAuth flow, loading state, error handling).

3. **Accessibility**: Uses `<Box component="output">` with `aria-live="polite"` — the `output` element is the semantic HTML equivalent of `role="status"`, satisfying the `jsx-a11y/prefer-tag-over-role` oxlint rule.

4. **Colors via theme palette**: All colors use the theme callback pattern (`sx={theme => ({ color: theme.palette.warning.main })}` / `sx={theme => ({ color: theme.palette.error.main })}`) — no hardcoded colors.

5. **MUI v9 compliance**: All layout props (`flexDirection`, `alignItems`, `gap`, `display`, `justifyContent`, `flexWrap`, `py`, `px`, `borderRadius`, `border`, `borderColor`) are in `sx`, not as direct props. Icons use `*Outlined` suffix.

6. **Reconnecting state**: When `reconnecting` is true, the button is disabled and shows a `CircularProgress` spinner instead of the refresh icon.

7. **Module-level helpers**: `deriveLevel()`, `formatCountdown()`, `buildLevelVisual()`, and `levelBorderColor()` are module-level pure functions — no closures over component state.

### Labels Used (already exist from Task 1)

| Key | Type | EN | AR |
|-----|------|----|----|
| `expiresInDays` | `(days: number) => string` | `Expires in ${days} day(s)` | `ينتهي خلال ${days} أيام` (with pluralization) |
| `expiresInHours` | `(hours: number) => string` | `Expires in ${hours} hour(s)` | `ينتهي خلال ${hours} ساعات` (with pluralization) |
| `expired` | `string` | `Expired` | `منتهي` |
| `reconnect` | `string` | `Reconnect` | `إعادة الربط` |

## Verification Results

### Component (lint lifecycle)
```
bun run scripts/health/sub-loop.ts frontend/common/views/dashboard/profile/shared/meeting-configs/TokenExpiryWarning.tsx --lifecycle lint
✅ tsgo passed
✅ oxlint passed
✅ biome:check passed
✅ lint:type-aware passed
✅ All checks for lifecycle "lint" passed. (exit code 0)
```

### Component (codescene lifecycle — full sweep)
```
bun run scripts/health/sub-loop.ts frontend/common/views/dashboard/profile/shared/meeting-configs/TokenExpiryWarning.tsx --lifecycle codescene
✅ tsgo passed
✅ oxlint passed
✅ biome:check passed
✅ lint:type-aware passed
✅ check:duplicates passed
✅ codescene passed
✅ All checks for lifecycle "codescene" passed. (exit code 0)
```

### Barrel (lint lifecycle)
```
bun run scripts/health/sub-loop.ts frontend/common/views/dashboard/profile/shared/meeting-configs/index.ts --lifecycle lint
✅ tsgo passed
✅ oxlint passed
✅ biome:check passed
✅ lint:type-aware passed
✅ All checks for lifecycle "lint" passed. (exit code 0)
```

## Carry-Forward Knowledge

### For ViewModel integration (task 18b / 30)
The `useMeetingConfigsManagerViewModel` will need to wire `TokenExpiryWarning` per connected provider:
1. Compute `expiresAt` for each provider from the connected account's token expiry timestamp
2. Expose `labels.enhancements` slice (already available via `useMeetingConfigProfileLabels()` hook → `meetingConfig.enhancements`)
3. Implement `handleReconnect(providerSlug)` — calls `connectMeetingProviderOAuth` mutation → redirects to `authorizeUrl`
4. Track `reconnectingFor: string | null` state for the reconnecting provider
5. Render `<TokenExpiryWarning>` for each provider whose token is within the warning window

### Accessibility note for downstream tasks
The `jsx-a11y/prefer-tag-over-role` oxlint rule requires using `<Box component="output">` instead of `<Box role="status">`. The `output` element is the semantic HTML element for `role="status"` and is announced by screen readers. Task 22 (animation accessibility) will add the amber pulse animation via `@keyframes` in `sx` prop when `≤1 day` remaining, but should keep `prefers-reduced-motion` support.

### Reused i18n keys
All 4 label keys (`expiresInDays`, `expiresInHours`, `expired`, `reconnect`) were added in Task 1 (i18n foundation) as part of `MeetingConfigEnhancementLabels`. No new translation keys were needed for this component.

## Cross-File Dependencies

- **Task 1 (i18n foundation)**: `MeetingConfigEnhancementLabels` type in `shared/locale/types/ui/meetingConfigEnhancements.ts` + EN/AR implementations — already complete.
- **Task 18b (MeetingConfigsManager enhancement)**: Will integrate `TokenExpiryWarning` per connected provider in the orchestrating container.
- **Task 30 (ViewModel)**: Will add `handleReconnect`, `reconnectingFor` state, and pass `labels.enhancements` to the component.

## Deferred Items

- ViewModel wiring (adding `handleReconnect` handler, `expiresAt` computation, `reconnectingFor` state to `useMeetingConfigsManagerViewModel`)
- Integration into `MeetingConfigsManager` orchestrating container (task 18b)
- Amber pulse animation for ≤1 day (task 22 — animation pass)
- Storybook stories for warning/critical/expired states (task 35b)
- Component tests for all 4 states (task 35)
