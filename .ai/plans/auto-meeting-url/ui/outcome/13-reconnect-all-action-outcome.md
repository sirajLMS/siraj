# Task 13 Outcome — ReconnectAllAction Batch Reconnect Component

## Summary

Created `ReconnectAllAction.tsx` — a shared non-tiered view component for batch reconnecting multiple meeting providers that need re-authentication. The component renders a "Reconnect All ({count})" button when ≥2 providers need reauth, sequentially initiates the OAuth flow for each provider via a ViewModel callback, shows progress ("Reconnecting 1 of 3…") with `CircularProgress`, and reports completion (success/failure counts) back to the ViewModel. All strings are received via the `labels` prop (no `useAppTranslation` in this component), following `frontend/common/views/AGENTS.md` Rule 7.

## Files Created

- `frontend/common/views/dashboard/profile/shared/meeting-configs/ReconnectAllAction.tsx`

## Files Modified

| File | Change |
|------|--------|
| `shared/locale/types/ui/meetingConfigEnhancements.ts` | Added 5 new label keys to `MeetingConfigEnhancementLabels`: `reconnectAllWithCount`, `reconnectingProgress`, `reconnectedProviders`, `reconnectFailedProviders`, `reconnectAllAriaLabel` |
| `shared/locale/types/ui/index.ts` | Mirrored the same 5 new label keys in the inline `MeetingConfigEnhancementLabels` interface |
| `shared/locale/en/ui/meetingConfig/enhancements.ts` | Added EN implementations for the 5 new keys |
| `shared/locale/ar/ui/meetingConfig/enhancements.ts` | Added AR implementations for the 5 new keys |
| `frontend/common/views/dashboard/profile/shared/meeting-configs/index.ts` | Added `export * from "./ReconnectAllAction"` to barrel |

## Component Design

### Props Interface

```typescript
export type ReconnectAllActionLabels = Pick<
  MeetingConfigEnhancementLabels,
  | "reconnectAllWithCount"
  | "reconnectingProgress"
  | "reconnectedProviders"
  | "reconnectFailedProviders"
  | "reconnectAllAriaLabel"
>;

export interface ReconnectAllActionProps {
  readonly providers: readonly ReauthProvider[];
  readonly labels: ReconnectAllActionLabels;
  readonly onReconnectProvider: (providerSlug: string) => Promise<boolean>;
  readonly onComplete: (reconnectedCount: number, failedCount: number) => void;
}
```

### States

| State | Condition | Render |
|-------|-----------|--------|
| Hidden | `providers.length < 2` | `null` (no render — button only shows when ≥2 providers need reauth) |
| Idle | `!inProgress` | Button with `RefreshOutlined` icon, "Reconnect All ({count})" label, `aria-label="Reconnect all expiring providers"` |
| In Progress | `inProgress === true` | `Box` with `primaryContainer` background, `CircularProgress` + "Reconnecting 1 of 3…" text, `aria-live="polite"` + `aria-busy="true"` |

### Key Design Decisions

1. **Labels via props (Rule 7)**: The component receives `ReconnectAllActionLabels` (a `Pick` over `MeetingConfigEnhancementLabels`) — no `useAppTranslation` call, consistent with `frontend/common/views/AGENTS.md` Rule 7. The ViewModel owns translations and passes the relevant label slice via props.

2. **ViewModel callback pattern**: The component does NOT call `connectMeetingProviderOAuth` mutation directly. It receives `onReconnectProvider(providerSlug) → Promise<boolean>` — the ViewModel owns the mutation call, `authorizeUrl` redirect, notifications, and error handling. The boolean return allows the component to track success/failure counts for the completion toast.

3. **Sequential processing via recursive helper**: The `no-await-in-loop` oxlint rule prohibits `await` inside `for` loops. Since the task requires sequential processing ("one at a time"), the component uses a recursive `processProvider(index, successCount, failureCount)` helper that awaits each provider sequentially and tracks counts.

4. **Completion callback**: `onComplete(reconnectedCount, failedCount)` lets the ViewModel show the appropriate toast notification ("Reconnected {n} providers" or "{n} failed to reconnect") via `useNotifications`. The view component does NOT call `useNotifications` directly.

5. **Accessibility**: 
   - `aria-label="Reconnect all expiring providers"` on the button (from `labels.reconnectAllAriaLabel`)
   - Progress container uses `aria-live="polite"` and `aria-busy="true"` to announce progress updates to screen readers

6. **Colors via theme**: 
   - Button: `sx={theme => ({ backgroundColor: theme.palette.primary.main, color: theme.palette.onPrimary })}`
   - Progress container: `sx={theme => ({ backgroundColor: theme.palette.primaryContainer, color: theme.palette.onPrimaryContainer })}`
   - CircularProgress: `sx={theme => ({ color: theme.palette.primary.main })}`
   - No hardcoded colors.

7. **MUI v9 compliance**: All layout props (`disabled`, `size`, `color`, `variant`) are valid direct props on `Button`. Theme-specific styling goes through `sx` callback. Icons use `*Outlined` suffix (`RefreshOutlined`).

### New i18n Keys Added

