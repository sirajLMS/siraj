# Task 32: Settings Tab Mobile Parity — Audit Outcome

## Summary

Verification/audit of all settings tab variants to ensure mobile equivalents exist and follow mobile-desktop isolation rules. One defect found and fixed (touch target size on mobile action buttons).

## Audit Results

### 1. MobileMetricCardGrid for Health Headers

**Status: ✅ PASS**

- `frontend/mobile/views/dashboard/settings/components/meetingIntegrations/meetingIntegrationsHealthHeaders.mobile.tsx` uses `MobileMetricCardGrid` from `@/frontend/mobile/components/ui`
- Desktop counterpart uses `DesktopMetricCardGrid`
- Common switcher `MeetingIntegrationsHealthHeaders.tsx` uses `createLazyView` + `ResponsiveViewSwitch` to lazy-load the correct variant

### 2. MobileCardList for Connected Accounts

**Status: ✅ PASS**

- `frontend/mobile/views/dashboard/settings/components/meetingIntegrations/ConnectedAccountsTable.mobile.tsx` uses `MobileCardList` from `@/frontend/mobile/components/ui`
- Desktop counterpart uses `DesktopAppDataGrid`
- Common switcher `ConnectedAccountsTable.tsx` uses `createLazyView` + `ResponsiveViewSwitch`

### 3. Full-Screen Dialogs for Credential Form

**Status: ✅ N/A (not a dialog)**

- `MeetingProviderCredentialForm` is NOT a dialog — it renders inline within `AccordionDetails` in the shared scaffold
- No full-screen dialog needed; the form is part of the accordion expand/collapse flow
- This is the correct pattern for inline editing in a settings tab

### 4. BaseDeleteDialog Responsive

**Status: ✅ PASS**

- `baseDeleteDialogShared.tsx` uses `maxWidth="xs" fullWidth` — appropriate for a simple confirm dialog on mobile
- Confirm/cancel buttons have `py: 1.5` (12px top + 12px bottom = 24px padding + ~24px content ≈ 48px touch target)
- `RevokeTokenDialog` and `DisconnectConfirmDialog` both wrap `BaseDeleteDialogScaffold` — responsive by inheritance

### 5. Touch Targets ≥48dp

**Status: ✅ FIXED (was defect)**

- **Defect found**: Mobile `ConnectedAccountsTable.mobile.tsx` action buttons (View Metadata, Revoke) used `size="small"` (~32px height) — below 48dp guideline
- **Fix applied**: Added `sx={{ minHeight: 48 }}` to both action buttons while keeping `size="small"` for visual compactness
- Also added `variant="outlined"` for visual clarity and `flexWrap: "wrap"` on the Stack to prevent overflow
- `BaseDeleteDialog` buttons: ✅ Already compliant (~48px via `py: 1.5`)

### 6. No Horizontal Scrolling

**Status: ✅ PASS**

- Mobile tab skeleton: `overflowX: "hidden"` on root container
- Search row: `flex: 1, minWidth: 0` on text field to prevent overflow
- Connected accounts action button row: `flexWrap: "wrap"` on Stack (added during fix)
- All content stacks vertically in mobile variants

### 7. Labels from ViewModel (No useAppTranslation in Mobile/Desktop Variants)

**Status: ✅ PASS**

- Grep confirmed: No `useAppTranslation` calls in any mobile or desktop variant file
- All strings passed as `labels` prop from the ViewModel via the shared scaffold
- Mobile/desktop variants receive `labels` through props from `MeetingIntegrationsTabShared`

### 8. paginationOptions on DesktopAppDataGrid / MobileCardList

**Status: ✅ PASS**

- Mobile `ConnectedAccountsTable.mobile.tsx`: passes `paginationOptions={{ mode: "client", pageSize: 10 }}` to `MobileCardList`
- Desktop `ConnectedAccountsTable.desktop.tsx`: passes `paginationOptions={{ mode: "client", pageSize: 10 }}` to `DesktopAppDataGrid`
- Both use client-side pagination with page size 10

### 9. TokenMetadataDialog

**Status: ✅ PASS (acceptable)**

- Uses raw `Dialog` with `maxWidth="sm" fullWidth` — not full-screen on mobile
- Acceptable because it's a read-only info dialog (displays token metadata), not a form
- Full-screen dialogs are required for forms/complex interactions, not for simple info display

## Files Modified

1. `frontend/mobile/views/dashboard/settings/components/meetingIntegrations/ConnectedAccountsTable.mobile.tsx`
   - Added `sx={{ minHeight: 48 }}` to both action buttons (View Metadata, Revoke)
   - Added `variant="outlined"` to both action buttons
   - Added `sx={{ flexWrap: "wrap" }}` to action button Stack

## Quality Verification

- `sub-loop.ts --lifecycle lint` on modified file: ✅ All checks passed (tsgo, oxlint, biome, lint:type-aware)

## Architecture Verification

The settings tab follows the correct three-tier responsive architecture:

```
Common switcher (createLazyView + ResponsiveViewSwitch)
  ├─ Desktop variant (thin wrapper → shared scaffold with desktop sx)
  └─ Mobile variant (thin wrapper → shared scaffold with mobile sx)
```

All 10 sub-components within the settings tab are properly tiered:
1. `MeetingIntegrationsHealthHeaders` — switcher with desktop/mobile variants ✅
2. `MeetingProviderCredentialForm` — common (inline form, no tier needed) ✅
3. `ConnectedAccountsTable` — switcher with desktop/mobile variants ✅
4. `RevokeTokenDialog` — wraps BaseDeleteDialog (responsive) ✅
5. `DisconnectConfirmDialog` — wraps BaseDeleteDialog (responsive) ✅
6. `TokenMetadataDialog` — common Dialog (read-only info) ✅
7. `TestConnectionResultPanel` — common (no tier needed) ✅
8. `EndpointList` — common (no tier needed) ✅
9. `ConnectProviderAction` — common (no tier needed) ✅
10. `ProfileLinkCallout` — common (uses useMediaQuery for prefers-reduced-motion only) ✅
