# Task 19: `MeetingUrlStatusBadge` Component — Outcome

**Status**: ✅ Complete
**Date**: 2026-08-15
**Requirements**: AC-3.1, AC-3.5, AC-3.6 (URL status badges)

## Files Created/Modified

| File | Action |
|------|--------|
| `frontend/common/components/ui/display/meetingConfig/MeetingUrlStatusBadge.tsx` | Created |
| `frontend/common/components/ui/display/meetingConfig/index.ts` | Modified (added `export * from "./MeetingUrlStatusBadge"`) |

## Component API

```typescript
export type MeetingUrlStatus = "pending" | "generated" | "failed" | "expired";
export type MeetingUrlStatusBadgeSize = "small" | "medium";

export interface MeetingUrlStatusBadgeProps {
  readonly status: MeetingUrlStatus;
  readonly size?: MeetingUrlStatusBadgeSize;        // default "medium"
  readonly tooltip?: string | null;                  // optional tooltip with details
  readonly sx?: SxProps<Theme>;
}
```

## States

| Status | Icon | Label key | Color |
|--------|------|-----------|-------|
| pending | `CircularProgress` | `urlPending` | `theme.palette.info.main` |
| generated | `CheckCircleOutlined` | `urlReady` | `theme.palette.success.main` |
| failed | `ErrorOutlined` | `urlFailed` | `theme.palette.error.main` |
| expired | `ScheduleOutlined` | `urlExpired` | `theme.palette.warning.main` |

## Size variants

- `small`: 16px icon (`fontSize: 16` for MUI icons, `size={16}` for CircularProgress)
- `medium`: 24px icon (default)

## Accessibility

- Uses semantic `<output>` element (`Box component="output"`) — satisfies `jsx-a11y/prefer-tag-over-role` (the semantic equivalent of `role="status"`)
- `aria-label` with full status text (e.g. "URL ready")
- `title` attribute set when `tooltip` prop is provided
- Wraps in MUI `<Tooltip>` when `tooltip` is truthy

## i18n

- All strings via `useAppTranslation(Translation.Dashboard.MeetingUrlStatus)` namespace
- Labels: `urlPending`, `urlReady`, `urlFailed`, `urlExpired` (existing keys from `MeetingUrlStatusLabels`)
- No new i18n keys needed — reuses existing namespace (task 1 outcome)

## Design Decisions

1. **`component="output"` instead of `role="status"`**: The oxlint `jsx-a11y/prefer-tag-over-role` rule requires the semantic HTML `<output>` element rather than `role="status"` on a span. `Box component="output"` provides the same semantic meaning while satisfying the linter.
2. **Icon factory pattern**: `STATUS_CONFIGS` maps each status to an icon factory function `(iconSize: number) => ReactNode`, allowing size variants without scale transforms (CircularProgress uses `size` prop, MUI icons use `fontSize` sx).
3. **Theme callback**: All palette colors accessed via `sx={(theme) => ({ color: theme.palette.success.main })}` per MUI v9 rules — no string-based palette access.
4. **No new AGENTS.md needed**: The directory already has `frontend/common/components/ui/AGENTS.md` which covers this component.

## Quality Verification

| Check | Result |
|-------|--------|
| `tsgo` | ✅ passed |
| `oxlint` | ✅ passed |
| `biome:check` | ✅ passed |
| `lint:type-aware` | ✅ passed |
| `check:duplicates` (jscpd) | ✅ passed |
| `codescene --file` | ✅ passed |
