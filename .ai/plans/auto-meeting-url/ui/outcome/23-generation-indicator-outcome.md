# Task 23 Outcome — MeetingGenerationStatusIndicator Component

## Summary

Created `MeetingGenerationStatusIndicator.tsx` — a self-contained UI primitive that renders three states for meeting URL generation status: **pending** (CircularProgress with pulse animation), **success** (green check + URL display + copy/open links + expiresAt), and **failed** (red error icon + expandable error details + retry button). The component owns its translations via `useAppTranslation(Translation.Dashboard.MeetingGeneration)` (allowed for self-contained UI primitives). All animations use MUI transitions (Fade, Collapse) with `useMediaQuery('(prefers-reduced-motion: reduce)')` to skip animations when the user prefers reduced motion. `aria-live="polite"` on `component="output"` announces status changes to assistive technology.

## Files Created

- `frontend/common/components/ui/display/meetingConfig/MeetingGenerationStatusIndicator.tsx` — new component with `MeetingGenerationStatusIndicatorProps` interface and `GenerationIndicatorStatus` type

## Files Modified

- `frontend/common/components/ui/display/meetingConfig/index.ts` — added `export * from "./MeetingGenerationStatusIndicator"` to barrel
- `.ai/plans/auto-meeting-url/ui/tasks.md` — updated task 23 checkbox from `[ ]` to `[x]`

## Component Design

### Props Interface

```typescript
export type GenerationIndicatorStatus = "pending" | "success" | "failed";

export interface MeetingGenerationStatusIndicatorProps {
  readonly status: GenerationIndicatorStatus;
  readonly url?: string | null;
  readonly error?: string | null;
  readonly expiresAt?: string | null;
  readonly onRetry?: () => void;
  readonly onCopyUrl?: (url: string) => void;
}
```

### Layout Structure

```
<Stack component="output" aria-live="polite">
  // Status-specific render:

  // ── Pending ──
  <Fade in appear={!reducedMotion} timeout={fadeTimeout}>
    <Stack component="output">
      <Box sx={{ "@keyframes mg-pulse": ... }}>  // Pulsing CircularProgress
        <CircularProgress size={20} />
      </Box>
      <Typography>{pendingLabel}</Typography>
    </Stack>
  </Fade>

  // ── Success ──
  <Fade in appear={!reducedMotion} timeout={fadeTimeout}>
    <Stack component="output">
      <Stack>  // Green check + label
        <CheckCircleOutlinedIcon />
        <Typography>{successLabel}</Typography>
      </Stack>
      <Stack>  // URL + copy + open (if url)
        <LinkOutlinedIcon />
        <Typography component="span">{url}</Typography>
        <IconButton onClick={onCopyUrl}>  // Copy (if onCopyUrl)
          <ContentCopyOutlinedIcon />
        </IconButton>
        <IconButton component={Link} href={url}>  // Open in new tab
          <OpenInNewOutlinedIcon />
        </IconButton>
      </Stack>
      <Stack>  // Expiry (if expiresAt)
        <ScheduleOutlinedIcon />
        <Typography>{formatExpiresAt(expiresAt)}</Typography>
      </Stack>
    </Stack>
  </Fade>

  // ── Failed ──
  <Fade in appear={!reducedMotion} timeout={fadeTimeout}>
    <Stack component="output">
      <Stack>  // Red error + label
        <ErrorOutlinedIcon />
        <Typography>{failedLabel}</Typography>
      </Stack>
      <Button>  // Expand error details (if error)
        aria-expanded={expanded}
        aria-controls={detailsId}
        endIcon={<ExpandMoreOutlinedIcon />}
      </Button>
      <Collapse in={expanded}>  // Error details
        <Alert severity="error" variant="outlined">
          <Typography>{error}</Typography>
        </Alert>
      </Collapse>
      <Button>  // Retry (if onRetry)
        color="error" startIcon={<RefreshOutlinedIcon />}
      </Button>
    </Stack>
  </Fade>
</Stack>
```

### States

| State | Condition | Required Props | Render |
|-------|-----------|----------------|--------|
| Pending | `status === "pending"` | `status` | Pulsing CircularProgress + pending label |
| Success | `status === "success"` | `status` (+ optional `url`, `expiresAt`, `onCopyUrl`) | Green check + success label + optional URL with copy/open + optional expiry line |
| Failed | `status === "failed"` | `status` (+ optional `error`, `onRetry`) | Red error icon + failed label + optional expandable error details + optional retry button |

### Accessibility

