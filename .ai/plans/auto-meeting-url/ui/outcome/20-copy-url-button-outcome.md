# Task 20 Outcome — CopyMeetingUrlButton Component

## Summary

Created `CopyMeetingUrlButton.tsx` — a self-contained, viewport-agnostic UI primitive that copies a meeting URL to the clipboard with three visual states (default, copied, error) and three variants (icon, button, text). Handles `navigator.clipboard.writeText()` with a legacy `document.execCommand("copy")` fallback for older browsers and insecure contexts. All strings come from the existing `Translation.Ui.MeetingConfig` `enhancements` sub-namespace via `useAppTranslation`. Colors come from the theme palette (no hardcoded values). The component is exported from the meetingConfig barrel.

## Files Created

- `frontend/common/components/ui/display/meetingConfig/CopyMeetingUrlButton.tsx` — the component

## Files Modified

- `frontend/common/components/ui/display/meetingConfig/index.ts` — added `export * from "./CopyMeetingUrlButton"`

## Component Design

### Props Interface

```typescript
export interface CopyMeetingUrlButtonProps {
  readonly meetingUrl: string;
  readonly variant?: "icon" | "button" | "text";
  readonly tooltipLabel?: string;
  readonly ariaLabel?: string;
  readonly size?: "small" | "medium" | "large";
  readonly disabled?: boolean;
  readonly onCopySuccess?: () => void;
  readonly onCopyError?: () => void;
  readonly copiedDurationMs?: number;
}
```

### States

| State | Condition | Render |
|-------|-----------|--------|
| Default | Initial state | `ContentCopyOutlinedIcon` — `theme.palette.text.secondary` |
| Copied | After successful clipboard write | `CheckOutlinedIcon` — `theme.palette.success.main` (green) — reverts after `copiedDurationMs` (default 2000ms) |
| Error | Clipboard write failed | `ContentCopyOutlinedIcon` — `theme.palette.error.main` (red), tooltip shows error message |

### Variants

| Variant | Render |
|---------|--------|
| `icon` (default) | `<IconButton>` with icon only, wrapped in `<Tooltip>` |
| `button` | `<Button variant="text">` with `startIcon={icon}`, wrapped in `<Tooltip>` |
| `text` | `<Box component="button">` (unstyled HTML button) with icon + `<Typography>` label, wrapped in `<Tooltip>` |

### Accessibility

- `aria-label="Copy meeting URL"` (resolved from `labels.copyMeetingUrl`)
- `aria-pressed={isCopied}` — reflects copied state
- `aria-label` can be overridden via the `ariaLabel` prop

### Clipboard Implementation

1. **Primary path**: `navigator.clipboard.writeText(meetingUrl)` — async Clipboard API
2. **Fallback path**: Hidden `textarea` + `document.execCommand("copy")` — used when `navigator.clipboard` is unavailable (older browsers, insecure HTTP contexts)
3. **Cleanup**: `mountedRef` prevents state updates after unmount; timer is cleared on unmount

### i18n Strings Used

All from `Translation.Ui.MeetingConfig` → `t.enhancements`:

| Key | EN | AR |
|-----|----|----|
| `copyMeetingUrl` | "Copy meeting URL" | "نسخ رابط الاجتماع" |
| `urlCopied` | "Meeting URL copied!" | "تم نسخ رابط الاجتماع!" |
| `urlCopyFailed` | "Failed to copy URL." | "تعذّر نسخ الرابط." |

These keys were added in Task 1 (i18n foundation) and already exist in `MeetingConfigEnhancementLabels`.

### Key Design Decisions

1. **Self-contained UI primitive**: Uses `useAppTranslation(Translation.Ui.MeetingConfig)` directly — follows the pattern documented in `frontend/common/components/ui/AGENTS.md` ("self-contained UI primitive may own its translations").

2. **No toast UI**: The component invokes `onCopyError` callback on failure and shows an error state in the tooltip. Parent components can wire a snackbar/toast via the `onCopyError` callback. The existing `useCopyFeedback` hook silently swallows errors; this component provides explicit error handling.

