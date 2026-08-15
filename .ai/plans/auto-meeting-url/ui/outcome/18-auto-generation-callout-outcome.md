# Task 18 Outcome — AutoGenerationSupportCallout Interactive Guide

## Summary

Enhanced `AutoGenerationSupportCallout.tsx` from a static card into an interactive expandable guide. Collapsed state shows a visual illustration (VideocamOutlined + AutoModeOutlined), title, summary, and a "Learn more" toggle button. Expanded state reveals a 3-step guide (Connect a provider → Create a meeting config → Auto-generate at booking), a list of auto-generation modes (On save / Preview / Booking), and an optional "Create Config" action button. All strings are passed via the `labels` prop (no `useAppTranslation` in this view component), per `frontend/common/views/AGENTS.md` Rule 7. Colors come from the theme palette (no hardcoded values). MUI v9 `sx` prop rules are followed throughout.

## Files Modified

- `frontend/common/views/dashboard/profile/shared/meeting-configs/AutoGenerationSupportCallout.tsx` — complete rewrite with expandable interactive guide
- `frontend/common/views/dashboard/profile/shared/meeting-configs/AutoGenerationSupportCallout.stories.tsx` — updated `labels` constant with 8 new keys; replaced `WithCustomLearnMoreHref` story with `WithCreateConfigAction` and `WithCreateConfigHref` stories
- `frontend/common/views/dashboard/profile/shared/meeting-configs/MeetingConfigsManager.stories.tsx` — updated `autoGenLabels` constant with 8 new keys; added `connectAccountLabels` constant and wired missing `labels`/`onReconnect` props for `ConnectProviderAccount` in the `UnconnectedProvider` story (pre-existing tsgo errors surfaced by the file re-check)
- `shared/locale/types/profile/index.ts` — added 8 new keys to `autoGeneration` interface: `summary`, `learnLess`, `createConfig`, `step1Title`, `step1Description`, `step2Title`, `step2Description`, `step3Title`, `step3Description`
- `shared/locale/en/profile/notifications/index.ts` — added EN implementations for all 8 new keys
- `shared/locale/ar/profile/notifications/index.ts` — added AR implementations for all 8 new keys
- `.ai/plans/auto-meeting-url/ui/tasks.md` — updated task 18 checkbox from `[ ]` to `[x]`

## Files NOT Modified (and why)

- `frontend/common/views/dashboard/profile/shared/meeting-configs/MeetingConfigsManager.tsx` — consumer of `AutoGenerationSupportCallout`; currently renders `<AutoGenerationSupportCallout labels={state.labels.autoGeneration} />` at line 207 without `onCreateConfig`. Wiring the `onCreateConfig` callback to `openCreateForm` from the ViewModel is a follow-up task (task 18b / 30).
- `useMeetingConfigsManagerViewModel.ts` — NOT modified. The ViewModel wiring (passing `onCreateConfig` handler) is a follow-up task.

## Component Design

### Props Interface

```typescript
export type AutoGenerationSupportCalloutProps = {
  readonly labels: ProfileNotificationsLabels["autoGeneration"];
  readonly onCreateConfig?: () => void;
  readonly createConfigHref?: string;
};
```

### Layout Structure

```
<Card variant="outlined" sx={{ bgcolor: theme.palette.info.main }}>
  <CardContent>
    <Stack spacing={1.5}>
      <CollapsedSummary>          // Collapsed: always visible
        <VisualIllustration />    // VideocamOutlined + AutoModeOutlined
        <Stack>                   // Title + Summary
        <Button>                  // Learn more / Show less toggle
          aria-expanded={expanded}
          aria-controls={contentId}
          endIcon={<ExpandIcon />}  // ExpandMoreOutlined with rotation
      </CollapsedSummary>
      <Collapse in={expanded} id={contentId}>  // Expanded: collapsible
        <ExpandedGuide>
          <StepItem>              // Step 1: Connect a provider (LinkOutlined)
          <StepItem>              // Step 2: Create a meeting config (SettingsOutlined)
          <StepItem>              // Step 3: Auto-generate at booking (AutoModeOutlined)
          <ModeItem>              // On save (SaveOutlined)
          <ModeItem>              // Preview (VisibilityOutlined)
          <ModeItem>              // Booking (EventAvailableOutlined)
          <Button>                // Create config action (SettingsOutlined)
            href={createConfigHref}
            onClick={onCreateConfig}
        </ExpandedGuide>
      </Collapse>
    </Stack>
  </CardContent>
</Card>
```

