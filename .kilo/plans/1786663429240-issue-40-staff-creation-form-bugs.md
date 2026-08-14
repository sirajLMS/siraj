# Issue #40: Fix Employee/Staff Creation Form Bugs

GitHub: #40 — `bug(staff): Resolve employee creation form state loss on screen rotation & missing save button on landscape tablets`

## Context

The staff/manager creation form (`/staff/create`) uses the mobile/desktop isolation architecture:
- `ManagerOnboardingContainer` (parent) calls `useManagerOnboardingContainerViewModel` which owns `useForm` state
- `ResponsiveViewSwitch` renders `ManagerOnboardingMobileView` or `ManagerOnboardingDesktopView` based on `useViewport().isMobile`
- `ViewportProvider` maps mobile (<600px) AND tablet (600-900px) to `isMobile: true`; desktop (>=900px) to `isMobile: false`
- Both mobile and desktop dashboard layouts have `overflowY: "auto"` scroll areas (`MobileMainScrollArea`, `DesktopMainScrollArea`)

### Root Cause Analysis

**Bug 1 — Silent save failure (highest impact, also root cause of #41):**
- `useOnboardingSubmit` catches errors and returns `submitError` + `onDismissError`
- The Container ViewModel destructures from the hook but does **not** expose `submitError`/`onDismissError` in the `ManagerOnboardingContainerViewModel` interface or return object
- Both mobile and desktop views only render `FormSuccessSnackbar` — **no error feedback is ever shown**
- `useCreateManagerOnboarding` also sets `useStaffOnboardingStore.error` but no view reads it
- Result: mutation failures (validation, network, permission) are silently swallowed; user clicks Save, nothing happens, assumes it worked → "disappeared" accounts (#41)

**Bug 2 — Avatar preview loss on screen rotation (scoped):**
- `useForm` state lives in the Container ViewModel (parent of `ResponsiveViewSwitch`), so text field values **persist** across tier switches (verified: `Controller` re-registers with the stable form instance)
- `useImageUpload` is called inside `AvatarEditorBody` (rendered by the tier view). Its local `useState` (`previewUrl`, `uploadState`) and `useRef` (`objectUrlRef`) are destroyed on tier switch
- After rotation: the uploaded server URL persists in the form's `avatarUrl` field, so `AvatarEditorBody` shows `previewUrl ?? imageUrl` = server URL. The avatar **image** still displays, but:
  - The local object URL preview (before upload completes) is lost
  - The `isUploading` spinner state is lost if rotation happens mid-upload
- This is a minor edge case; the primary customer complaint about "data being deleted" is more likely the silent save failure (Bug 1) or the save button being off-screen (Bug 3)

**Bug 3 — Save button not visible on tablet landscape:**
- Desktop view (`managerOnboarding.desktop.tsx`) renders `StyledFormActions` (Save/Cancel buttons) at the bottom of the form
- The dashboard layout scroll area (`DesktopMainScrollArea`) has `overflowY: "auto"`, so the page scrolls, but the Save button is below the fold on shorter viewports
- No sticky/pinned positioning on the action footer — user must scroll down to find it
- Established pattern exists: `searchSchedulePaginationFooter.desktop.tsx` uses `position: "sticky", bottom: 0, backgroundColor: theme.palette.background.default`

## Decisions

1. **Bug 2 scope**: Avatar preview only — text fields already persist via `useForm` in the parent Container. No Zustand form backup needed. (User confirmed)
2. **Error i18n**: Add `actions.errorMessage` to `StaffOnboardingLabels` type + ar/en implementations. Pass `onError` handler to `useOnboardingSubmit` that returns `labels.actions.errorMessage` for generic fallback. GraphQL errors from backend are already localized (via `ctx.t()` in resolvers), so `error.message` is displayed directly. (User confirmed)
3. **Error snackbar components**: Use `FormErrorSnackbar` (common, bottom-center) for mobile and `DesktopFormErrorSnackbar` (top-right) for desktop — matching the teacher onboarding pattern. Both tiers show errors (teacher mobile currently doesn't — that's a pre-existing gap we're not fixing here).
4. **Sticky footer**: Apply `position: "sticky", bottom: 0` to `StyledFormActions` in both mobile and desktop views, following the `searchSchedulePaginationFooter.desktop.tsx` pattern.

## Affected Files

| File | Change |
|------|--------|
| `shared/locale/types/dashboard/staff/onboarding.ts` | Add `errorMessage: string` to `actions` section |
| `shared/locale/ar/dashboard/staff/onboarding.ts` | Add Arabic `errorMessage` translation |
| `shared/locale/en/dashboard/staff/onboarding.ts` | Add English `errorMessage` translation |
| `frontend/common/views/dashboard/staff/onboarding/useManagerOnboardingContainerViewModel.ts` | Expose `submitError` + `onDismissError`; pass `onError` handler to `useOnboardingSubmit`; remove dead `showSuccess` useState/useEffect |
| `frontend/common/views/dashboard/staff/onboarding/types.ts` | Add `submitError` + `onDismissError` to `ManagerOnboardingViewProps` |
| `frontend/mobile/views/dashboard/staff/onboarding/managerOnboarding.mobile.tsx` | Render `FormErrorSnackbar`; make `StyledFormActions` sticky |
| `frontend/desktop/views/dashboard/staff/onboarding/managerOnboarding.desktop.tsx` | Render `DesktopFormErrorSnackbar`; make `StyledFormActions` sticky |

## Implementation Tasks

### Task 1: Add error message i18n label

1. **`shared/locale/types/dashboard/staff/onboarding.ts`**: Add `readonly errorMessage: string;` to the `actions` object (after `successMessage`)
2. **`shared/locale/ar/dashboard/staff/onboarding.ts`**: Add `errorMessage: "فشل إنشاء الحساب. يرجى المحاولة مرة أخرى."` to `actions`
3. **`shared/locale/en/dashboard/staff/onboarding.ts`**: Add `errorMessage: "Failed to create account. Please try again."` to `actions`

### Task 2: Surface submission errors to the user (Bug 1)

1. **`useManagerOnboardingContainerViewModel.ts`**:
   - Add `submitError: string | null` and `onDismissError: () => void` to `ManagerOnboardingContainerViewModel` interface
   - Pass `onError` handler to `useOnboardingSubmit`: `onError: () => labels.actions.errorMessage` (returns the translated generic message; GraphQL errors that have a `.message` will use that instead since `useOnboardingSubmit` checks `onError?.(error)` first, but the handler ignores the error and returns the generic label — this is intentional because GraphQL error messages may contain sensitive details)
   - Destructure `submitError` and `onDismissError` from `useOnboardingSubmit` and return them
   - Remove the dead `showSuccess` `useState` + `useEffect` (lines 57, 70-78) — the actual `showSuccess` comes from `showSuccessState` returned by `useOnboardingSubmit`
2. **`types.ts`**: Add `readonly submitError: string | null;` and `readonly onDismissError: () => void;` to `ManagerOnboardingViewProps`

### Task 3: Render error snackbar in tier views

1. **`managerOnboarding.mobile.tsx`**:
   - Import `FormErrorSnackbar` from `@/frontend/common/components/ui/form/snackbar/FormErrorSnackbar`
   - Destructure `submitError` and `onDismissError` from props
   - Render `<FormErrorSnackbar open={Boolean(submitError)} message={submitError ?? ""} onClose={onDismissError} />` alongside the existing `FormSuccessSnackbar`
2. **`managerOnboarding.desktop.tsx`**:
   - Import `DesktopFormErrorSnackbar` from `@/frontend/desktop/components/ui` (check barrel export)
   - Destructure `submitError` and `onDismissError` from props
   - Render `<DesktopFormErrorSnackbar open={Boolean(submitError)} message={submitError ?? ""} onClose={onDismissError} />` alongside the existing `FormSuccessSnackbar`

### Task 4: Make action footer sticky (Bug 3)

1. **`managerOnboarding.desktop.tsx`** — Update `StyledFormActions` styled component:
   ```typescript
   const StyledFormActions = styled(Box)(({ theme }) => ({
     display: "flex",
     alignItems: "center",
     justifyContent: "space-between",
     flexDirection: "row",
     gap: theme.spacing(2),
     paddingTop: theme.spacing(2),
     borderTop: `1px solid ${theme.palette.outlineVariant}`,
     position: "sticky",
     bottom: 0,
     flexShrink: 0,
     backgroundColor: theme.palette.background.default,
     boxShadow: theme.palette.shadow.card,
   }));
   ```
2. **`managerOnboarding.mobile.tsx`** — Update `StyledFormActions` styled component:
   ```typescript
   const StyledFormActions = styled(Box)(({ theme }) => ({
     display: "flex",
     alignItems: "stretch",
     justifyContent: "center",
     flexDirection: "column",
     gap: theme.spacing(1.5),
     paddingTop: theme.spacing(2),
     borderTop: `1px solid ${theme.palette.outlineVariant}`,
     position: "sticky",
     bottom: 0,
     flexShrink: 0,
     backgroundColor: theme.palette.background.default,
     boxShadow: theme.palette.shadow.card,
   }));
   ```

### Task 5: Avatar preview persistence (Bug 2 — minor)

The avatar image persists via the form field after rotation (server URL). The only loss is the local object URL preview during upload and the upload spinner state. This is an edge case that requires lifting `useImageUpload` state above the tier switch boundary — a significant refactor of `AvatarImageField` that affects all onboarding flows (teacher, parent, manager).

**Decision: Defer this to a separate issue.** The primary customer complaints (silent failure, missing save button) are addressed by Tasks 1-4. The avatar preview loss is cosmetic and only occurs if the user rotates mid-upload.

### Task 6: Verify and test

1. Run per-file quality loop on all modified files:
   ```bash
   bun run scripts/health/sub-loop.ts <file-path> --lifecycle codescene
   ```
2. Run `bun tsgo` to verify type safety across the i18n label changes
3. Run existing tests:
   ```bash
   bun run scripts/run-test/run-test.ts frontend/common/graphql/test/teachers/manager-onboarding.test.ts
   ```
4. Manual verification (if dev server available):
   - Submit form with invalid data → error snackbar should appear (bottom-center on mobile, top-right on desktop)
   - Submit form with valid data → success snackbar, redirect to `/staff`
   - Tablet landscape → Save button should be sticky/visible without scrolling

## Risks

- **Sticky footer + scroll**: `position: sticky` requires the parent to have a scrollable overflow context. The dashboard layout's `DesktopMainScrollArea` / `MobileMainScrollArea` provide `overflowY: "auto"`, so sticky should work. Verify the `DesktopPageContainer` (flex column, no overflow) doesn't break the sticky context — it shouldn't since sticky works relative to the nearest scrolling ancestor.
- **`onError` handler**: The handler returns `labels.actions.errorMessage` regardless of the error type. This means GraphQL validation errors (which may have specific messages) will show the generic message instead. This is intentional for security (avoid leaking backend details) and consistency. If specific error messages are needed later, the handler can inspect the error.
- **Dead code removal**: Removing the `showSuccess` useState/useEffect in the Container ViewModel is safe — it's never read in the return object. The actual `showSuccess` comes from `useOnboardingSubmit`'s `showSuccessState`.

## Out of Scope

- Issue #41 (disappeared staff) — will be addressed separately after #40 fixes the silent failure root cause
- Issue #42 (manager role defaults to staff + edit modal) — separate issue
- Issues #43, #39 — feature requests, separate plans
- Avatar preview persistence across tier switch (Bug 2 minor edge case) — deferred to separate issue
- Teacher onboarding mobile error snackbar gap — pre-existing, not part of this issue
