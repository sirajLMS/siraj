# Task 17: Accessibility & Permission Denial UI — Outcome

## Summary

Added accessibility attributes (`aria-invalid`, `aria-busy`, `aria-label`, `role="alert"`, `role="status"` via `<output>` element) and enhanced permission denial UI across the WhatsApp settings components. All `RequirePermission` fallbacks now render a visible "Permission Denied" state with icon, title, and description instead of `null`.

## Files Modified

### Frontend Components
1. **`frontend/common/views/dashboard/settings/whatsapp/WhatsappTabPanels.tsx`**
   - Enhanced `PermissionDeniedFallback` from simple Alert to Stack with LockOutlined icon + title + description + `role="alert"`
   - Changed `TabPanelFallback` loading container from `<Box role="status">` to `<Box component="output" aria-busy>` (implicit `role="status"`)
   - Updated `RequirePermission` fallback to pass `title` and `description` props from new i18n keys
   - Removed unused `Alert` import; added `LockOutlined`, `Stack`, `Typography` imports

2. **`frontend/common/views/dashboard/settings/whatsapp/tabs/shared/NumberCard.tsx`**
   - Added `role="alert"` to coexistence warning Alert and unverified warning Alert

3. **`frontend/common/views/dashboard/settings/whatsapp/tabs/shared/TemplatesTabContent.tsx`**
   - Changed loading container from `<Box role="status">` to `<Box component="output" aria-busy>`
   - Added `role="alert"` to error container
   - Added `aria-busy` on sync button
   - Added `RequirePermission` fallback with LockOutlined icon for empty-state sync CTA
   - Added `LockOutlined` to imports

4. **`frontend/common/views/dashboard/settings/whatsapp/tabs/shared/OptInTabContent.tsx`**
   - Changed opt-in loading Box from `role="status"` to `component="output" aria-busy`
   - Enhanced `RequirePermission` admin fallback from simple Alert to Stack with LockOutlined icon + title + description + `role="alert"`
   - Removed unused `Alert`/`ErrorOutlined` imports; added `LockOutlined`

5. **`frontend/common/views/dashboard/settings/whatsapp/createAccountDialog/CreateAccountDialog.tsx`**
   - Added `aria-invalid={!!error}` on displayName, phoneNumberId, and wabaId TextFields
   - Added `role="alert"` on mutation error Alert

6. **`frontend/common/views/dashboard/settings/whatsapp/editNameDialog/EditNameDialog.tsx`**
   - Added `aria-invalid={!!error}` on name TextField
   - Added `role="alert"` on mutation error Alert

7. **`frontend/desktop/views/dashboard/settings/whatsapp/tabs/NumbersTab.desktop.tsx`**
   - Changed main loading Box from `role="status"` to `component="output" aria-busy`
   - Added `aria-busy={isDeleting_id === account.id}` on per-card deleting Box
   - Added `aria-label` + `aria-busy` on sync button (desktop already had aria-labels on edit/delete IconButtons)

8. **`frontend/mobile/views/dashboard/settings/whatsapp/tabs/NumbersTab.mobile.tsx`**
   - Changed main loading skeleton Box from `role="status"` to `component="output" aria-busy`
   - Added `aria-busy={isBusy}` on per-card busy Box
   - Added `aria-label` + `aria-busy` on sync button
   - Added `aria-invalid` on credential TextField (mobile credential dialog has validation)

### Locale Files
9. **`shared/locale/types/whatsapp/index.ts`** — Added `permissionDeniedTitle` and `permissionDeniedDescription` to `WhatsappLabels` interface
10. **`shared/locale/en/whatsapp/index.ts`** — Added EN: `"Access Restricted"` and description text
11. **`shared/locale/ar/whatsapp/index.ts`** — Added AR: `"الوصول مقيد"` and description text

## Files NOT Modified (and why)

- **Dialog focus trap**: MUI Dialog handles focus trapping and Escape key close by default. No overrides found that disable it — verified by reading dialog component code.
- **No `fallback={null}` instances remain**: All `RequirePermission` instances already use proper fallbacks from prior tasks (Task 11 created the initial `PermissionDeniedFallback`).
- **Desktop credential dialog**: Desktop `CredentialEditDialog` has no validation (no `error`/`helperText` on its TextField), so `aria-invalid` was not needed there.

