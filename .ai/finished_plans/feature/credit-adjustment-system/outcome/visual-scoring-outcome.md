# Visual 10/10 Score Loop — Final Verdicts

- **Method**: agent-browser captures on the live dev server (port 3000, super-admin via `browser-login.ts`), 3 viewports (1440×900 / 834×1112 / 390×844), single-image inspector subagents per screenshot (strict one-image-per-subagent isolation).
- **Screens**: `/accounting/credits` (list), `/accounting/credits/adjust?studentId=…` (form), form with carryover expanded.

## Pass history

| Screen | P1 | P2 | P3 | P4/final |
|---|---|---|---|---|
| list-desktop | 8.6 | 8.8 | 9.75 | **10.0 READY** |
| list-tablet | 8.5 | 8.8 | 9.5 | **9.5 READY** |
| list-mobile | 7.2 | 8.8 | 8.75 | **9.5 READY** |
| form-desktop | 8.0 | 9.2 | — | **10.0 READY** |
| form-tablet | 7.8 | 8.8 | 8.9 | **9.8 READY** |
| form-mobile | 7.3 | 8.3 | 9.3→fix | **9.4 READY** |
| carryover-desktop | invalid | 7.5→invalid | invalid capture | **9.6 READY** |
| carryover-tablet | 6.8 | 8.7 | 9.1 | **9.8 READY** |
| carryover-mobile | 8.5 | 8.7 | 9.1 | **10.0 READY** |

## Fix waves (all verified via sub-loop + component tests + live DOM checks)

- **Wave 1**: list autoHeight/no-clipping, mobile column priority + chevron affordance, outlined row actions, header ticks suppressed, em-dash styling; radio cards uniform selection (alpha tint + family border + equal circular icon badges), neutral section label, Hours compact width, Cancel neutral, banner 2-col tablet + successContainer tone, selected-student card; RichTextEditor single bordered box with notched label, clipped toolbar band.
- **Wave 2**: alpha-tint selection (saturated successContainer fill removed), divider-strength unselected borders, mobile compact radio rows, form bottom-nav clearance, TRUE neutral section label (grey ramp — onSurfaceVariant is cyan in the `ocean` preset), BALANCE caption (`form.balance` i18n leaf), banner field outline contrast, editor 8px radius root fix (numeric `borderRadius` is multiplied by `theme.shape.borderRadius` in MUI v9!).
- **Wave 3+**: mobile avatars hidden below md (name budget), student-card name ellipsis/gap, banner 3-col at lg (was xl → 1440px desktops never hit it), notch label banner-toned background.

## Capture lessons learned (for the skill)

1. **`agent-browser screenshot --full` can destabilize client state** on authenticated SPA pages with scroll containers (zustand store reset observed: banner present in DOM pre-shot, gone post-shot). Fix: verify DOM state before AND after the shot; prefer plain viewport screenshot + `scrollIntoView` for state-dependent sections.
2. **Always verify `document.title` / auth state before accepting a screenshot** — session expiry silently redirects to the login page, and all captures after it are invalid.
3. One inspector subagent per image (never batched) — multi-image payloads kill the stream.
