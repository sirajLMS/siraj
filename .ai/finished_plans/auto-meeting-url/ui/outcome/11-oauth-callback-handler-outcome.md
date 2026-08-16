# Task 11 Outcome — OAuthCallbackHandler Component

## Summary

Created `OAuthCallbackHandler.tsx` — a shared non-tiered component that auto-detects OAuth callback completion via URL params (`?oauth_status=success&provider=zoom`) on mount, triggers a ViewModel callback for Apollo cache refetch and toast notifications, cleans the URL params via `window.history.replaceState`, and listens for the `window` `focus` event as a popup-OAuth fallback. An `aria-live="polite"` region announces callback results to screen readers. All user-facing strings arrive via a `labels` prop (`Pick<MeetingConfigEnhancementLabels, ...>`), and the component never calls `useAppTranslation` or `useNotifications` directly — it delegates toasts and refetch to the manager ViewModel via the `onCallbackDetected` callback. Per `frontend/common/views/AGENTS.md` Rule 7.

## Files Created

- `frontend/common/views/dashboard/profile/shared/meeting-configs/OAuthCallbackHandler.tsx`

## Files Modified

- `frontend/common/views/dashboard/profile/shared/meeting-configs/index.ts` — added `export * from "./OAuthCallbackHandler"` to the barrel (alphabetical placement).

## Component Design

### Props Interface

```typescript
export type OAuthCallbackStatus = "success" | "error" | "focus";

export type OAuthCallbackHandlerLabels = Pick<
  MeetingConfigEnhancementLabels,
  "oauthCallbackSuccess" | "oauthCallbackError"
>;

export interface OAuthCallbackHandlerProps {
  readonly labels: OAuthCallbackHandlerLabels;
  readonly onCallbackDetected: (
    status: OAuthCallbackStatus,
    provider: string,
    error?: string
  ) => void;
}
```

### Behaviour

| Event | Trigger | Action |
|-------|---------|--------|
| URL param success | `?oauth_status=success&provider=zoom` on mount | Calls `onCallbackDetected("success", provider, error?)`, updates the `aria-live` region with `labels.oauthCallbackSuccess`, cleans URL params |
| URL param error | `?oauth_status=error&provider=zoom&error=...` on mount | Calls `onCallbackDetected("error", provider, error?)`, updates the `aria-live` region with `labels.oauthCallbackError`, logs to `logger.error`, cleans URL params |
| Window focus | User refocuses the tab (popup-OAuth fallback) | Calls `onCallbackDetected("focus", "")` — ViewModel decides whether to refetch |

### Key Design Decisions

1. **Labels via props (Rule 7)**: The component receives `OAuthCallbackHandlerLabels` (a `Pick` over `MeetingConfigEnhancementLabels`) — no `useAppTranslation` call in the view component. The manager ViewModel (`useMeetingConfigsManagerViewModel`, to be wired in task 30) owns the `useAppTranslation` call and passes the relevant translation slice down. Per `frontend/common/views/AGENTS.md` Rule 7.

2. **ViewModel callback pattern**: The component does NOT call `useNotifications`, `useQuery`/`refetch`, or any Apollo hook directly. It receives `onCallbackDetected(status, provider, error?)` — the ViewModel owns the refetch of `myConnectedMeetingProvidersQueryDocument`, the toast notifications (`useNotifications` from `@toolpad/core/useNotifications`), and the error handling. This mirrors the existing `handleReconnect` / `disconnectProvider` handlers in `useMeetingConfigsManagerViewModel.ts` and keeps the component free of side-effect plumbing.

3. **URL param cleaning**: After detecting and dispatching the callback, the component removes `oauth_status`, `provider`, and `error` from the URL via `window.history.replaceState({}, "", cleanUrl)` — no navigation event is fired, so the browser history and scroll position are preserved. The remaining query params are preserved.

4. **Window focus fallback**: Listens for the `focus` event on `window` so popup-based OAuth flows (where the OAuth provider opens in a separate tab/popup and the user returns by closing it) also trigger a refetch. The handler calls `onCallbackDetected("focus", "")` and the ViewModel decides whether the refetch is warranted (e.g., skip if no OAuth flow is in progress). The listener is registered inside the `useEffect` and cleaned up on unmount.

5. **`aria-live="polite"` region**: A visually-hidden `Box component="output"` with `aria-live="polite"` mirrors the `labels.oauthCallbackSuccess` / `labels.oauthCallbackError` text for screen readers. Uses the `srOnlySx` style imported from `@/frontend/common/views/dashboard/settings/components/meetingIntegrations/useCopyFeedback` — the same sr-only pattern used by the settings-side `TestConnectionResultPanel` and `EndpointList` components. The `Box component="output"` mirrors `TokenExpiryWarning.tsx` for assistive-tech semantics.

6. **`logger.error` for diagnostics**: On `oauth_status=error`, the component calls `logger.error("OAuth callback error", { provider, error })` in addition to dispatching the user-facing toast via the ViewModel callback. The toast is the user-facing surface; the logger entry is the developer-facing surface (per Fix 9). No `console.*` is used.

7. **Module-level helpers**: `readOAuthParams()` and `cleanOAuthParams()` are extracted to module scope (oxlint `consistent-function-scoping`) and guard against SSR via `typeof window === "undefined"` checks.

8. **MUI v9 compliance**: All layout/styling goes through the `sx` prop. `Box` uses `component="output"` (valid direct prop) and `aria-live="polite"` (valid ARIA attribute). No style props like `display` or `p` are passed directly.

## Verification Results

