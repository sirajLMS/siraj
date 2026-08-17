# Task 2b Outcome — Redesign `MeetingIntegrationsTab` Container

## Summary

The `MeetingIntegrationsTab` container was already a thin `ResponsiveViewSwitch` + `createLazyView` switcher (built in prior tasks), lazily loading desktop/mobile tier variants. This task completed the wiring by:

1. Adding `ConnectProviderAction` (Task 9) and `ProfileLinkCallout` (Task 10) into the shared scaffold layout (`meetingIntegrationsTabShared.tsx`), so both tier variants now compose **all 10** design-spec components.
2. Extending the `MeetingIntegrationsViewModel` type and hook with stub fields for `connectingFor`, `connectErrorFor`, `connectProvider`, and `navigateToProfile` — placeholder implementations that Task 29 will replace with real OAuth-flow and router-navigation wiring.

No structural changes were needed to the switcher (`MeetingIntegrationsTab.tsx`) or the desktop/mobile variant wrappers (`meetingIntegrationsTab.desktop.tsx` / `.mobile.tsx`) — they were already correctly architected. The shared scaffold simply needed the two missing components wired in.

## Files Modified

### 1. `frontend/common/views/dashboard/settings/types/meetingIntegrations.types.ts`
- Added four new fields to `MeetingIntegrationsViewModel`:
  - `connectingFor: MeetingIntegrationProviderSlug | null` — tracks which provider is currently initiating OAuth
  - `connectErrorFor: Readonly<Partial<Record<MeetingIntegrationProviderSlug, string | null>>>` — per-provider connect error messages
  - `connectProvider: (providerSlug: MeetingIntegrationProviderSlug) => void` — initiates OAuth connect flow
  - `navigateToProfile: () => void` — cross-navigation to `/profile?tab=meeting`

### 2. `frontend/common/views/dashboard/settings/tabs/meetingIntegrations/useMeetingIntegrationsViewModel.ts`
- Added stub implementations for the four new ViewModel fields:
  - `connectingFor` — hardcoded `null` (no provider is connecting)
  - `connectErrorFor` — hardcoded `{}` (no errors)
  - `connectProvider` — `useCallback` no-op that logs via `logger.info` (Task 29 will wire OAuth mutation + redirect)
  - `navigateToProfile` — `useCallback` no-op that logs via `logger.info` (Task 29 will wire `router.push("/profile?tab=meeting")`)
- All four are returned in the ViewModel object

### 3. `frontend/common/views/dashboard/settings/tabs/meetingIntegrations/__shared__/meetingIntegrationsTabShared.tsx`
- Added imports for `ConnectProviderAction` and `ProfileLinkCallout`
- Rendered `ProfileLinkCallout` in the tab header area (after `MeetingIntegrationsHealthHeaders`, before the provider accordions) — calls `viewModel.navigateToProfile` on click, permission-gated via `RequirePermission` inside the component itself
- Rendered `ConnectProviderAction` inside each provider's `AccordionDetails` (first item, before `EndpointList`) — passes `viewModel.connectingFor`, `viewModel.connectErrorFor[provider.slug]`, and `viewModel.connectProvider`

## Files NOT Modified (and why)

### `frontend/common/views/dashboard/settings/tabs/meetingIntegrations/MeetingIntegrationsTab.tsx`
Already a thin `createLazyView` + `ResponsiveViewSwitch` switcher. No changes needed — it correctly lazy-loads desktop/mobile variants and passes the ViewModel via `props={viewModel}`. This satisfies AC-1.7 (lazy-load + code-split).

### `frontend/desktop/views/dashboard/settings/tabs/meetingIntegrations/meetingIntegrationsTab.desktop.tsx`
Already a thin wrapper that calls `MeetingIntegrationsTabShared` with `DESKTOP_SUMMARY_CONTENT_SX`, `DESKTOP_SUMMARY_ROW_SX`, `DESKTOP_DETAILS_SX` slot props. No changes needed — the new components are common (non-tiered) and render identically in both tiers via the shared scaffold.

### `frontend/mobile/views/dashboard/settings/tabs/meetingIntegrations/meetingIntegrationsTab.mobile.tsx`
Already a thin wrapper that calls `MeetingIntegrationsTabShared` with `MOBILE_SUMMARY_CONTENT_SX`, `MOBILE_SUMMARY_ROW_SX`, `MOBILE_DETAILS_SX` slot props. No changes needed — same reasoning as desktop.

