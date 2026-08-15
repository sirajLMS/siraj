# Task 22 Outcome — MeetingUrlCell for Data Tables

## Summary

Created `MeetingUrlCell.tsx` — a viewport-agnostic UI primitive under `frontend/common/components/ui/display/meetingConfig/` that displays meeting URL status in data table columns. The component combines a `MeetingUrlStatusBadge`, join button, and copy button. It handles null URLs gracefully (showing "Not generated" with a setup link), supports compact (desktop inline `Stack direction="row"`) and full (mobile card) layouts, and provides an `aria-label` describing the full state. All strings are sourced via `useAppTranslation(Translation.Dashboard.MeetingUrlStatus)` — the self-contained UI primitive owns its translations.

## Files Created

- `frontend/common/components/ui/display/meetingConfig/MeetingUrlCell.tsx` — the main component (~290 lines)

## Files Modified

- `frontend/common/components/ui/display/meetingConfig/index.ts` — added `export { MeetingUrlCell } from "./MeetingUrlCell"` and `export type { MeetingUrlCellProps } from "./MeetingUrlCell"` to the barrel
- `.ai/plans/auto-meeting-url/ui/tasks.md` — updated task 22 checkbox from `[ ]` to `[x]`

## Files NOT Modified (and why)

- `frontend/common/components/ui/display/meetingConfig/MeetingUrlStatusBadge.tsx` — task 19 component (already built); consumed directly via import. No changes needed.
- `CopyMeetingUrlButton.tsx` — task 20 component, NOT yet built. An inline `CopyButton` placeholder is used instead with a `// Placeholder:` comment. When task 20 is complete, replace the inline `CopyButton` function with `import { CopyMeetingUrlButton } from "./CopyMeetingUrlButton"` and swap the `<CopyButton>` usage in `renderCompactCell` and `renderFullLayout`.

## Component Design

### Props Interface

```typescript
export interface MeetingUrlCellProps {
  /** The meeting join URL (nullable when not generated). */
  readonly meetingUrl: string | null | undefined;
  /** Meeting URL generation status from the codegen field (nullable until backend populates). */
  readonly meetingUrlStatus?: string | null;
  /** Optional error message from failed generation. */
  readonly meetingUrlError?: string | null;
  /** Label for the "Join" action button. */
  readonly joinLabel?: string;
  /** Href for the "Setup config" link shown when URL is null. */
  readonly setupHref?: string;
  /** Compact layout for inline data-table cells (desktop). */
  readonly compact?: boolean;
  /** Badge size variant (matches MeetingUrlStatusBadge size variant). */
  readonly badgeSize?: "small" | "medium";
  /** Callback when the join button is clicked (defaults to opening URL in new tab). */
  readonly onJoin?: () => void;
  /** Callback when retry generation is clicked for failed URLs. */
  readonly onRetry?: () => void;
}
```

### Layout Structure

```
<output aria-label={ariaLabel}>           // Semantic status landmark
  {hasUrl ? (
    compact ? (
      <Stack direction="row">             // Desktop: inline row
        <MeetingUrlStatusBadge />
        <JoinButton />                   // Shown when status === "generated"
        <CopyButton />                  // Shown when status === "generated"
        <RetryButton />                  // Shown when status === "failed" && onRetry
      </Stack>
    ) : (
      <Stack>                            // Mobile: vertical card section
        <MeetingUrlStatusBadge />        // Badge top
        <Stack direction="row">         // Buttons below
          <JoinButton variant="outlined" />
          <CopyButton />
        </Stack>
        <RetryButton />                  // Shown when status === "failed" && onRetry
      </Stack>
    )
  ) : (
    <Stack>                              // Null state
      <span>Not generated</span>
      <Button component={Link} href={setupHref}>Setup meeting config</Button>
    </Stack>
  )}
</output>
```

### States

| State | Condition | Render |
|-------|-----------|--------|
| Null URL | `!hasUrl` | "Not generated" text + optional "Setup meeting config" link button |
| Pending | `status === "pending"` | Badge only (no join/copy buttons) |
| Generated (compact) | `status === "generated"` && `compact` | Badge + join button + copy button inline |
| Generated (full) | `status === "generated"` && `!compact` | Badge top, join + copy buttons below in a row |
| Failed | `status === "failed"` | Badge + optional retry button (if `onRetry` provided) |
| Expired | `status === "expired"` | Badge only |

### Status Mapping

The `mapStatus()` function maps the codegen string field to the `MeetingUrlStatus` union (`"pending" | "generated" | "failed" | "expired"`):

| Input `meetingUrlStatus` | `hasUrl` | Output `MeetingUrlStatus` |
|--------------------------|----------|--------------------------|
| `"failed"` | any | `"failed"` |
| `"expired"` | any | `"expired"` |
| `"pending"` | any | `"pending"` |
| `"generated"` or null/undefined | true | `"generated"` |
| (any other) | false | `"pending"` |

### Accessibility

- `<output>` element with `aria-label` describes the full state (status + action label or error message)
- `aria-label` is built via an if/else chain (no nested ternaries — SonarJS compliant)
- Join button has `aria-label` with the join label text
- Copy button has `aria-label` with the copy label text and `aria-pressed` reflecting copied state
- Null state setup link uses `Button component={Link} href={setupHref}` for accessible navigation