## Key Technical Decisions

### `role="status"` vs `<output>` element
The oxlint `jsx-a11y(prefer-tag-over-role)` rule requires semantic HTML elements instead of ARIA roles where possible. `role="status"` on `<Box>` triggers the error. Solution: use `<Box component="output" aria-busy>` — the HTML `<output>` element has implicit `role="status"`, satisfying the accessibility requirement and the linter.

### `role="alert"` on Alert components
MUI Alert renders with `role="alert"` natively, but explicit `role="alert"` on Alert and warning Box elements was not flagged by oxlint. Added for clarity and to cover non-Alert containers.

### PermissionDeniedFallback enhancement
Changed from simple `<Alert severity="warning">{message}</Alert>` to:
```tsx
<Stack sx={{ alignItems: "center", gap: 2, py: 4 }} role="alert">
  <LockOutlined color="action" sx={{ fontSize: 48 }} />
  <Typography variant="titleLg">{title}</Typography>
  <Typography variant="bodyMd" color="textSecondary">{description}</Typography>
</Stack>
```
Uses MUI v9 `sx` prop for all styling (no direct style props). Icon + title + description pattern matches the task spec.

### MUI v9 Stack prop restriction
`Stack` does not accept `alignItems` as a direct prop in MUI v9. Must use `sx={{ alignItems: "center" }}` instead. This caused tsgo errors initially.

## Verification Results

All files passed `sub-loop.ts --lifecycle codescene` (tsgo → oxlint → biome → lint:type-aware → check:duplicates → codescene):

| File | Status |
|------|--------|
| `NumberCard.tsx` | ✅ ALL PASSED |
| `WhatsappTabPanels.tsx` | ✅ ALL PASSED |
| `TemplatesTabContent.tsx` | ✅ ALL PASSED |
| `OptInTabContent.tsx` | ✅ ALL PASSED |
| `CreateAccountDialog.tsx` | ✅ ALL PASSED |
| `EditNameDialog.tsx` | ✅ ALL PASSED |
| `NumbersTab.desktop.tsx` | ✅ ALL PASSED |
| `NumbersTab.mobile.tsx` | ✅ ALL PASSED |
| `shared/locale/types/whatsapp/index.ts` | ✅ ALL PASSED |
| `shared/locale/en/whatsapp/index.ts` | ✅ ALL PASSED |
| `shared/locale/ar/whatsapp/index.ts` | ✅ ALL PASSED |

Global checks:
- `bun tsgo` — ✅ 0 errors
- `bun biome:check` — ✅ passed (auto-fixed 1 file)
- `bun run lint` — ✅ passed

## Carry-Forward Knowledge

1. **oxlint `jsx-a11y(prefer-tag-over-role)`**: Use `<Box component="output">` for `role="status"`, `<Box component="alert">` for `role="alert"`. The rule requires semantic HTML elements instead of explicit `role` attributes on div/Box.

2. **MUI v9 Stack**: `Stack` does NOT accept `alignItems`, `justifyContent`, or `direction` as direct props. All must go through `sx` prop: `sx={{ alignItems: "center", justifyContent: "center" }}`.

3. **PermissionDeniedFallback pattern**: The enhanced fallback with LockOutlined icon + title + description + `role="alert"` is the canonical pattern for permission-denied states. Reuse `permissionDeniedTitle` and `permissionDeniedDescription` i18n keys.

4. **`aria-invalid` on MUI TextField**: MUI's `error` prop already sets `aria-invalid` implicitly, but explicit `aria-invalid={!!error}` is clearer and satisfies accessibility audits. No conflict with MUI's built-in behavior.

5. **`aria-busy` on loading containers**: Use `<Box component="output" aria-busy>` for loading states — the `<output>` element's implicit `role="status"` announces to screen readers, and `aria-busy` indicates active loading.

## Cross-File Dependencies

- **i18n keys**: `permissionDeniedTitle` and `permissionDeniedDescription` added to locale type schema, EN, and AR. All three files must be kept in sync — adding a key to the type schema requires implementations in both `en/whatsapp/index.ts` and `ar/whatsapp/index.ts`.
- **PermissionDeniedFallback**: Defined in `WhatsappTabPanels.tsx` and used by all tab content files via `RequirePermission` fallback prop. The enhanced version accepts `title` and `description` string props.
