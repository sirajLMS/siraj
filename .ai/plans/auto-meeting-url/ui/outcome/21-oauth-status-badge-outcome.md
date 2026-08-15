# Task 21 Outcome — OAuthConnectionStatusBadge Component

## Summary

Created `OAuthConnectionStatusBadge` — a self-contained UI primitive that renders a colored status dot + label for OAuth connection states (connected, expiring, expired, disconnected). Extended the `dashboard.oauthFlow` i18n namespace with 6 new keys for badge labels, countdown text, and aria-label. Updated the `meetingConfig` barrel to export the new component.

## Files Created

- `frontend/common/components/ui/display/meetingConfig/OAuthConnectionStatusBadge.tsx` — the badge component.

## Files Modified

### i18n — `dashboard.oauthFlow` namespace (6 new keys)

- `shared/locale/types/dashboard/oauth-flow.ts` — added `statusConnected`, `statusNotConnected`, `statusExpiring`, `statusExpired`, `expiresInDays(days: number)`, `statusAriaLabel` to `OAuthFlowLabels` interface.
- `shared/locale/en/dashboard/oauthFlow/oauthFlow.ts` — added EN implementations for all 6 new keys.
- `shared/locale/ar/dashboard/oauthFlow/oauthFlow.ts` — added AR implementations with Arabic pluralization for `expiresInDays` (1→يوم واحد, 2→يومين, n→N أيام).

### Barrel

- `frontend/common/components/ui/display/meetingConfig/index.ts` — added `export * from "./OAuthConnectionStatusBadge"`.

## Component Design

### Props

```typescript
export type OAuthBadgeStatus = "connected" | "expiring" | "expired" | "disconnected";

export interface OAuthConnectionStatusBadgeProps {
  readonly status: OAuthBadgeStatus;
  /** ISO datetime string of token expiry — used for the "expiring" countdown text. */
  readonly expiresAt?: string | null;
}
```

### Status → Visual Mapping

| Status | Palette | Label Key | Dot Color |
|--------|---------|-----------|-----------|
| `connected` | `theme.palette.success.main` | `statusConnected` → "Connected" | Green |
| `expiring` | `theme.palette.warning.main` | `expiresInDays(N)` → "Expires in N days" | Amber |
| `expired` | `theme.palette.error.main` | `statusExpired` → "Expired" | Red |
| `disconnected` | `theme.palette.grey[500]` | `statusNotConnected` → "Not connected" | Grey |

### Expiry Countdown

When `status === "expiring"` and `expiresAt` is provided, the component calculates days remaining via `calcDaysUntilExpiry()`. If > 0 days, it shows `"Expires in N days"`; otherwise it falls back to `"Expired"`.

### Accessibility

- Uses `<output>` element (semantic HTML for `role="status"`) — satisfies oxlint `prefer-tag-over-role` rule.
- `aria-label={t.statusAriaLabel}` on the Typography for screen readers.

### Theme & Styling

- All colors via theme palette callbacks — no hardcoded colors.
- `grey` palette uses `theme.palette.grey[500]` (indexed shade, not `.main` — MUI v9 type constraint).
- MUI v9 `sx` prop for all styling — no direct style props.
- Dot has `transition: "background-color 200ms ease-in-out"` per design.md animation spec.
- All labels via `useAppTranslation(Translation.Dashboard.OAuthFlow)` — self-contained UI primitive owns its translations (per `frontend/common/components/ui/AGENTS.md`).

## Verification Results

### Component file
```
bun run scripts/health/sub-loop.ts frontend/common/components/ui/display/meetingConfig/OAuthConnectionStatusBadge.tsx --lifecycle lint
✅ tsgo passed
✅ oxlint passed
✅ biome:check passed
✅ lint:type-aware passed
✅ All checks for lifecycle "lint" passed. (exit code 0)
```

### Barrel file
```
bun run scripts/health/sub-loop.ts frontend/common/components/ui/display/meetingConfig/index.ts --lifecycle lint
✅ tsgo passed
✅ oxlint passed
✅ biome:check passed
✅ lint:type-aware passed
✅ All checks for lifecycle "lint" passed. (exit code 0)
```

## Design Decisions

1. **Dual status type**: The `OAuthConnectionStatus` from `meeting-ui.types.ts` (Task 2) has `"connected" | "connecting" | "reconnecting" | "disconnected"` — designed for the connect/reconnect flow state. The badge component needs `"connected" | "expiring" | "expired" | "disconnected"` per design.md §3.27. The badge exports its own `OAuthBadgeStatus` type matching the design spec, avoiding coupling to the flow-state type.

2. **`expiresAt` over `daysUntilExpiry`**: Per design.md, the component receives `expiresAt?: string | null` (ISO timestamp), not a pre-computed day count. This keeps the component truly presentational — it computes the countdown internally.

3. **`<output>` element**: Using `component="output"` instead of `Box component="span" role="status"` satisfies the oxlint `prefer-tag-over-role` rule, which requires semantic HTML tags over ARIA roles when a native equivalent exists.

## Carry-Forward Knowledge

- The `dashboard.oauthFlow` namespace now has badge-specific keys (`statusConnected`, `statusNotConnected`, `statusExpiring`, `statusExpired`, `expiresInDays`, `statusAriaLabel`) — downstream tasks referencing this namespace should use these keys.
- `theme.palette.grey` in MUI v9 is a `Color` (indexed by shade number), not a `PaletteColor` with `.main`. Use `theme.palette.grey[500]` for grey colors. A `getColor()` helper function handles this distinction cleanly.
- The `expiresInDays` pluralization in Arabic follows the existing pattern from `ui/meetingConfig/enhancements.ts` (1→يوم واحد, 2→يومين, n→N أيام).
- The English `expiresInDays` implementation is shared with the existing `uiMeetingConfigEnhancementsEn.expiresInDays` — both use the same template `Expires in N day(s)`.

## Cross-File Dependencies

- The `dashboard.oauthFlow` namespace type file (`shared/locale/types/dashboard/oauth-flow.ts`) and EN/AR implementations were modified to add 6 new keys. All 3 files must be kept in sync.
- The barrel `index.ts` now exports `OAuthConnectionStatusBadge` and `OAuthBadgeStatus` via `export *`.

## Deferred Items

None.
