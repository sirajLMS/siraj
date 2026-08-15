# Task 14b Outcome — Create DisconnectConfirmDialog Component

## Summary

Created a new `DisconnectConfirmDialog` component that wraps `BaseDeleteDialog` for the meeting integrations disconnect confirmation flow. The component receives all user-facing strings via a `labels` prop from the ViewModel (per `frontend/common/views/AGENTS.md` Rule 7) and surfaces mutation errors via an inline `Alert`.

## Files Created

- `frontend/common/views/dashboard/settings/components/meetingIntegrations/DisconnectConfirmDialog.tsx` — new component.

## Files Modified

- `shared/locale/types/ui/index.ts` — added `disconnect: string` and `cancel: string` to the `MeetingConfigEnhancementLabels` interface.
- `shared/locale/types/ui/meetingConfigEnhancements.ts` — added `disconnect: string`, `cancel: string`, and `disconnectError: string` to the duplicate `MeetingConfigEnhancementLabels` interface (kept in sync with `index.ts`).
- `shared/locale/en/ui/meetingConfig/enhancements.ts` — added EN translations: `disconnect: "Disconnect"`, `cancel: "Cancel"`, `disconnectError: "Failed to disconnect provider. Please try again."`.
- `shared/locale/ar/ui/meetingConfig/enhancements.ts` — added AR translations: `disconnect: "فصل"`, `cancel: "إلغاء"`, `disconnectError: "تعذّر فصل المزود. يرجى المحاولة مرة أخرى."`.

### Component Design

1. **Wraps `BaseDeleteDialog`** (not raw MUI `Dialog`) — delegates dialog rendering (warning icon, centered title/body, action buttons, loading state) to the shared primitive.
2. **Props**: `labels`, `open`, `providerName`, `providerSlug`, `isLoading`, `errorMessage`, `onConfirm(providerSlug)`, `onClose`.
3. **Labels type** — `Pick<MeetingConfigEnhancementLabels, "disconnectWarningTitle" | "disconnectWarningMessage" | "disconnectWarningImpact" | "disconnect" | "cancel">`.
4. **Title** sourced from i18n key `disconnectWarningTitle` (reused existing key — no duplication).
5. **Body** interpolates `providerName` into `disconnectWarningMessage` via template literal, followed by `disconnectWarningImpact` for the impact-on-meeting-configs line.
6. **Confirm button label** from i18n key `actions.disconnect` (`labels.disconnect`).
7. **Loading state** — `BaseDeleteDialog` handles `isLoading` internally (shows `"..."` on confirm button, disables both buttons).
8. **Error display** — when `errorMessage` is non-null, renders `Alert severity="error"` inside a Fragment alongside `BaseDeleteDialog`. ViewModel logs via `logger.error` from `@/frontend/utils/logger` and passes the translated error message.
9. **No `useAppTranslation`** — all strings passed as `labels` prop from ViewModel (per Rule 7).
10. **`onConfirm`** delegates to parent with `providerSlug` argument.

## Verification Results

### `DisconnectConfirmDialog.tsx`
```
bun run scripts/health/sub-loop.ts frontend/common/views/dashboard/settings/components/meetingIntegrations/DisconnectConfirmDialog.tsx --lifecycle lint
✅ tsgo passed
✅ oxlint passed
✅ biome:check passed
✅ lint:type-aware passed
✅ All checks for lifecycle "lint" passed. (exit code 0)
```

### `shared/locale/types/ui/index.ts`
```
bun run scripts/health/sub-loop.ts shared/locale/types/ui/index.ts --lifecycle lint
✅ tsgo passed
✅ oxlint passed
✅ biome:check passed
✅ lint:type-aware passed
✅ All checks for lifecycle "lint" passed. (exit code 0)
```

### `shared/locale/types/ui/meetingConfigEnhancements.ts`
```
bun run scripts/health/sub-loop.ts shared/locale/types/ui/meetingConfigEnhancements.ts --lifecycle lint
✅ tsgo passed
✅ oxlint passed
✅ biome:check passed
✅ lint:type-aware passed
✅ All checks for lifecycle "lint" passed. (exit code 0)
```

### `shared/locale/en/ui/meetingConfig/enhancements.ts`
```
bun run scripts/health/sub-loop.ts shared/locale/en/ui/meetingConfig/enhancements.ts --lifecycle lint
✅ tsgo passed
✅ oxlint passed
✅ biome:check passed
✅ lint:type-aware passed
✅ All checks for lifecycle "lint" passed. (exit code 0)
```

### `shared/locale/ar/ui/meetingConfig/enhancements.ts`
```
bun run scripts/health/sub-loop.ts shared/locale/ar/ui/meetingConfig/enhancements.ts --lifecycle lint
✅ tsgo passed
✅ oxlint passed
✅ biome:check passed
✅ lint:type-aware passed
✅ All checks for lifecycle "lint" passed. (exit code 0)
```

## Carry-Forward Knowledge

- `BaseDeleteDialog` props: `open`, `onClose`, `title`, `body` (NOT `message`), `cancelLabel`, `confirmLabel`, `isLoading` (NOT `loading`), `onConfirm`, optional `confirmSx`.
- `BaseDeleteDialog` handles loading state internally — shows `"..."` on confirm button and disables both buttons when `isLoading=true`. It does not support `CircularProgress` or children injection for custom content inside the dialog.
- The `Alert severity="error"` is rendered as a sibling to `BaseDeleteDialog` in a Fragment since the scaffold does not accept children.
- `disconnectWarningMessage` is a plain `string` type (NOT a function), so `providerName` is interpolated via template literal.
- **Pre-existing duplicate type definition**: `MeetingConfigEnhancementLabels` is defined in BOTH `shared/locale/types/ui/index.ts` and `shared/locale/types/ui/meetingConfigEnhancements.ts`. Both must be kept in sync. Imports from `@/shared/locale/types/ui` resolve to `index.ts`.
- Three new i18n keys were added: `disconnect` (confirm button label), `cancel` (cancel button label), and `disconnectError` (ViewModel error message). Existing `disconnectWarningTitle`, `disconnectWarningMessage`, and `disconnectWarningImpact` keys were reused without duplication.

## Cross-File Dependencies

None. The component is newly created and not yet wired into any consumer (that will happen in later tasks that build the `MeetingConfigsManager` container).

## Deferred Items

None.
