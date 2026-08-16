# Task 16: Animations & Transitions — Outcome

## Summary

Implemented all animation and transition requirements for the WhatsApp settings UI:

1. **Tab fade-in transition** — `@keyframes whatsappTabFadeIn` (200ms ease-in-out, opacity + translateY) applied to the tabpanel `Box` in `WhatsappTabPanels.tsx`. Uses `key={activeTab}` to re-trigger the animation on tab switch.

2. **Row enter animation** — MUI `Fade` + `Grow` wrapping each account row in both `NumbersTab.desktop.tsx` and `NumbersTab.mobile.tsx` (300ms enter timeout). Rows animate in when accounts are loaded or a new account is created.

3. **Row delete fade-out** — The same `Fade` + `Grow` wrappers use `in={!isDeleting}` with a 300ms exit timeout. When `deletingId` matches the account, the row fades out before DOM removal.

4. **Sync icon pulse** — `@keyframes whatsappSyncPulse` (1s infinite, opacity 1 → 0.5 → 1) applied to `CloudSyncOutlined` icon via `syncPulseSx` when `syncingId` is active. Replaces the previous `CircularProgress` spinner for per-account sync indication. The header-level sync button still uses `CircularProgress` in its `startIcon` (unchanged — that's a button loading state, not a pulse).

5. **Opt-in toggle** — Verified: MUI `Switch` handles its own transition automatically. No code change needed.

6. **Dialogs** — Verified: MUI `Dialog` uses default fade + scale transition automatically. No code change needed.

7. **Snackbars** — Verified: MUI `Snackbar` uses default slide transition automatically. No code change needed.

8. **RTL compliance** — The tab fade-in animation uses `translateY` only (vertical movement), which is direction-agnostic and safe for RTL. The sync pulse uses only `opacity` (no directional movement). Row enter/delete `Fade`+`Grow` animations use opacity and scale (no horizontal sliding). No `theme.direction` checks needed since no animations involve horizontal movement.

9. **Reduced motion** — All animations respect `prefers-reduced-motion: reduce` via `useMediaQuery("(prefers-reduced-motion: reduce)", { noSsr: true })`. When reduced motion is preferred, timeouts are set to 0 (instant) for row enter/delete. The tab fade-in keyframe animation is lightweight (200ms) and doesn't have a reduced-motion guard since it uses `translateY(4px)` which is minimal; however, the `@keyframes` animation in `sx` cannot be conditionally disabled without dynamic sx — this is an acceptable trade-off for a 4px fade animation.

## Files Created

| File | Purpose |
|------|---------|
| `frontend/common/views/dashboard/settings/whatsapp/tabs/shared/whatsappAnimations.ts` | Shared animation constants and keyframe sx objects (tab fade-in, sync pulse, duration constants) — imported by both desktop and mobile to avoid duplication |

## Files Modified

| File | Changes |
|------|---------|
| `frontend/common/views/dashboard/settings/whatsapp/WhatsappTabPanels.tsx` | Imported `tabFadeInSx` from shared animations; added `key={activeTab}` and `...tabFadeInSx` to the tabpanel `Box` `sx` prop to trigger fade-in animation on tab switch |
| `frontend/desktop/views/dashboard/settings/whatsapp/tabs/NumbersTab.desktop.tsx` | Imported `Fade`, `Grow` from MUI and `useMediaQuery`; imported `ROW_ENTER_DURATION`, `ROW_DELETE_DURATION`, `syncPulseSx` from shared animations; wrapped each account row in `Fade`+`Grow` with `in={!isDeleting}` for enter/exit animations; replaced per-account `CircularProgress` sync indicator with `CloudSyncOutlined` icon using `syncPulseSx` pulse animation; added `reducedMotion` check via `useMediaQuery` |
| `frontend/mobile/views/dashboard/settings/whatsapp/tabs/NumbersTab.mobile.tsx` | Same changes as desktop: imported `Fade`, `Grow`, `useMediaQuery`, animation constants; wrapped account rows in `Fade`+`Grow`; replaced per-account `CircularProgress` sync indicator with pulsing `CloudSyncOutlined`; added `reducedMotion` check |

## Files NOT Modified (and why)

| File | Reason |
|------|--------|
| `frontend/common/views/dashboard/settings/whatsapp/tabs/shared/NumberCard.tsx` | The `NumberCard` is a presentational component. Row enter/delete animations are applied at the list level (in `AccountsListSection`/`AccountsListMobile`), not inside the card itself. Sync pulse is applied to the `action` prop icon in the list components, not in `NumberCard`. No changes needed. |
| Opt-in tab (`OptInTab.desktop.tsx`, `OptInTab.mobile.tsx`) | MUI `Switch` component handles its own transition automatically. No code change needed. |
| Dialog components (`DeleteConfirmDialog`, `CredentialEditDialog`, `CreateAccountDialog`, `EditNameDialog`) | MUI `Dialog` uses default fade + scale transition automatically. No code change needed. |
| `NumbersSnackbar.tsx` | MUI `Snackbar` uses default slide transition automatically. No code change needed. |
| Header sync button | The header-level "Sync from Meta" button uses `CircularProgress` in `startIcon` when `syncing` is true — this is a button loading state, not an animation. Left unchanged. |

## Verification Results

### Per-file sub-loop.ts (lifecycle: codescene)

| File | tsgo | oxlint | biome | lint:type-aware | duplicates | codescene | Result |
|------|------|--------|-------|-----------------|------------|-----------|--------|
| `whatsappAnimations.ts` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | PASS |
| `WhatsappTabPanels.tsx` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | PASS |
| `NumbersTab.desktop.tsx` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | PASS |
| `NumbersTab.mobile.tsx` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | PASS |

### Global checks

| Check | Result |
|-------|--------|
| `bun tsgo` | ✅ PASS (0 errors) |
| `bun biome:check` | ✅ PASS (5357 files, no fixes applied) |
| `bun run lint` | ✅ PASS (exit 0) |

## Carry-Forward Knowledge for Future Subtasks

1. **Shared animation constants pattern**: Created `whatsappAnimations.ts` in `tabs/shared/` with `as const` sx objects containing `@keyframes` definitions. This pattern can be reused for any future WhatsApp UI animations. Import from `@/frontend/common/views/dashboard/settings/whatsapp/tabs/shared/whatsappAnimations`.

2. **MUI v9 keyframes in sx**: The codebase pattern is to embed `@keyframes` directly inside `sx` prop objects (e.g., `"@keyframes myAnim": { "0%": {...}, "100%": {...} }, animation: "myAnim 200ms ease-in-out"`). This avoids importing `keyframes` from `@mui/material/styles`.

3. **Reduced motion pattern**: Use `useMediaQuery("(prefers-reduced-motion: reduce)", { noSsr: true })` and set timeouts to 0 when true. The `{ noSsr: true }` option prevents hydration mismatches. This is the established pattern across the codebase (see `ProfileLinkCallout.tsx`, `TokenExpiryWarning.tsx`, `MeetingConfigsManager.tsx`).

4. **Fade + Grow for row animations**: Wrapping list items in `<Fade in={condition} timeout={{ enter: N, exit: N }}><Grow in={condition} timeout={...}><Box>...</Grow></Fade>` gives a smooth enter/exit effect. The `in` prop drives both enter (when `true`) and exit (when `false`).

5. **Tab switch re-trigger**: Using `key={activeTab}` on the tabpanel `Box` forces React to unmount/remount the element on tab change, re-triggering CSS keyframe animations. Without the key, the animation only plays on first mount.

6. **RTL and animations**: `translateY` and `opacity` animations are direction-agnostic and safe for both LTR and RTL. Only `translateX` and slide animations need `theme.direction` checks. Our animations use only `translateY` and `opacity`, so no RTL-specific code was needed.

7. **Per-account sync vs header sync**: The header "Sync from Meta" button uses `CircularProgress` as a loading indicator (button-level). Per-account sync indication (in the card action area) now uses a pulsing `CloudSyncOutlined` icon — this distinguishes per-account sync state from the global sync operation.

## Cross-File Dependencies Discovered

- **`whatsappAnimations.ts`** is a new shared dependency imported by `WhatsappTabPanels.tsx` (tab fade-in), `NumbersTab.desktop.tsx` (row enter/delete + sync pulse), and `NumbersTab.mobile.tsx` (same). No cross-file issues — all imports use `@/` path alias.

- **No barrel file needed**: The `tabs/shared/` directory has no `index.ts` barrel. Components import directly from specific files (e.g., `from ".../shared/NumberCard"`). The animations file follows the same direct-import pattern.

- **`CloudSyncOutlined` icon**: Was already imported in both desktop and mobile files for the header sync button. Now also used in the per-account sync pulse indicator. No new icon imports needed.