### No new barrel `index.ts` files created
The tab directories (`frontend/desktop/views/dashboard/settings/tabs/meetingIntegrations/` and the mobile equivalent) follow the established pattern of being lazily imported by file path (not via barrel). The desktop/mobile _component_ directories (`ConnectedAccountsTable.desktop`, `meetingIntegrationsHealthHeaders.desktop`) already have barrels. No new directories or files were created in this task.

## Component Composition (All 10 Design-Spec Components)

The shared scaffold now composes all components from the design spec §3.1:

| # | Component | Location in Scaffold | Tier |
|---|-----------|---------------------|------|
| 1 | `SettingsTabShell` | Outer wrapper | Common |
| 2 | `MeetingIntegrationsHealthHeaders` | Header (after shell) | Responsive switcher (desktop/mobile) |
| 3 | `ProfileLinkCallout` | Header (after health headers) | Common (permission-gated) |
| 4 | `ConnectProviderAction` | Per-provider accordion details (first) | Common |
| 5 | `EndpointList` | Per-provider accordion details | Common |
| 6 | `MeetingProviderCredentialForm` | Per-provider accordion details | Common |
| 7 | `TestConnectionResultPanel` | Per-provider accordion details | Common |
| 8 | `ConnectedAccountsTable` | Per-provider accordion details | Responsive switcher (desktop/mobile) |
| 9 | `RevokeTokenDialog` | Tab-level dialog | Common |
| 10 | `TokenMetadataDialog` | Tab-level dialog | Common |

## Verification Results

Ran `bun run scripts/health/sub-loop.ts <file-path> --lifecycle lint` for each modified file:

| File | tsgo | oxlint | biome | lint:type-aware | Result |
|------|------|--------|-------|-----------------|--------|
| `meetingIntegrations.types.ts` | ✅ | ✅ | ✅ | ✅ | PASS |
| `useMeetingIntegrationsViewModel.ts` | ✅ | ✅ | ✅ | ✅ | PASS |
| `meetingIntegrationsTabShared.tsx` | ✅ | ✅ | ✅ | ✅ | PASS |

All files passed the full lint lifecycle (tsgo → oxlint → biome → lint:type-aware).

## Carry-Forward Knowledge

### For Task 29 (ViewModel wiring)
- **`connectProvider` stub** — currently a `useCallback` no-op that calls `logger.info`. Task 29 must:
  1. Add `useMutation(connectMeetingProviderOAuthMutationDocument)` (document from `@/frontend/common/graphql/sharedDocuments/meeting`)
  2. Set `connectingFor` state before calling mutation
  3. On success: redirect to `authorizeUrl` (like the profile ViewModel's `handleReconnect`)
  4. On error: set `connectErrorFor[providerSlug]` with error message
  5. Clear `connectingFor` in finally block
- **`navigateToProfile` stub** — currently a `useCallback` no-op. Task 29 must use `useRouter` from `next/navigation` and call `router.push("/profile?tab=meeting")`.
- **Store state** — `connectingFor` and `connectErrorFor` may need Zustand store fields (like `testingFor`, `revokingFor`) OR can be local `useState` in the ViewModel hook since they're ephemeral. The existing pattern uses Zustand for cross-component state, but connect-flow state is scoped to the ViewModel only.

### For Task 3-10 Component Authors
- All 10 components are now wired into the tab layout. No additional integration work needed in those tasks.
- `ConnectProviderAction` and `ProfileLinkCallout` are common (non-tiered) components — no desktop/mobile variants exist or are needed. They render identically in both tiers.

### Architecture Pattern Confirmed
- **Switcher** (`MeetingIntegrationsTab.tsx`): `createLazyView` + `ResponsiveViewSwitch` — code-splits desktop/mobile chunks (AC-1.7)
- **Desktop/mobile variants**: Thin wrappers calling `MeetingIntegrationsTabShared` with tier-specific `SxProps` slot props
- **Shared scaffold** (`meetingIntegrationsTabShared.tsx`): Owns ALL layout logic, composes all components, receives ViewModel + slot props
- **ViewModel** (`useMeetingIntegrationsViewModel.ts`): Owns all translations via `useAppTranslation`, passes `labels` down to tier views and components (Rule 7 compliance)

## Cross-File Dependencies

None. All modifications were self-contained within the three modified files. No cross-file rule violations detected during quality verification.
