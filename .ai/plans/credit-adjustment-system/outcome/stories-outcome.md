# Stories Outcome — Credit Adjustment UI Storybook stories

- **Status**: ✅ Done
- **Date**: 2026-08-30
- **Purpose**: Visual-comparison baselines for prototype-vs-implementation captures.

## Stories created

| File | Title | Stories / ids |
|---|---|---|
| `frontend/common/components/ui/input/richText/RichTextEditor.stories.tsx` | `UI/Input/RichTextEditor` | `ui-input-richtexteditor--empty`, `--filled`, `--error-state`, `--disabled` |
| `frontend/common/views/dashboard/accounting/credits/AdjustmentTypeRadioGroup.stories.tsx` | `Views/dashboard/accounting/credits/AdjustmentTypeRadioGroup` | `views-dashboard-accounting-credits-adjustmenttyperadiogroup--add-selected`, `--subtract-selected`, `--subtract-with-carryover-selected` |
| `frontend/common/views/dashboard/accounting/credits/CarryoverBanner.stories.tsx` | `Views/dashboard/accounting/credits/CarryoverBanner` | `views-dashboard-accounting-credits-carryoverbanner--empty`, `--dates-seeded`, `--with-errors` |
| `frontend/common/views/dashboard/accounting/credits/CreditAdjustForm.stories.tsx` | `Views/dashboard/accounting/credits/CreditAdjustForm` | `views-dashboard-accounting-credits-creditadjustform--empty`, `--preselected-student`, `--carryover-expanded` |
| `frontend/common/views/dashboard/accounting/credits/StudentCreditsList.stories.tsx` | `Views/dashboard/accounting/credits/StudentCreditsList` | `views-dashboard-accounting-credits-studentcreditslist--with-students` (8 rows), `--empty` |

All 16 ids (incl. the three `--docs` autodocs entries) resolve in the running Storybook's
`index.json` — verified via `curl http://localhost:6006/index.json`.

## Conventions followed

- **Placement**: `<Name>.stories.tsx` colocated next to each component (dominant repo pattern).
- **Titles / meta**: `UI/<Category>/<Component>` for the primitive (matches `TimezoneSelect`),
  `Views/dashboard/...` path-mirroring titles for view components (matches quota-audience
  stories). Views use `parameters.layout: "fullscreen"` + `tags: ["autodocs"]`; the editor
  story uses the `ai-generated` tag like sibling `TimezoneSelect` stories.
- **Apollo mocking**: `MockedProvider` from `@apollo/client/testing/react` with
  `MockLink.MockedResponse` fixtures (`maxUsageCount: Number.POSITIVE_INFINITY`) — the exact
  pattern from `StudentQuotaView.stories.tsx` and the `test/ui/components/accounting/*.test.tsx`
  suites; `__typename`s (`StudentDirectoryRow`, `AssociatedStudent`, `TeacherSimple`,
  `CreditAdjustmentResult`) copied from those fixtures.
- **Store seeding**: `StoreSeed` decorator components seed `useCreditAdjustFormStore` via
  `setState` on mount and call `reset()` in the effect cleanup — no cross-story leakage
  (verified by re-opening the Add story after the carryover stories: selection back to ADD,
  no banner in the empty form).
- **i18n**: nothing story-local — global `StoryWrapper` already provides `LocaleProvider`/
  theme/RTL; `dashboard.billing.creditAdjustment` and `ui.richText` namespaces load through
  the translation-cache suspense boundary.
- **Notifications**: form stories wrap in toolpad `NotificationsProvider` (the app-level
  provider is not part of `StoryWrapper`; `useNotifications` falls back to a throwing server
  stub otherwise).
- **TipTap editor**: `RichTextEditor` stories use a small stateful wrapper
  (`initialValue` arg → `useState`) mirroring the `TimezoneSelect` story pattern.
- The `CarryoverBanner` teacher is picker-local state by design, so only store-bound dates are
  pre-populated in the seeded story (same limitation noted for `CreditAdjustForm` carryover).

## Verification

1. Per-file sub-loop (`bun run scripts/health/sub-loop.ts <file> --lifecycle codescene`):
   **exit 0 for all five files** — tsgo ✓ oxlint ✓ biome ✓ lint:type-aware ✓ duplicates
   (skipped: `*.stories.tsx` outside jscpd scope) ✓ codescene ✓.
2. Live Storybook (port 6006, agent-browser session `sb-4e6bfa581bd6`): every story rendered
   with the expected content in the default Arabic RTL locale:
   - `richtexteditor--filled`: toolbar (غامق/مائل/تسطير/…) + bold/italic/list content;
     `--error-state`: `aria-invalid="true"` + helper text; `--disabled`: disabled buttons.
   - Radio group: correct `checked=true` radio per story (إضافة / خصم / خصم مع الترحيل).
   - `carryoverbanner--dates-seeded`: pickers held `01/08/2026`, `15/08/2026`, `20/08/2026`;
     `--with-errors`: inline "… is required" messages; banner title "الترحيل — تخصيص للمعلم".
   - `creditadjustform--preselected-student`: summary row "Layla Haddad" + "Karim Mansour" +
     balance chip "14 / 20"; `--carryover-expanded`: banner visible, hours=4, notes seeded.
   - `studentcreditslist--with-students`: 8 rows incl. "Omar Halim … 14 / 20"; `--empty`:
     "لا يوجد طلاب" + disabled pager.
   - `agent-browser errors`/`console`: clean; the only network failure observed is a
     pre-existing `favicon.ico` 404 (unrelated Storybook artifact).

No component source files, `trackable-tasks.md`, or unrelated dirty files were touched.
