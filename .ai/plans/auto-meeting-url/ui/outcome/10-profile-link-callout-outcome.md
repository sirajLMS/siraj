# Task 10 Outcome — ProfileLinkCallout Cross-Navigation Component

## Summary

Created `ProfileLinkCallout.tsx` — a cross-navigation component in the settings meeting-integrations tab that renders a subtle outlined "View Teacher Meeting Configs" button linking to `/profile?tab=meeting`. The component is permission-gated via `<RequirePermission>` using `AppPermission.SettingsEditMeetingIntegrations` from the codegen types. All strings are passed as a `labels` prop from the ViewModel (no `useAppTranslation` call in this view component).

## Files Created

- `frontend/common/views/dashboard/settings/components/meetingIntegrations/ProfileLinkCallout.tsx`

## Files Modified

None.

## Component Details

### Props Interface
```typescript
interface ProfileLinkCalloutProps {
  readonly labels: SettingsMeetingIntegrationsLabels;
  readonly onNavigate: () => void;
}
```

### Key Design Decisions

1. **Permission Gating**: Uses `<RequirePermission permissions={AppPermission.SettingsEditMeetingIntegrations}>` (imported from `@/frontend/common/components/auth/RequirePermission`) for client-side in-component gating. The `AppPermission` enum is imported from `@/frontend/common/graphql/generated/gql/graphql-types` — not a bare string literal.

2. **Labels Pass-Down (Rule 7 Compliance)**: The component receives `labels: SettingsMeetingIntegrationsLabels` as a prop and uses `labels.viewProfileMeetingConfigs` for the button text. No `useAppTranslation` call in this component — per `frontend/common/views/AGENTS.md` Rule 7, the ViewModel owns all view-layer translations.

3. **Navigation Handler**: The `onNavigate` callback is passed from the ViewModel (task 29 will add `navigateToProfile()` action via `router.push('/profile?tab=meeting')`). The component does NOT call `useRouter` directly — it delegates to the ViewModel callback.

4. **Subtle Styling**: Uses `variant="outlined"` and `size="small"` — not a primary button, per design spec.

5. **Accessibility**: `aria-label="Navigate to teacher meeting configs"` on the button, with an `OpenInNewOutlined` start icon for visual affordance.

6. **No Hardcoded Colors**: No color props or `sx` color overrides — relies on MUI theme defaults for the outlined button variant.

### Labels Key Used
- `viewProfileMeetingConfigs` — already exists in the `SettingsMeetingIntegrationsLabels` interface (`shared/locale/types/dashboard/settings/meeting-integrations.ts:19`). No new i18n keys were needed.

## Verification Results

```
bun run scripts/health/sub-loop.ts frontend/common/views/dashboard/settings/components/meetingIntegrations/ProfileLinkCallout.tsx --lifecycle lint
✅ tsgo passed
✅ oxlint passed
✅ biome:check passed
✅ lint:type-aware passed
✅ All checks for lifecycle "lint" passed. (exit code 0)
```

## Carry-Forward Knowledge

- The `viewProfileMeetingConfigs` label key already exists in `SettingsMeetingIntegrationsLabels` — was added in Task 1 (i18n foundation). No new translation keys needed for this component.
- The `RequirePermission` component supports both single permission and array-of-permissions, using OR logic (user needs at least one).
- The component follows the same pattern as `TestConnectionResultPanel` and `EndpointList` — receiving `labels` as a prop rather than calling `useAppTranslation` directly.
- Task 29 (ViewModel) will wire up the `onNavigate` callback and pass `labels` to this component. Task 2b (MeetingIntegrationsTab container) will integrate it into the tab header layout.

## Cross-File Dependencies

- **Task 29** (`useMeetingIntegrationsViewModel`): Must add `navigateToProfile()` action (router.push to `/profile?tab=meeting`) and pass `labels.viewProfileMeetingConfigs` to this component.
- **Task 2b** (`MeetingIntegrationsTab` container): Must render `<ProfileLinkCallout>` in the tab header/toolbar area.
- **Task 28** (settings store): Must add `canViewProfile` permission check state if needed.

## Deferred Items

None. The component is self-contained and ready for integration by tasks 2b and 29.