- `component="output"` with `aria-live="polite"` on the root Stack — announces status changes to screen readers
- `aria-expanded` / `aria-controls` on the "Show details" toggle button links to the `Collapse` content (ID from `useId()`, sanitized to remove colons)
- IconButton `aria-label` attributes use i18n strings (no hardcoded English)
- Tooltip on copy and open-in-new-tab buttons for sighted users

### Translations Used

| Key | Type | Purpose |
|-----|------|---------|
| `generationStatusPending` | `string` | Pending state label |
| `generationStatusSuccess` | `string` | Success state label (+ tooltip/aria-label for URL actions) |
| `generationStatusFailed` | `string` | Failed state label (+ expandable details button label) |
| `generationRetry` | `string` | Retry button label |

All strings via `useAppTranslation(Translation.Dashboard.MeetingGeneration)` — self-contained UI primitive may own its translations (exception noted in Task 18 outcome).

### Animation

- **Fade**: Wraps each state render with `appear={!reducedMotion}` for entry transition. Timeout is `200ms` (easeOut) per design.md §3.25, or `0` when reduced motion is preferred.
- **Collapse**: Error details `Collapse` uses the same `fadeTimeout` for expansion animation.
- **Pulse**: `@keyframes mg-pulse` defined inline in `sx` — alternates opacity 1↔0.5 at 1.5s intervals. Disabled (`animation: "none"`) when reduced motion is preferred.
- **Expand icon rotation**: `transform: rotate(180deg)` when expanded with `transition: transform 200ms ease`. Transition disabled when reduced motion is preferred.
- No external animation libraries — only MUI transitions and CSS keyframes.

### Key Design Decisions

1. **Module-level render functions** — `renderPending`, `renderSuccess`, `renderFailed` are extracted as module-level functions to keep the main component's cognitive complexity under 15 (sonarjs limit). Each accepts a plain props object; no hooks are called inside them.

2. **`component="output"` instead of `role="status"`** — oxlint `jsx-a11y(prefer-tag-over-role)` requires HTML semantic elements over ARIA roles. Using `component="output"` on MUI `Stack` achieves the same semantic for `aria-live="polite"`.

3. **Theme palette only** — All colors via `theme.palette.success.main`, `theme.palette.error.main`, `theme.palette.info.main`, `theme.palette.onSurfaceVariant`. No hardcoded colors.

4. **MUI v9 `sx` prop** — All style props (`flexDirection`, `alignItems`, `gap`, `overflow`, `textOverflow`, `whiteSpace`, `maxWidth`) are in `sx`, not as direct props on Typography/Stack/Box.

5. **`*Outlined` icon suffix** — All icons use the MUI v9 naming convention (`CheckCircleOutlinedIcon`, `ErrorOutlinedIcon`, `ExpandMoreOutlinedIcon`, etc.).

6. **Self-owned translations** — Unlike `frontend/common/views/` Rule 7 (labels via props), this self-contained UI primitive in `frontend/common/components/ui/` may own its translations. The i18n namespace `Translation.Dashboard.MeetingGeneration` was already created in Task 1.

## Verification Results

### Component (lint lifecycle)
```
bun run scripts/health/sub-loop.ts frontend/common/components/ui/display/meetingConfig/MeetingGenerationStatusIndicator.tsx --lifecycle lint
✅ tsgo passed
✅ oxlint passed
✅ biome:check passed
✅ lint:type-aware passed
✅ All checks for lifecycle "lint" passed. (exit code 0)
```

### Barrel file (lint lifecycle)
```
bun run scripts/health/sub-loop.ts frontend/common/components/ui/display/meetingConfig/index.ts --lifecycle lint
✅ tsgo passed
✅ oxlint passed
✅ biome:check passed
✅ lint:type-aware passed
✅ All checks for lifecycle "lint" passed. (exit code 0)
```

## Cross-File Dependencies

- **Task 1 (i18n foundation)**: `Translation.Dashboard.MeetingGeneration` namespace and `MeetingGenerationLabels` type — created in Task 1, consumed here.
- **Task 22 (MeetingUrlCell)**: `MeetingUrlCell` may compose this component for in-cell status display (follow-up).
- **Task 24+ (integration)**: Integrating consumers (e.g., `MeetingUrlStatusBadge` or `MeetingConfigDisplayShared`) will pass `status`, `url`, `error`, `expiresAt`, `onRetry`, `onCopyUrl` props.

## Deferred Items

- Storybook stories for all three states (task 35b)
- Component tests for pending/success/failed states + reduced motion behavior (task 35)
- Integration into consumer components (tasks 24+)