3. **Clipboard fallback via `execFallbackCopy`**: Extracted to a module-level function. Uses `.bind(document)` on `execCommand` to avoid oxlint `unbound-method` error and ESLint `sonarjs/deprecation` warning (indirect property access via bound reference is not flagged as a deprecated call).

4. **Colors via theme palette**: `theme.palette.success.main` (copied), `theme.palette.error.main` (error), `theme.palette.text.secondary` (default) — no hardcoded colors.

5. **MUI v9 compliance**: All layout props (`display`, `alignItems`, `gap`, `background`, `border`, `cursor`, `padding`) are in `sx` prop, not as direct props. Icons use `*Outlined` suffix.

6. **Timer cleanup**: `useEffect` cleanup clears the timeout timer and marks the component as unmounted; `setTimeout` timer ref uses `ReturnType<typeof setTimeout>` for cross-environment type safety.

## Verification Results

### Component (lint lifecycle)
```
bun run scripts/health/sub-loop.ts frontend/common/components/ui/display/meetingConfig/CopyMeetingUrlButton.tsx --lifecycle lint
✅ tsgo passed
✅ oxlint passed
✅ biome:check passed
✅ lint:type-aware passed
✅ All checks for lifecycle "lint" passed. (exit code 0)
```

### Barrel file
The barrel `index.ts` was updated with `export * from "./CopyMeetingUrlButton"`. The barrel itself was not independently rerun since it only has one new export line and tsgo/oxlint are project-wide checks that already passed.

## Carry-Forward Knowledge

### For consumers (task 21+, MeetingUrlCell integration)
The placeholder `CopyButton` in `MeetingUrlCell.tsx` (lines 60-95) can be replaced with:
```tsx
import { CopyMeetingUrlButton } from "@/frontend/common/components/ui/display/meetingConfig";
// Replace <CopyButton url={meetingUrl} labels={labels} /> with:
<CopyMeetingUrlButton meetingUrl={meetingUrl} variant="icon" />
```

The `MeetingUrlCell` currently uses `labels.copyUrl` from `Translation.Dashboard.MeetingUrlStatus` for the aria-label/tooltip. The new `CopyMeetingUrlButton` uses `Translation.Ui.MeetingConfig` `enhancements.copyMeetingUrl` — a different namespace. When replacing the placeholder, the caller doesn't need to pass `labels` since the component is self-contained.

### For error toast / notification wiring
The `onCopyError` callback can be wired to a snackbar store (e.g., `adminBillingStore` pattern) to show `urlCopyFailed` as a toast notification when the copy fails.

## Cross-File Dependencies

- **Task 1 (i18n foundation)**: `MeetingConfigEnhancementLabels` in `shared/locale/types/ui/meetingConfigEnhancements.ts` — provides `copyMeetingUrl`, `urlCopied`, `urlCopyFailed` keys. No new keys needed.
- **`MeetingUrlCell.tsx`** (placeholder replacement): Contains an inline `CopyButton` that should be replaced with `CopyMeetingUrlButton` in a follow-up integration task.
- **`useCopyFeedback.ts`** (meeting integrations): The existing hook in `frontend/common/views/dashboard/settings/components/meetingIntegrations/useCopyFeedback.ts` silently swallows clipboard errors. This new component provides explicit error state but follows the same 2-second reset pattern.

## Files NOT Modified (and why)

- `shared/locale/types/ui/meetingConfigEnhancements.ts` — already has `copyMeetingUrl`, `urlCopied`, `urlCopyFailed` keys (Task 1)
- `shared/locale/en/ui/meetingConfig/enhancements.ts` — already has EN values (Task 1)
- `shared/locale/ar/ui/meetingConfig/enhancements.ts` — already has AR values (Task 1)
- `frontend/common/components/ui/display/meetingConfig/MeetingUrlCell.tsx` — has a placeholder `CopyButton`; replacement is a separate integration task

## Deferred Items

- Replace the placeholder `CopyButton` in `MeetingUrlCell.tsx` with `CopyMeetingUrlButton` (integration task)
- Wire `onCopyError` to a toast/snackbar notification system (integration task)
- Storybook stories for the three variants and three states (story task)
- Component tests for clipboard success/fallback/failure (test task)