### States

| State | Condition | Render |
|-------|-----------|--------|
| Collapsed | `expanded === false` | Visual illustration + title + summary + "Learn more" button |
| Expanded | `expanded === true` | All collapsed content + 3-step guide + 3 mode items + optional "Create config" button |

### Accessibility

- `aria-expanded` on the toggle button reflects `expanded` state
- `aria-controls` on the toggle button links to `contentId` of the `Collapse` content
- `useId()` generates stable IDs for `aria-controls`/`aria-expanded` linkage (sanitized to remove colons)
- `ExpandIcon` rotates 180° when expanded, providing visual feedback

### Key Design Decisions

1. **Labels via props (Rule 7)**: The component receives `ProfileNotificationsLabels["autoGeneration"]` as the `labels` prop — no `useAppTranslation` call, consistent with `frontend/common/views/AGENTS.md` Rule 7 for domain components under `frontend/common/views/`.

2. **ViewModel callback pattern**: The component does NOT call any mutation or hook directly. It receives `onCreateConfig()` callback — the ViewModel owns the form dialog opening logic.

3. **Dual action modes**: Supports either `onCreateConfig` (callback for ViewModel-driven form dialog) or `createConfigHref` (URL for direct navigation). The "Create config" button only renders if at least one is provided.

4. **Colors via theme palette**: All colors use `theme.palette.info.main` (callout background) and `theme.palette.onInfo` (text/icon colors on the info background) — no hardcoded colors.

5. **MUI v9 compliance**: All layout props (`flexDirection`, `alignItems`, `gap`, `flex`, `minWidth`, `alignSelf`, `pt`, `p`, `flexDirection`) are in `sx`, not as direct props. Icons use `*Outlined` suffix.

6. **Module-level helpers**: `buildGuideSteps()` and `buildModes()` are module-level pure functions — no closures over component state.

7. **Removed `learnMoreHref` prop**: The old `learnMoreHref` prop (which rendered an external link) is removed. The "Learn more" button now toggles the expandable guide inline. Stories that previously passed `learnMoreHref` are updated with new action-based stories.

### Labels Added

| Key | Type | EN | AR |
|-----|------|----|----|
| `summary` | `string` | "Connect a provider, create a meeting config, and let Siraj generate a meeting URL for every booking." | "اربط مزودًا، أنشئ إعداد اجتماع، ودع سراج يولّد رابط اللقاء تلقائيًا عند كل حجز." |
| `learnLess` | `string` | "Show less" | "عرض أقل" |
| `createConfig` | `string` | "Create config" | "إنشاء إعداد" |
| `step1Title` | `string` | "Connect a provider" | "اربط مزودًا" |
| `step1Description` | `string` | "Ask your admin to connect Zoom, Google Meet, or Microsoft Teams in Settings → Meeting Integrations." | "اطلب من المسؤول ربط Zoom أو Google Meet أو Microsoft Teams في الإعدادات ← تكاملات الاجتماعات." |
| `step2Title` | `string` | "Create a meeting config" | "أنشئ إعداد اجتماع" |
| `step2Description` | `string` | "Choose the connected provider, pick a default meeting template, and save it to your profile." | "اختر المزود المرتبط، ثم اختر قالب الاجتماع الافتراضي، ثم احفظه في ملفك الشخصي." |
| `step3Title` | `string` | "Auto-generate at booking" | "توليد تلقائي عند الحجز" |
| `step3Description` | `string` | "When a meeting is booked, Siraj creates a fresh meeting URL using your config automatically." | "عند حجز اجتماع، ينشئ سراج رابط لقاء جديد باستخدام إعدادك تلقائيًا." |

## Verification Results

### Component (lint lifecycle)
```
bun run scripts/health/sub-loop.ts frontend/common/views/dashboard/profile/shared/meeting-configs/AutoGenerationSupportCallout.tsx --lifecycle lint
✅ tsgo passed
✅ oxlint passed
✅ biome:check passed
✅ lint:type-aware passed
✅ All checks for lifecycle "lint" passed. (exit code 0)
```

