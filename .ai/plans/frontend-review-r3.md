# Round 3 Frontend Review Plan

## Overview
Round 3 comprehensive frontend review. 8 parallel explore subagents completed.
No commits, no pushes. Fix all severities. Respect other agents' work on files we modified.

## Reviewers (all complete)
- r3-theme-deep: ~118 findings (2 CRITICAL, ~63 WARNING, ~53 SUGGESTION)
- r3-apollo-graphql: 8 findings (7 WARNING, 1 SUGGESTION)
- r3-zustand: 15 findings (10 WARNING, 5 SUGGESTION)
- r3-barrels-imports: ~25 findings (WARNING/SUGGESTION)
- r3-react19: ~21 findings (14 CRITICAL, 6 WARNING, 1 SUGGESTION)
- r3-patterns-logging: ~18 findings (8 WARNING, 9 SUGGESTION)
- r3-mui-deep: ~618 findings (29 CRITICAL, 588 WARNING)
- r3-i18n-deep: ~40 findings (9 CRITICAL, ~20 WARNING, ~10 SUGGESTION)

## Tiered Fix Strategy

### Batch 1: CRITICAL - Suspense boundaries (14 files)
Pages using `useSearchParams()` without Suspense boundary. Pattern: wrap content in `<Suspense fallback={null}>`.
- [ ] app/(dashboard)/settings/whatsapp/page.tsx
- [ ] app/(dashboard)/recurring-schedules/page.tsx
- [ ] app/(dashboard)/settings/page.tsx
- [ ] app/(dashboard)/students/onboarding/page.tsx
- [ ] app/(dashboard)/students/[id]/profile/page.tsx
- [ ] app/(dashboard)/profile/page.tsx
- [ ] app/(dashboard)/profile/edit/page.tsx
- [ ] frontend/common/views/dashboard/profile/__shared__/profilePageServer.tsx
- [ ] frontend/common/views/dashboard/profile/__shared__/renderProfilePageClient.tsx
- [ ] app/(dashboard)/billing/page.tsx
- [ ] app/(dashboard)/feedback/manage/page.tsx
- [ ] app/(dashboard)/payment-catalogs/page.tsx
- [ ] app/(dashboard)/schedule/tracking/page.tsx
- [ ] app/(dashboard)/users/page.tsx

### Batch 2: CRITICAL - MUI v9 Typography direct `color=` prop (23 files)
Pattern: `<Typography color="textSecondary">` → `<Typography sx={{ color: "text.secondary" }}>`
- [ ] frontend/mobile/views/dashboard/admin/billing/exchange-rates/exchangeRates.mobile.tsx:34,37
- [ ] frontend/mobile/views/dashboard/admin/billing/exchange-rates/components/exchangeRateHistorySection.mobile.tsx:19,100,103
- [ ] frontend/mobile/components/ui/card/MobileCardListItem.stories.tsx:36,56,83
- [ ] frontend/mobile/components/ui/container/MobileContentStack.stories.tsx:73
- [ ] frontend/desktop/views/dashboard/admin/billing/exchange-rates/components/exchangeRateHistorySection.desktop.tsx:21,24
- [ ] frontend/common/providers/apollo/AppApolloProviderHelpers.tsx:29
- [ ] frontend/common/views/dashboard/search-schedule/components/searchScheduleFormSectionShared.tsx:29
- [ ] frontend/common/views/dashboard/search-schedule/components/teacherAvailabilityMonthDrawerShared.tsx:133
- [ ] frontend/common/views/dashboard/profile/parent/parentProfileShared.tsx:173
- [ ] frontend/common/views/dashboard/admin/billing/exchange-rates/__shared__/exchangeRatesSyncShared.tsx:57,77,83,89,95,101
- [ ] frontend/common/views/dashboard/admin/billing/exchange-rates/ProviderSettingsSection.tsx:108,112

### Batch 3: CRITICAL - i18n hardcoded strings (9 files)
- [ ] frontend/common/views/dashboard/shared/SubmissionSuccessBanner.tsx:32 (aria-label="Dismiss")
- [ ] frontend/common/views/dashboard/permissions/components/OverridesCell.tsx:131 ("Conflict")
- [ ] frontend/common/views/dashboard/permissions/components/OverridesCell.tsx:142 ("Healthy")
- [ ] frontend/common/views/dashboard/permissions/components/__shared__/singleGroupHeaderShared.tsx:152 ("Back to All Groups")
- [ ] frontend/common/views/dashboard/permissions/components/__shared__/singleGroupHeaderShared.tsx:160 ("Edit Group Details")
- [ ] frontend/common/views/dashboard/student/dashboard/components/NextClassJoinCard.tsx:44 (label="Frozen")
- [ ] frontend/mobile/views/dashboard/permissions/components/userOverridesDataGrid.mobile.tsx:65 (label="Status")
- [ ] frontend/common/views/dashboard/resources/books-and-bags/booksAndBags.types.ts:9 (missing deleteButtonLabel type)
- [ ] frontend/desktop/views/dashboard/resources/components/resourceLibraryCard.desktop.tsx:53
- [ ] frontend/mobile/views/dashboard/resources/components/resourceLibraryCard.mobile.tsx:56
- [ ] frontend/desktop/views/dashboard/resources/books-and-bags/components/bookItemCard.desktop.tsx:56
- [ ] frontend/mobile/views/dashboard/resources/books-and-bags/components/bookItemCard.mobile.tsx:43
- [ ] frontend/mobile/views/dashboard/profile/core/profileTabNav.mobile.tsx:28

### Batch 4: WARNING - Stack direct `direction`/`spacing` props (~50+ files)
Pattern: `<Stack direction="row" spacing={2}>` → `<Stack sx={{ flexDirection: "row", gap: 2 }}>`
Deferred — too many files, structural refactor. Focus on a few representative files.

### Batch 5: WARNING - Grid direct `spacing` prop (~57 files)
Pattern: `<Grid container spacing={2}>` → `<Grid sx={{ gap: 2 }}>`
Deferred — too many files.

### Batch 6: WARNING - Typography deprecated v8 variants (~100 files)
Pattern: `variant="body1"` → `variant="bodyMd"`, `variant="body2"` → `bodySm`, etc.
Deferred — too many files.

### Batch 7: MUI v9 theme callback/color hardcoding (CRITICAL)
- [ ] OnboardingPaymentMethodSection.tsx:161 — CSS var `color: "var(--mui-palette-error-main)"` → use theme callback
- [ ] currentTeacherCardShared.tsx:73 — hardcoded `fontSize: 96` → use theme

### Batch 8: i18n tier-view violations (WARNING)
Deferred to Round 4 — structural, needs careful label-prop threading.

## Verification
- Run tsgo on all modified files
- Run lint on all modified files
- Run biome on all modified files
- Don't care about errors on files not modified
- Respect other agents' changes on files we modified
- No commits, no pushes