### Key Design Decisions

1. **Self-contained i18n**: The component uses `useAppTranslation(Translation.Dashboard.MeetingUrlStatus)` directly — appropriate for a UI primitive under `frontend/common/components/ui/` (not a domain view that would pass labels via props).

2. **`MeetingUrlStatusBadge` consumed directly (task 19 done)**: The badge component already exists and handles its own translations internally. `MeetingUrlCell` passes status, size, and tooltip error — no duplicate i18n.

3. **`CopyButton` is an inline placeholder (task 20 not done)**: A module-scope `CopyButton` function provides clipboard copy functionality with a `// Placeholder:` comment. When task 20 creates `CopyMeetingUrlButton`, replace the inline function with the import and swap usage in `renderCompactCell` and `renderFullLayout`.

4. **`<output` instead of `<Box role="status"`>**: Oxlint's `jsx-a11y/prefer-tag-over-role` rule flags `role="status"` — the semantic `<output>` element is the correct HTML5 equivalent.

5. **No unsafe type assertion**: Used `meetingUrl ?? ""` instead of `meetingUrl as string` — the null coalescing avoids the `no-unsafe-type-assertion` oxlint warning while remaining type-safe (the `!hasUrl` guard above ensures the value is truthy before reaching this line).

6. **MUI v9 compliance**: `Stack direction="row"` is a valid direct prop (not a style prop). All style props (`gap`, `alignItems`, `flexWrap`, `color`) go in `sx`. Icons use `*Outlined` suffix.

7. **Module-scope helpers**: `mapStatus()`, `CopyButton`, `JoinButton`, `renderCompactCell`, `renderNullState`, and `renderFullLayout` are all module-scope functions — no closures over component state except where needed (`CopyButton` uses `useState` internally).

## Verification Results

### MeetingUrlCell.tsx (lint lifecycle)
```
bun run scripts/health/sub-loop.ts frontend/common/components/ui/display/meetingConfig/MeetingUrlCell.tsx --lifecycle lint
✅ tsgo passed
✅ oxlint passed
✅ biome:check passed
✅ lint:type-aware passed
✅ All checks for lifecycle "lint" passed. (exit code 0)
```

### Initial lint failure and fixes

First run failed with:
- `Box role="status"` — `jsx-a11y(prefer-tag-over-role)` error (3 occurrences) → replaced `<Box role="status">` with `<output>`
- `meetingUrl as string` — `typescript(no-unsafe-type-assertion)` warning → replaced with `meetingUrl ?? ""`
- Removed unused `Box` import after switching to `<output>`

## Carry-Forward Knowledge

### For task 20 (CopyMeetingUrlButton integration)

When `CopyMeetingUrlButton.tsx` is created (task 20), update `MeetingUrlCell.tsx`:

1. Add import near the `MeetingUrlStatusBadge` import:
   ```typescript
   import { CopyMeetingUrlButton } from "@/frontend/common/components/ui/display/meetingConfig/CopyMeetingUrlButton";
   ```

2. Remove the inline `CopyButton` function (lines ~60-95) and the `// Placeholder:` comment block.

3. Replace `<CopyButton url={meetingUrl} labels={labels} />` with `<CopyMeetingUrlButton url={url} labels={labels} size="small" />` in both `renderCompactCell` and `renderFullLayout`.

4. Remove `useState` and `useCallback` imports if no longer needed after removing the inline `CopyButton`.

5. Remove `ContentCopyOutlinedIcon` import if no longer needed.

6. Re-run `bun run scripts/health/sub-loop.ts frontend/common/components/ui/display/meetingConfig/MeetingUrlCell.tsx --lifecycle lint` to verify.

### For task 23+ (MeetingGenerationStatusIndicator)

The `mapStatus()` pattern in this component (mapping codegen string → `MeetingUrlStatus` union) may be reusable for the `MeetingGenerationStatusIndicator` component.

## Cross-File Dependencies

- **Task 19 (MeetingUrlStatusBadge)**: Direct import — `MeetingUrlStatusBadge` and `MeetingUrlStatus` type consumed from `@/frontend/common/components/ui/display/meetingConfig/MeetingUrlStatusBadge`.
- **Task 20 (CopyMeetingUrlButton)**: Placeholder — inline `CopyButton` stands in until task 20 is complete. See "Carry-Forward Knowledge" above for integration steps.
- **Task 1 (i18n foundation)**: `MeetingUrlStatusLabels` type imported from `@/shared/locale/types/dashboard/meeting-url-status`. Translation namespace `Translation.Dashboard.MeetingUrlStatus` used via `useAppTranslation`.
- **Barrel export**: `frontend/common/components/ui/display/meetingConfig/index.ts` updated to export `MeetingUrlCell` and `MeetingUrlCellProps`.

## Deferred Items

- Integration with actual data table columns (replacing placeholder URL text cells)
- Storybook stories for compact, full, null, failed, expired, and pending states
- Component tests (Happy DOM)
- `CopyMeetingUrlButton` integration (pending task 20 completion)