### Lint Lifecycle (tsgo → oxlint → biome → lint:type-aware)
```
bun run scripts/health/sub-loop.ts frontend/common/views/dashboard/profile/shared/meeting-configs/OAuthCallbackHandler.tsx --lifecycle lint
✅ tsgo passed
✅ oxlint passed
✅ biome:check passed
✅ lint:type-aware passed
✅ All checks for lifecycle "lint" passed. (exit code 0)
```

### Codescene Lifecycle (full sweep: tsgo → oxlint → biome → lint → duplicates → codescene)
```
bun run scripts/health/sub-loop.ts frontend/common/views/dashboard/profile/shared/meeting-configs/OAuthCallbackHandler.tsx --lifecycle codescene
✅ tsgo passed
✅ oxlint passed
✅ biome:check passed
✅ lint:type-aware passed
✅ check:duplicates passed
✅ codescene passed
✅ All checks for lifecycle "codescene" passed. (exit code 0)
```

### Barrel file (`index.ts`)
```
bun run scripts/health/sub-loop.ts frontend/common/views/dashboard/profile/shared/meeting-configs/index.ts --lifecycle lint
✅ All checks for lifecycle "lint" passed. (exit code 0)
```

## Carry-Forward Knowledge

### For ViewModel integration (task 30)
The manager ViewModel (`useMeetingConfigsManagerViewModel.ts`) needs the following additions to wire `OAuthCallbackHandler`:
1. Add `handleOAuthCallback(status: OAuthCallbackStatus, provider: string, error?: string)` action:
   - On `"success"`: call `connectedProvidersQueryRefetch()` (the `myConnectedMeetingProvidersQueryDocument` refetch already in scope), then `notifications.show(labels.enhancements.oauthCallbackSuccess, { severity: "success" })`.
   - On `"error"`: call `notifications.show(labels.enhancements.oauthCallbackError, { severity: "error" })` and `logger.error("OAuth callback error", { provider, error })`.
   - On `"focus"`: only refetch if a popup OAuth flow is in progress (guard with `connectingSlugs.size > 0`); otherwise skip to avoid unnecessary network traffic on unrelated tab focuses.
2. Expose `handleOAuthCallback` and the `enhancements` labels slice on the ViewModel return value. The existing `useMeetingConfigProfileLabels()` hook will need to load `enhancements` from `useAppTranslation(Translation.Ui.MeetingConfig).enhancements` and add it to the `MeetingConfigProfileLabels` type in `frontend/common/views/dashboard/profile/shared/types/meetingConfigProfile.types.ts`.
3. The `useNotifications` hook must be imported via the SUBPATH `@toolpad/core/useNotifications` (NOT `@toolpad/core`) — the same convention used by the settings ViewModel.

### For manager wiring (task 31)
`MeetingConfigsManager.tsx` renders `<OAuthCallbackHandler labels={state.labels.enhancements} onCallbackDetected={state.handleOAuthCallback} />` near the top of the returned `Stack` (before the `ReauthNeededBanner`), so the URL param cleanup happens on the initial mount before any other component reads the URL.

### Reused i18n keys
- `oauthCallbackSuccess` → "Provider connected successfully. Your account is now linked." / "تم ربط المزود بنجاح. حسابك أصبح مرتبطاً الآن." (success toast + aria-live)
- `oauthCallbackError` → "OAuth callback failed. Please try reconnecting your provider." / "فشل رد نداء OAuth. يرجى محاولة إعادة ربط المزود." (error toast + aria-live)

### Type imports
- `OAuthCallbackStatus` and `OAuthCallbackHandlerLabels` are exported from the component file and re-exported via the barrel `index.ts`.
- `MeetingConfigEnhancementLabels` is imported from `@/shared/locale/types/ui` (the canonical location, per `shared/locale/types/ui/index.ts`).
- `srOnlySx` is imported from `@/frontend/common/views/dashboard/settings/components/meetingIntegrations/useCopyFeedback` — the same sr-only style object used by the settings-side OAuth/clipboard components. If a shared `srOnlySx` utility is later promoted to `@/frontend/common/utils`, both the settings and profile components should switch to the shared import (task orchestrator may dispatch a follow-up).

## Cross-File Dependencies

1. **ViewModel → Component**: The component is ready to consume ViewModel outputs. The ViewModel wiring (task 30) is a prerequisite for the component to dispatch toasts/refetch on URL param detection.
2. **i18n → Component**: The `oauthCallbackSuccess` and `oauthCallbackError` keys already exist in `MeetingConfigEnhancementLabels` (created in task 1). No new i18n keys needed.
3. **`useMeetingConfigProfileLabels` → ViewModel**: The labels hook does not yet expose `enhancements`. Task 30 will add `enhancements: meetingConfig.enhancements` to the hook return and to the `MeetingConfigProfileLabels` type, then pass `state.labels.enhancements` to the component.
4. **`srOnlySx` import**: Currently lives under the settings domain. A cross-domain import is functionally safe (type-only/style-only constant, no tier/viewport logic) but may be refactored to a shared utility in a future cleanup pass.

## Deferred Items

- ViewModel wiring (adding `handleOAuthCallback` handler and `enhancements` labels to `useMeetingConfigsManagerViewModel.ts` + `useMeetingConfigProfileLabels.ts` + `MeetingConfigProfileLabels`) — task 30.
- Manager rendering (adding `<OAuthCallbackHandler>` to `MeetingConfigsManager.tsx`) — task 31.
- Unit/Storybook tests for the `OAuthCallbackHandler` (success params, error params, URL clean, focus event) — task 33 (test) / task 34 (stories).