| Key | EN | AR |
|-----|----|----|
| `reconnectAllWithCount` | `(count) => "Reconnect All (${count})"` | `(count) => "إعادة ربط الكل (${count})"` |
| `reconnectingProgress` | `(current, total) => "Reconnecting ${current} of ${total}…"` | `(current, total) => "جارٍ إعادة الربط ${current} من ${total}…"` |
| `reconnectedProviders` | `(count) => "Reconnected ${count} provider/providers"` | Arabic pluralized: 1 → "مزود واحد", 2 → "مزودين", 3+ → "${count} مزودين" |
| `reconnectFailedProviders` | `(count) => "${count} failed to reconnect"` | Arabic pluralized: 1 → "مزود واحد", 2 → "مزودين", 3+ → "${count} مزودين" |
| `reconnectAllAriaLabel` | `"Reconnect all expiring providers"` | `"إعادة ربط جميع المزودين المنتهية"` |

## Verification Results

### Lint Lifecycle (tsgo → oxlint → biome → lint:type-aware)

```
bun run scripts/health/sub-loop.ts frontend/common/views/dashboard/profile/shared/meeting-configs/ReconnectAllAction.tsx --lifecycle lint
✅ tsgo passed
✅ oxlint passed
✅ biome:check passed
✅ lint:type-aware passed
✅ All checks for lifecycle "lint" passed. (exit code 0)
```

```
bun run scripts/health/sub-loop.ts shared/locale/types/ui/meetingConfigEnhancements.ts --lifecycle lint
✅ tsgo passed ✅ oxlint passed ✅ biome:check passed ✅ lint:type-aware passed
```

```
bun run scripts/health/sub-loop.ts shared/locale/types/ui/index.ts --lifecycle lint
✅ tsgo passed ✅ oxlint passed ✅ biome:check passed ✅ lint:type-aware passed
```

```
bun run scripts/health/sub-loop.ts shared/locale/en/ui/meetingConfig/enhancements.ts --lifecycle lint
✅ tsgo passed ✅ oxlint passed ✅ biome:check passed ✅ lint:type-aware passed
```

```
bun run scripts/health/sub-loop.ts shared/locale/ar/ui/meetingConfig/enhancements.ts --lifecycle lint
✅ tsgo passed ✅ oxlint passed ✅ biome:check passed ✅ lint:type-aware passed
```

```
bun run scripts/health/sub-loop.ts frontend/common/views/dashboard/profile/shared/meeting-configs/index.ts --lifecycle lint
✅ tsgo passed ✅ oxlint passed ✅ biome:check passed ✅ lint:type-aware passed
```

## Carry-Forward Knowledge

### For ViewModel integration (follow-up task)
The `useMeetingConfigsManagerViewModel.ts` needs the following additions to wire `ReconnectAllAction`:
1. Add a `reconnectAllProvider(providerSlug) → Promise<boolean>` handler that:
   - Calls `connectMeetingProviderOAuth({ input: { providerSlug, returnPath } })`
   - Returns `true` on success (before `window.location.href` redirect), `false` on error
   - Clears `reauthProviderSlugs` for the slug and clears `connectingSlugs` for the slug
2. Add a `onReconnectAllComplete(reconnectedCount, failedCount)` handler that:
   - Uses `useNotifications` from `@toolpad/core/useNotifications`
   - If `failedCount === 0`: shows `labels.enhancements.reconnectedProviders(reconnectedCount)` as success toast
   - If `failedCount > 0`: shows `labels.enhancements.reconnectFailedProviders(failedCount)` as error toast
3. The `MeetingConfigsManager.tsx` (or the manager orchestrator in task 32) renders:
   ```tsx
   <ReconnectAllAction
     providers={state.reauthProviders}
     labels={state.labels.enhancements}
     onReconnectProvider={state.reconnectAllProvider}
     onComplete={state.onReconnectAllComplete}
   />
   ```
   - Condition: `state.reauthProviders.length >= 2`

### Labels plumbing
The `MeetingConfigProfileLabels` type currently does NOT include `enhancements`. The ViewModel must be updated to pass `meetingConfig.enhancements` as the `labels` prop. The ViewModel already loads `useAppTranslation(Translation.Ui.MeetingConfig)` — accessing `.enhancements` from that namespace will work after the locale type changes are compiled (tsgo verified clean).

## Cross-File Dependencies

1. **ViewModel → Component**: The component is ready to consume ViewModel callbacks. The ViewModel wiring (adding `reconnectAllProvider` and `onReconnectAllComplete` handlers, plus exposing `enhancements` labels) is a prerequisite for the component to appear in the rendered UI.
2. **Manager orchestration (task 32)**: The `MeetingConfigsManager.tsx` will integrate `ReconnectAllAction` when `reauthProviders.length >= 2`.
3. **Locale types**: The `MeetingConfigEnhancementLabels` interface now has 5 new keys — any component or story mock that implements this interface must include these keys.

## Deferred Items

- ViewModel wiring (adding `reconnectAllProvider` handler and `onReconnectAllComplete` callback to `useMeetingConfigsManagerViewModel.ts`)
- Manager integration (rendering `<ReconnectAllAction>` in `MeetingConfigsManager.tsx` when `reauthProviders.length >= 2`)
- Storybook stories for `ReconnectAllAction` (idle, in-progress, and hidden states)
