# Task 9 Outcome — ConnectProviderAction Component (Settings Tab)

## Summary

Created `ConnectProviderAction.tsx` — a shared non-tiered view component for initiating the meeting-provider OAuth connect flow from the settings tab's connected accounts area. The component renders a "Connect provider" button that delegates to a ViewModel callback (`onConnect`), with loading and error states. All translated strings are received via the `labels` prop (no `useAppTranslation` in the component), following `frontend/common/views/AGENTS.md` Rule 7.

## Files Created

- `frontend/common/views/dashboard/settings/components/meetingIntegrations/ConnectProviderAction.tsx`

## Files NOT Modified (and why)

- `frontend/common/views/dashboard/settings/tabs/meetingIntegrations/useMeetingIntegrationsViewModel.ts` — NOT modified. The ViewModel does not yet expose a `connectProvider` handler or `connectingFor`/`connectErrorFor` state. Wiring those into the ViewModel is a follow-up task that integrates `connectMeetingProviderOAuthMutationDocument` (from `@/frontend/common/graphql/sharedDocuments/meeting`) into the settings ViewModel, following the same pattern as the profile ViewModel's `handleReconnect` method (which calls `connectMeetingProviderOAuth` → redirects to `authorizeUrl`). The component is designed to consume those future ViewModel outputs via props.
- `shared/locale/types/dashboard/settings/meeting-integrations.ts` — NOT modified. The component reuses existing keys: `connectProvider`, `connecting`, `connectProviderError`. No new i18n keys needed.
- `frontend/common/views/dashboard/settings/tabs/meetingIntegrations/__shared__/meetingIntegrationsTabShared.tsx` — NOT modified. Integrating the component into the shared tab layout (rendering it inside each provider's accordion for unconnected providers) is a follow-up wiring task.

## Component Design

### Props Interface

```typescript
export type ConnectProviderActionLabels = Pick<
  SettingsMeetingIntegrationsLabels,
  "connectProvider" | "connecting" | "connectProviderError"
>;

export interface ConnectProviderActionProps {
  readonly labels: ConnectProviderActionLabels;
  readonly providerSlug: MeetingIntegrationProviderSlug;
  readonly providerName: string;
  readonly connecting: boolean;
  readonly connectError: string | null;
  readonly onConnect: (providerSlug: MeetingIntegrationProviderSlug) => void;
}
```

### States

| State | Condition | Render |
|-------|-----------|--------|
| Idle | `!connecting && !connectError` | Button with `LinkOutlined` icon, `connectProvider` label |
| Connecting | `connecting === true` | Button with `CircularProgress size={16}` start icon, `connecting` label, disabled |
| Error | `connectError && !connecting` | `Alert severity="error"` with `connectProviderError` title + retry button (`connectProvider` label) |

### Key Design Decisions

1. **Labels via props (Rule 7)**: The component receives `ConnectProviderActionLabels` (a `Pick` over `SettingsMeetingIntegrationsLabels`) — no `useAppTranslation` call, consistent with `frontend/common/views/AGENTS.md` Rule 7 for domain `components/` under `frontend/common/views/`.

2. **ViewModel callback pattern**: The component does NOT call `connectMeetingProviderOAuth` mutation directly. It receives `onConnect(providerSlug)` — the ViewModel owns the mutation call, `authorizeUrl` redirect, notifications, and error handling. This mirrors the profile `ConnectProviderAccount` pattern but without `useAppTranslation`.

3. **aria-label**: `Connect {providerName} OAuth` — uses the provider display name (not slug) for accessibility.

4. **Colors via theme**: Button uses `sx={theme => ({ backgroundColor: theme.palette.primary.main, color: theme.palette.onPrimary })}` — no hardcoded colors. Alert uses `sx={theme => ({ borderColor: theme.palette.error.main })}`.

5. **MUI v9 compliance**: All layout props (`disabled`, `size`, `color`, `variant`) are valid direct props on `Button`. Theme-specific styling goes through `sx` callback. Icons use `*Outlined` suffix (`LinkOutlined`).

6. **Error retry**: The error `Alert` includes an `action` slot with a button that re-triggers `onConnect` — the same button label (`connectProvider`) serves as the retry label.

7. **OAuth flow**: When wired into the ViewModel, the flow will be: `onConnect(providerSlug)` → ViewModel calls `connectMeetingProviderOAuth({ input: { providerSlug, returnPath } })` → redirects `window.location.href` to `authorizeUrl`.

## Verification Results

### Lint Lifecycle (tsgo → oxlint → biome → lint:type-aware)
```
bun run scripts/health/sub-loop.ts frontend/common/views/dashboard/settings/components/meetingIntegrations/ConnectProviderAction.tsx --lifecycle lint
✅ tsgo passed
✅ oxlint passed
✅ biome:check passed
✅ lint:type-aware passed
✅ All checks for lifecycle "lint" passed. (exit code 0)
```

### Codescene Lifecycle (full sweep: tsgo → oxlint → biome → lint → duplicates → codescene)
```
bun run scripts/health/sub-loop.ts frontend/common/views/dashboard/settings/components/meetingIntegrations/ConnectProviderAction.tsx --lifecycle codescene
✅ tsgo passed
✅ oxlint passed
✅ biome:check passed
✅ lint:type-aware passed
✅ check:duplicates passed
✅ codescene passed
✅ All checks for lifecycle "codescene" passed. (exit code 0)
```

## Carry-Forward Knowledge

### For ViewModel integration (follow-up task)
The settings ViewModel (`useMeetingIntegrationsViewModel.ts`) needs the following additions to wire `ConnectProviderAction`:
1. Import `connectMeetingProviderOAuthMutationDocument` from `@/frontend/common/graphql/sharedDocuments/meeting`
2. Add `useMutation(connectMeetingProviderOAuthMutationDocument)` call
3. Add `connectingFor: MeetingIntegrationProviderSlug | null` state (via Zustand store or useState)
4. Add `connectErrorFor: Record<MeetingIntegrationProviderSlug, string | null>` state
5. Implement `connectProvider(providerSlug)` handler that:
   - Sets `connectingFor` to the slug
   - Calls the mutation with `{ providerSlug, returnPath: window.location.pathname }`
   - On success: redirects `window.location.href` to `authorizeUrl`
   - On error: sets `connectErrorFor[slug]`, calls `notifications.show(labels.connectProviderError, { severity: "error" })`, logs via `logger.error`
   - Clears `connectingFor` in finally
6. Expose on ViewModel: `connectingFor`, `connectErrorFor`, `connectProvider`

### For shared tab wiring (follow-up task)
The `meetingIntegrationsTabShared.tsx` will render `ConnectProviderAction` inside each provider's accordion — likely below the `ConnectedAccountsTable` — for providers with zero connected accounts or where the current admin isn't connected. The component's props map as follows:
- `labels={labels}` (Pick works with the full labels object)
- `providerSlug={provider.slug}`
- `providerName={getProviderLabel(provider.slug, labels)}`
- `connecting={viewModel.connectingFor === provider.slug}`
- `connectError={viewModel.connectErrorFor[provider.slug] ?? null}`
- `onConnect={viewModel.connectProvider}`

### Reused i18n keys
- `connectProvider` → "Connect provider" / "ربط المزود" (button + retry label)
- `connecting` → "Connecting…" / "جارٍ الربط…" (loading state)
- `connectProviderError` → "Failed to connect provider." / "تعذّر ربط المزود." (error Alert title)

## Cross-File Dependencies

1. **ViewModel → Component**: The component is ready to consume ViewModel outputs. The ViewModel wiring is a prerequisite for the component to appear in the rendered UI.
2. **Meeting documents → ViewModel**: The `connectMeetingProviderOAuthMutationDocument` already exists in `frontend/common/graphql/sharedDocuments/meeting/meeting.documents.ts` (line 300) and exports `authorizeUrl` + `state` fields. No new GraphQL document needed.
3. **Profile `ConnectProviderAccount.tsx`**: Reference implementation for the OAuth connect flow (uses `useAppTranslation` directly — the settings `ConnectProviderAction` uses the labels-via-props pattern instead, per Rule 7 for domain components under `frontend/common/views/`).

## Deferred Items

- ViewModel wiring (adding `connectProvider` handler, `connectingFor`/`connectErrorFor` state to `useMeetingIntegrationsViewModel.ts`)
- Shared tab rendering (adding `ConnectProviderAction` to the accordion in `meetingIntegrationsTabShared.tsx`)
- Zustand store updates (adding `connectingFor`/`connectErrorFor` to `meetingIntegrationsSettingsStore` if state needs to survive viewport tier switch)
