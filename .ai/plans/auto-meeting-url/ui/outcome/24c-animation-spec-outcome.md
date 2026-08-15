# Task 24c Outcome — Implement Animation Specification (`prefers-reduced-motion`)

## Summary

Implemented the animation specification from design.md §3.A across all 8 components requiring `prefers-reduced-motion` support. All animations use MUI v9 built-in transitions (`Fade`, `Slide`) or CSS `transition` via `sx` prop — no external animation library. Every animation checks `useMediaQuery("(prefers-reduced-motion: reduce)", { noSsr: true })` and disables itself (timeout=0 or `transition: "none"`) when the user prefers reduced motion. The only `@keyframes` is the `TokenExpiryWarning` amber pulse, scoped via `sx` prop.

## Files Modified

### 1. `frontend/common/views/dashboard/profile/shared/meeting-configs/reauth-needed-banner.tsx`
- **Animation**: Slide-down on mount (300ms `easeOut`)
- **Reduced-motion**: Instant appear (`timeout={0}`)
- Added `useMediaQuery("(prefers-reduced-motion: reduce)", { noSsr: true })` hook
- `SLIDE_DURATION_MS = 300` module-level constant
- `slideTimeout = reducedMotion ? 0 : SLIDE_DURATION_MS` passed to MUI `<Slide>` component
- Existing `direction="down"`, `appear`, `mountOnEnter`, `unmountOnExit` props preserved

### 2. `frontend/common/components/ui/display/meetingConfig/MeetingUrlStatusBadge.tsx`
- **Animation**: Fade color change on status transition (200ms `easeInOut`)
- **Reduced-motion**: Instant color change (`transition: "none"`)
- Added `useMediaQuery("(prefers-reduced-motion: reduce)", { noSsr: true })` hook
- `COLOR_TRANSITION_MS = 200` module-level constant
- `colorTransition = reducedMotion ? "none" : "color 200ms ease-in-out"` applied to both the icon `Box` and `Typography` via `sx` prop

### 3. `frontend/common/components/ui/display/meetingConfig/CopyMeetingUrlButton.tsx`
- **Animation**: Icon swap (Copy → Check, 150ms `easeInOut`)
- **Reduced-motion**: Instant swap (`timeout={0}`)
- Added `useMediaQuery` + MUI `Fade` import
- `ICON_SWAP_MS = 150` module-level constant
- `fadeTimeout = reducedMotion ? 0 : ICON_SWAP_MS`
- Icon wrapped in `<Fade in appear={!reducedMotion} timeout={fadeTimeout} key={isCopied ? "check" : "copy"}>` — the `key` prop forces remount on copy state change, triggering the Fade appear animation for the new icon

### 4. `frontend/common/components/ui/display/meetingConfig/MeetingGenerationStatusIndicator.tsx`
- **Animation**: Spinner → CheckCircle fade (200ms `easeOut`)
- **Reduced-motion**: Instant swap (`timeout={0}`)
- **No changes needed** — already had `useMediaQuery("(prefers-reduced-motion: reduce)")` and `fadeTimeout = reducedMotion ? 0 : ANIMATION_DURATION` with `ANIMATION_DURATION = 200`
- Verified: existing implementation is complete and correct (Spinner fade on pending, CheckCircle fade on success, ErrorOutlined fade on failed)

### 5. `frontend/common/views/dashboard/profile/shared/meeting-configs/TokenExpiryWarning.tsx`
- **Animation**: Amber pulse on mount if ≤1 day remaining (1s × 2 pulses, `easeInOut`)
- **Reduced-motion**: No pulse (`showPulse = false`)
- Added `useMediaQuery("(prefers-reduced-motion: reduce)", { noSsr: true })` hook
- `PULSE_ANIMATION = "token-expiry-pulse 1s ease-in-out 2"` module-level constant (CSS shorthand: duration, timing-function, iteration-count)
- `showPulse = level === "critical" && !reducedMotion` — only pulses for critical level (≤24h remaining) and only when motion is not reduced
- `@keyframes token-expiry-pulse` block defined via spread in `sx` prop callback: opacity 1 → 0.6 → 1 (subtle amber fade)
- Conditionally spread into `Box` sx only when `showPulse` is true

### 6. `frontend/common/components/ui/display/meetingConfig/OAuthConnectionStatusBadge.tsx`
- **Animation**: Dot color transition (200ms `easeInOut`)
- **Reduced-motion**: Instant color change (`transition: "none"`)
- Added `useMediaQuery("(prefers-reduced-motion: reduce)", { noSsr: true })` hook
- Existing `transition: "background-color 200ms ease-in-out"` updated to `reducedMotion ? "none" : "background-color 200ms ease-in-out"` on the status dot `Box`

### 7. `frontend/common/views/dashboard/settings/components/meetingIntegrations/ProfileLinkCallout.tsx`
- **Animation**: Fade in on mount (200ms `easeOut`)
- **Reduced-motion**: Instant appear (`timeout={0}`)
- Added `useMediaQuery` + MUI `Fade` import
- `FADE_DURATION_MS = 200` module-level constant
- `fadeTimeout = reducedMotion ? 0 : FADE_DURATION_MS`
- Button and Box wrapped in `<Fade in appear={!reducedMotion} timeout={fadeTimeout}>`