### Component (codescene lifecycle — full sweep)
```
bun run scripts/health/sub-loop.ts frontend/common/views/dashboard/profile/shared/meeting-configs/AutoGenerationSupportCallout.tsx --lifecycle codescene
✅ tsgo passed
✅ oxlint passed
✅ biome:check passed
✅ lint:type-aware passed
✅ check:duplicates passed
✅ codescene passed
✅ All checks for lifecycle "codescene" passed. (exit code 0)
```

### AutoGenerationSupportCallout.stories.tsx (lint lifecycle)
```
bun run scripts/health/sub-loop.ts frontend/common/views/dashboard/profile/shared/meeting-configs/AutoGenerationSupportCallout.stories.tsx --lifecycle lint
✅ tsgo passed
✅ oxlint passed
✅ biome:check passed
✅ lint:type-aware passed
✅ All checks for lifecycle "lint" passed. (exit code 0)
```

### MeetingConfigsManager.stories.tsx (lint lifecycle)
```
bun run scripts/health/sub-loop.ts frontend/common/views/dashboard/profile/shared/meeting-configs/MeetingConfigsManager.stories.tsx --lifecycle lint
✅ tsgo passed
✅ oxlint passed
✅ biome:check passed
✅ lint:type-aware passed
✅ All checks for lifecycle "lint" passed. (exit code 0)
```

### shared/locale/types/profile/index.ts (lint lifecycle)
```
bun run scripts/health/sub-loop.ts shared/locale/types/profile/index.ts --lifecycle lint
✅ tsgo passed
✅ oxlint passed
✅ biome:check passed
✅ lint:type-aware passed
✅ All checks for lifecycle "lint" passed. (exit code 0)
```

### shared/locale/en/profile/notifications/index.ts (lint lifecycle)
```
bun run scripts/health/sub-loop.ts shared/locale/en/profile/notifications/index.ts --lifecycle lint
✅ tsgo passed
✅ oxlint passed
✅ biome:check passed
✅ lint:type-aware passed
✅ All checks for lifecycle "lint" passed. (exit code 0)
```

### shared/locale/ar/profile/notifications/index.ts (lint lifecycle)
```
bun run scripts/health/sub-loop.ts shared/locale/ar/profile/notifications/index.ts --lifecycle lint
✅ tsgo passed
✅ oxlint passed
✅ biome:check passed
✅ lint:type-aware passed
✅ All checks for lifecycle "lint" passed. (exit code 0)
```

## Carry-Forward Knowledge

### For ViewModel integration (task 18b / 30)
The `useMeetingConfigsManagerViewModel` will need to wire `AutoGenerationSupportCallout` with `onCreateConfig`:
1. Pass `openCreateForm` (already exists at line 181 of `useMeetingConfigsManagerViewModel.ts`) as the `onCreateConfig` callback
2. Update `MeetingConfigsManager.tsx` line 207 to render `<AutoGenerationSupportCallout labels={state.labels.autoGeneration} onCreateConfig={state.openCreateForm} />`

### Pre-existing tsgo errors surfaced
The `MeetingConfigsManager.stories.tsx` file had pre-existing tsgo errors in the `UnconnectedProvider` story — `ConnectProviderAccount` was missing `labels` and `onReconnect` props (introduced by Task 12's enhancement of `ConnectProviderAccount`). These were fixed in this task by adding a `connectAccountLabels` constant and wiring the missing props, since the file was already being modified for the `autoGenLabels` update.

## Cross-File Dependencies

- **Task 1 (i18n foundation)**: `ProfileNotificationsLabels["autoGeneration"]` type in `shared/locale/types/profile/index.ts` + EN/AR implementations — extended in this task with 8 new keys.
- **Task 18b (MeetingConfigsManager enhancement)**: Will integrate `onCreateConfig={state.openCreateForm}` into the `<AutoGenerationSupportCallout>` render at `MeetingConfigsManager.tsx` line 207.
- **Task 30 (ViewModel)**: No changes needed — `openCreateForm` already exists in the ViewModel hook.

## Deferred Items

- ViewModel wiring (passing `onCreateConfig={state.openCreateForm}` to the component in `MeetingConfigsManager.tsx`)
- Integration into `MeetingConfigsManager` orchestrating container (task 18b)
- Storybook stories for expanded state (task 35b)
- Component tests for collapsed/expanded states (task 35)