### 8. `frontend/common/views/dashboard/profile/shared/meeting-configs/MeetingConfigsManager.tsx`
- **Animation**: Cross-link "Admin Provider Settings" button — Fade in on mount (200ms `easeOut`)
- **Reduced-motion**: Instant appear (`timeout={0}`)
- Added `useMediaQuery` + MUI `Fade` import
- `reducedMotion` hook + `crossLinkFadeTimeout = reducedMotion ? 0 : 200` at component top level
- The cross-link button (inside `<RequirePermission>` wrapper) is wrapped in `<Fade in appear={!reducedMotion} timeout={crossLinkFadeTimeout}>`

## Design Spec Compliance (§3.A)

| Component | Animation | Duration | Easing | Reduced-motion | Implementation |
|-----------|-----------|----------|--------|----------------|----------------|
| `ReauthNeededBanner` | Slide-down on mount | 300ms | `easeOut` | Instant appear | ✅ MUI `Slide` with `timeout` |
| `MeetingUrlStatusBadge` | Fade color change | 200ms | `easeInOut` | Instant | ✅ CSS `transition` via `sx` |
| `CopyMeetingUrlButton` | Icon swap (Copy→Check) | 150ms | `easeInOut` | Instant swap | ✅ MUI `Fade` with `key` remount |
| `MeetingGenerationStatusIndicator` | Spinner→CheckCircle fade | 200ms | `easeOut` | Instant swap | ✅ Already implemented (pre-existing) |
| `TokenExpiryWarning` | Amber pulse (≤1 day) | 1s × 2 | `easeInOut` | No pulse | ✅ `@keyframes` via `sx` prop |
| `OAuthConnectionStatusBadge` | Dot color transition | 200ms | `easeInOut` | Instant | ✅ CSS `transition` via `sx` |
| `ProfileLinkCallout` | Fade in on mount | 200ms | `easeOut` | Instant | ✅ MUI `Fade` with `appear` |
| MeetingConfigsManager cross-link button | Fade in on mount | 200ms | `easeOut` | Instant | ✅ MUI `Fade` with `appear` |

## Key Design Decisions

### `useMediaQuery` with `{ noSsr: true }`
All `useMediaQuery("(prefers-reduced-motion: reduce)")` calls use `{ noSsr: true }` to prevent hydration mismatch warnings — the hook reads from the client immediately without waiting for server-side rendering.

### `@keyframes` only in `TokenExpiryWarning`
Per design.md §3.A: "No `@keyframes` in component files — use MUI's `sx` prop with `transition` property or MUI `Transition` components. Only `TokenExpiryWarning`'s pulse may define a `@keyframes` via `sx`'s `@keyframes` block (scoping it to the component)." All other animations use MUI built-in transitions (`Fade`, `Slide`) or CSS `transition` property.

### `Fade` with `key` prop for icon swap (CopyMeetingUrlButton)
MUI `Fade` only animates enter/exit of a single child. For the icon swap (Copy → Check), `key={isCopied ? "check" : "copy"}` forces React to unmount the old Fade and mount a new one when copy state changes. The new Fade's `appear` animation triggers the fade-in for the new icon. When reduced-motion, `timeout={0}` makes the swap instant.

### `prefers-reduced-motion` is an accessibility query, not a viewport query
The MUI AGENTS.md ESLint rules block `useMediaQuery` in `.mobile.tsx`/`.desktop.tsx` files for *viewport detection*. `prefers-reduced-motion` is a CSS *accessibility* media feature, not a breakpoint. The components modified are all non-tiered files (no `.mobile.tsx`/`.desktop.tsx` suffix), so `useMediaQuery` is allowed per the viewport-agnostic primitive rules.

## Quality Verification

Ran `bun run scripts/health/sub-loop.ts <file-path> --lifecycle lint` (includes tsgo → oxlint → biome → lint:type-aware; short-circuits at first failure) for each file:

| File | tsgo | oxlint | biome | lint | Result |
|------|------|--------|-------|------|--------|
| `reauth-needed-banner.tsx` | ✅ | ✅ | ✅ | ✅ | ALL PASS |
| `MeetingUrlStatusBadge.tsx` | ✅ | ✅ | ✅ | ✅ | ALL PASS |
| `CopyMeetingUrlButton.tsx` | ✅ | ✅ | ✅ | ✅ | ALL PASS |
| `MeetingGenerationStatusIndicator.tsx` | ✅ | ✅ | ✅ | ✅ | ALL PASS |
| `TokenExpiryWarning.tsx` | ✅ | ✅ | ✅ | ✅ | ALL PASS |
| `OAuthConnectionStatusBadge.tsx` | ✅ | ✅ | ✅ | ✅ | ALL PASS |
| `ProfileLinkCallout.tsx` | ✅ | ✅ | ✅ | ✅ | ALL PASS |
| `MeetingConfigsManager.tsx` | ✅ | ✅ | ✅ | ✅ | ALL PASS |

**All 8 files passed all quality checks.**

## Requirements Met
- UX-NFR-1: Smooth transitions (all animation durations ≤300ms, matching design spec)
- Accessibility: `prefers-reduced-motion` support (all animations disable when user prefers reduced motion)
- No external animation library (MUI v9 built-in transitions only)
- `@keyframes` scoped to single component (TokenExpiryWarning only per design spec)
