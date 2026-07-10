# Payment Methods Enhancement — Tasks

Check off as completed. See [plan.md](./plan.md) for phase details and [spec.md](./spec.md) for requirements.

## Phase 0 — Planning

- [x] Create `spec.md`
- [x] Create `plan.md`
- [x] Create `tasks.md`

## Phase 1 — Enums + types + validation libs

- [ ] Create `backend/enum/payment-method.enum.ts` (`PaymentMethodType`, `PaymentDirection`, `IdentifierKind`)
- [ ] Update `backend/enum/billing.enum.ts` — **delete** `PaymentMethod` enum (keep `InvoiceStatus`, `InvoiceType`)
- [ ] Update `backend/enum/permission.enum.ts` — `PAYMENT_METHODS_MANAGE_CATALOGS`, `PAYMENT_METHODS_VERIFY_BANK_TRANSFER`
- [ ] Update `backend/enum/index.ts`
- [ ] Create `backend/types/payment-method.types.ts` — includes `PaymentMethodTransactionSnapshot`
- [ ] Update `backend/types/billing.types.ts` — `PaymentRecordInput` + snapshot fields on `PaymentSelectType`
- [ ] Update `backend/types/teacher.types.ts` — delete banking history types; `CreateTeacherPaymentInput` uses snapshot
- [ ] Update `backend/types/parent.types.ts` — remove scalar `paymentMethod`
- [ ] Update `backend/types/profile.types.ts` — replace `bankingSummary` with payment methods
- [ ] Update `backend/types/teacher-onboarding.types.ts`
- [ ] Update `backend/types/index.ts`
- [ ] Create `backend/lib/payment-method.validation.ts` — discriminated Zod + `localizedStringSchema` + `PaymentMethodTransactionSnapshot` schema
- [ ] Create `backend/lib/field-encryption.ts` — extract `encryptField` / `decryptField` from `custom-types.ts`
- [ ] Create `backend/lib/payment-method-jsonb.ts` — encrypt/decrypt `BankTransferDetails` inside JSONB
- [ ] Update `backend/db/schema/custom-types.ts` — delegate to `field-encryption.ts`
- [ ] Create `frontend/lib/payment-method.ts` — display helpers
- [ ] Gate: `bun tsgo`

## Phase 2 — Schema + migration + seeds

- [ ] Create `backend/db/schema/user-payment-methods.ts` — `details` jsonb `.$type<PaymentMethodDetails>()`
- [ ] Create `backend/db/schema/supported-mobile-wallets.ts` — `name`/`description`/`instructions` `.$type<LocalizedString>()`
- [ ] Create `backend/db/schema/supported-payment-links.ts` — `LocalizedString` columns + `url_allowlist` `.$type<readonly string[]>()`
- [ ] Create `backend/db/schema/supported-online-accounts.ts` — `LocalizedString` columns incl. `identifier_label`
- [ ] Update `backend/db/schema/enums.ts` — add `paymentMethodTypeEnum`, `paymentDirectionEnum`, `identifierKindEnum`; **delete** `paymentMethodEnum`
- [ ] Update `backend/db/schema/teachers.ts` — drop `payment_method`
- [ ] Update `backend/db/schema/parents.ts` — drop `payment_method`
- [ ] Delete `backend/db/schema/teacher-banking.ts`
- [ ] Create `backend/db/schema/teacher-payments.ts` — FK + `payment_method_snapshot` `.$type<PaymentMethodTransactionSnapshot>()`
- [ ] Update `backend/db/schema/billing.ts` — delete `payment_method`; add FK + `payment_method_snapshot` `.$type<PaymentMethodTransactionSnapshot>()`
- [ ] Update `backend/db/schema/index.ts`
- [ ] Update `backend/db/drizzleRelations.ts` — remove teacher banking relations; add payment method relations
- [ ] JSONB gate: every new schema file uses `jsonb(...).$type<T>()` — no bare `jsonb()` columns
- [ ] Drizzle MCP `check` → drop local DB → `generate` (8C — no backfill); resolve `missing_hints` via drizzle-hints skill
- [ ] Seed catalog rows (PayPal, Wise, Vodafone Cash, Etisalat Cash, STC Pay, InstaPay)
- [ ] Seed demo user payment methods
- [ ] Seed new permissions in permission groups
- [ ] Gate: db tests

## Phase 3 — Repositories

- [ ] Create `backend/db/repo/user-payment-method.repository.ts`
- [ ] Create `backend/db/repo/supported-mobile-wallet.repository.ts`
- [ ] Create `backend/db/repo/supported-payment-link.repository.ts`
- [ ] Create `backend/db/repo/supported-online-account.repository.ts`
- [ ] Delete `backend/db/repo/teacher-banking.repository.ts`
- [ ] Update `backend/db/repo/teacher.repository.ts`
- [ ] Update `backend/db/repo/parent.repository.ts`
- [ ] Update `backend/db/repo/billing.repository.ts`
- [ ] Update `backend/db/repo/index.ts`
- [ ] Create `backend/db/test/repo/user-payment-method.repository.test.ts`
- [ ] Create `backend/db/test/repo/supported-mobile-wallet.repository.test.ts`
- [ ] Create `backend/db/test/repo/supported-payment-link.repository.test.ts`
- [ ] Create `backend/db/test/repo/supported-online-account.repository.test.ts`
- [ ] Gate: `bun run test:db`

## Phase 4 — Services

- [ ] Create `backend/services/payment-method/payment-method-snapshot.ts` — `buildTransactionSnapshot` (uses `payment-method-jsonb` lib for bank encryption)
- [ ] Create `backend/services/payment-method/payment-method-snapshot.test.ts`
- [ ] Create `backend/services/payment-method/payment-method-mask.ts`
- [ ] Create `backend/services/payment-method/payment-method.service.ts` — CRUD, defaults, `recordPayin`, `recordPayout`
- [ ] Create `backend/services/payment-method/payment-catalog.service.ts`
- [ ] Create `backend/services/payment-method/index.ts`
- [ ] Delete `backend/services/profile/banking-summary.ts`
- [ ] Rewrite `backend/services/profile/banking-summary.test.ts` → `payment-method-mask.test.ts`
- [ ] Update `backend/services/profile/profile.service.ts`
- [ ] Update `backend/services/profile/profile.service.test.ts`
- [ ] Update `backend/services/profile/parent-profile.service.ts`
- [ ] Update `backend/services/profile/parent-profile.service.test.ts`
- [ ] Update `backend/services/profile/teacher-profile.service.test.ts`
- [ ] Update `backend/services/profile/index.ts`
- [ ] Update `backend/services/parent/parent-onboarding.service.ts`
- [ ] Update `backend/services/teacher/teacher-onboarding.service.ts`
- [ ] Update `backend/services/teacher/teacher-portal.service.ts`
- [ ] Update `backend/services/staff/staff-profile.service.ts`
- [ ] Gate: service tests + `bun tsgo`

## Phase 5 — Pothos + GraphQL

- [ ] Create `backend/graphql/pothos/payment-method.pothos.ts` — `PaymentMethodTransactionSnapshot` object
- [ ] Update `backend/graphql/pothos/billing.pothos.ts` — expose `paymentMethodSnapshot` on `Payment`
- [ ] Update payout pothos — expose `paymentMethodSnapshot` on `TeacherPayment` (if exposed in GraphQL)
- [ ] Update `backend/graphql/pothos/enum.pothos.ts` — add new enums; **delete** `PaymentMethodPothosObject`
- [ ] Update `backend/graphql/pothos/profile.pothos.ts` — **delete** `TeacherBankingSummaryPothosObject`; add payment methods
- [ ] Update `backend/graphql/pothos/staff-profile.pothos.ts`
- [ ] Update `backend/graphql/pothos/parent-profile.pothos.ts`
- [ ] Update `backend/graphql/pothos/parent-onboarding.pothos.ts`
- [ ] Update `backend/graphql/pothos/teacher-portal.pothos.ts`
- [ ] Update `backend/graphql/pothos/teacher-onboarding.pothos.ts`
- [ ] Update `backend/enum/notificationDeliveries.enum.ts` — **delete** `BANKING_DETAILS_CHANGED`; add `PAYMENT_METHOD_CHANGED`
- [ ] Create `backend/graphql/mutation/payment-method.mutation.ts`
- [ ] Update `backend/graphql/mutation/onboarding.mutation.ts`
- [ ] Update `backend/graphql/mutation/staff-profile.mutation.ts`
- [ ] `bun run generate:gqlSchema` + `bun codegen`
- [ ] Create `frontend/graphql/test/payment-method.test.ts`
- [ ] Gate: `bun run test:graphql`

## Phase 6 — Frontend documents

- [ ] Create `frontend/graphql/sharedDocuments/payment-method.documents.ts`
- [ ] Update `frontend/graphql/sharedDocuments/profile.documents.ts`
- [ ] Update `frontend/graphql/sharedDocuments/parent-profile.documents.ts`
- [ ] Update `frontend/graphql/sharedDocuments/staff-profile.documents.ts`
- [ ] Update `frontend/graphql/sharedDocuments/teacher-portal.documents.ts`
- [ ] Update `frontend/graphql/sharedDocuments/parent-onboarding.documents.ts`
- [ ] Update `frontend/graphql/sharedDocuments/teacher-onboarding.documents.ts`
- [ ] Update `frontend/graphql/sharedDocuments/profile.documents.test.ts`
- [ ] Update `frontend/graphql/sharedDocuments/index.ts`
- [ ] Re-run `bun codegen`

## Phase 7 — UI composables + i18n

> Net-new components are thin composables over existing `frontend/components/ui/**` primitives — see plan.md [Component reuse map](./plan.md#component-reuse-map). No new top-level input/display primitives where an existing one fits. Also add `CatalogImageUpload` (currently un-barreled) to `input/index.ts`.

### `frontend/lib` option builders (mirror `frontend/lib/currency.ts`)

- [ ] Create `frontend/lib/payment-method.ts` — catalog option builders (`getPaymentMethodTypeOptions`, `getCatalogOptionRowLabel`, etc.) mirroring `getCurrencyOptions` / `getCurrencyDisplayName` / `getCurrencySymbol` from `frontend/lib/currency.ts`

### `PaymentMethodSelect` (mirror `CurrencySelect` / `CurrencyAutocomplete` / `CurrencyOptionRow`)

- [ ] Create `frontend/components/ui/input/paymentMethodSelect/index.ts` — barrel
- [ ] Create `frontend/components/ui/input/paymentMethodSelect/PaymentMethodOptionRow.tsx` — mirror `CurrencyOptionRow.tsx` (type icon + localized name + catalog slug)
- [ ] Create `frontend/components/ui/input/paymentMethodSelect/paymentMethodAutocompletePopper.ts` — mirror `currencyAutocompletePopper.ts`
- [ ] Create `frontend/components/ui/input/paymentMethodSelect/PaymentMethodAutocomplete.tsx` — mirror `CurrencyAutocomplete.tsx` (searchable Autocomplete + `allowedCodes`-style subset filter + popper plumbing)
- [ ] Create `frontend/components/ui/input/paymentMethodSelect/PaymentMethodSelect.tsx` — thin wrapper mirroring `CurrencySelect.tsx` over `PaymentMethodAutocomplete`
- [ ] Create `frontend/components/ui/input/paymentMethodSelect/PaymentMethodSelect.stories.tsx` — mirror `CurrencySelect.stories.tsx` (single-select + `allowedCodes` subset story)

### `PaymentMethodTypeFields` (mirror `GenderSelector` + per-type field composition)

- [ ] Create `frontend/components/ui/input/paymentMethodTypeFields/index.ts` — barrel
- [ ] Create `frontend/components/ui/input/paymentMethodTypeFields/PaymentMethodTypeSelector.tsx` — mirror `GenderSelector.tsx` (`ButtonGroup` over `PaymentMethodType` codegen enum, `allowEmpty` + `labels` override)
- [ ] Create `frontend/components/ui/input/paymentMethodTypeFields/PaymentMethodTypeFields.tsx` — per-type dynamic fields composing `PhoneFormField` (MOBILE_WALLET phone), `CurrencySelect`/`CountryAutocomplete` (country/currency filter), `TagInput` (`url_allowlist`), `LocalizedStringFormField` (`instructions`/`name`), `react-hook-form` `Controller` (mirror `PhoneFormField` + `LocalizedStringFormField`)

### `PaymentMethodDefaultsEditor` (compose `LocalizedStringDrawer` + `FieldWrapper` + `FormSuccessSnackbar`)

- [ ] Create `frontend/components/ui/input/paymentMethodDefaultsEditor/index.ts` — barrel
- [ ] Create `frontend/components/ui/input/paymentMethodDefaultsEditor/PaymentMethodDefaultsEditor.tsx` — compose `LocalizedStringDrawer` (per-locale instructions), `CurrencySelect` (`allowedCodes`), `FieldWrapper`, `FormSuccessSnackbar`

### `PaymentMethodDisplay` + `PaymentMethodList` (compose display family + `AppDataGrid`)

- [ ] Create `frontend/components/ui/display/paymentMethod/index.ts` — barrel
- [ ] Create `frontend/components/ui/display/paymentMethod/PaymentMethodDisplay.tsx` — compose `LocalizedStringDisplay` (catalog name) + `CurrencyDisplay`/`CountryDisplay` + `PhoneDisplay` (MOBILE_WALLET) + `StatusBadge(category="paymentMethod")`
- [ ] Create `frontend/components/ui/display/paymentMethod/PaymentMethodList.tsx` — compose `BaseCard` + `AppDataGrid<PaymentMethodRow>` (mirror `PermissionCatalogDataGrid`); column defs + row type only — no new list primitive
- [ ] Create `frontend/components/ui/display/paymentMethod/PaymentMethodDisplay.stories.tsx`

### Existing-component extensions + barrel wiring

- [ ] Update `frontend/components/ui/badge/StatusBadge.tsx` — extend `StatusBadgeCategory` union with `"paymentMethod"`; add `case "paymentMethod":` in `resolveStatusPaletteKey` (≈10 lines — self-contained, no theme token additions)
- [ ] Update `frontend/components/ui/input/index.ts` — export the three new folders (`paymentMethodSelect`, `paymentMethodTypeFields`, `paymentMethodDefaultsEditor`); **add `export * from "@/frontend/components/ui/input/catalogImageUpload/CatalogImageUpload"`** (currently un-barreled, needed for catalog icons)
- [ ] Update `frontend/components/ui/display/index.ts` — re-export `paymentMethod/`

### i18n

- [ ] Create `shared/messages/types/ui/payment-method.ts`
- [ ] Create `shared/messages/ar/ui/payment-method.ts`
- [ ] Update `shared/messages/en.ts`
- [ ] Update `shared/messages/types/ui/index.ts`
- [ ] Update `shared/messages/ar/ui/index.ts`

## Phase 8 — View usages + admin catalog UI

> Net-new view components are thin compositions of the Phase 7 payment-method composables + existing `frontend/components/ui/**` primitives. See plan.md [Component reuse map](./plan.md#component-reuse-map).

### Teacher payment methods (replace banking tab)

- [ ] Create `frontend/views/dashboard/profile/teacher/payment-methods/PaymentMethodsTab.tsx`
- [ ] Create `frontend/views/dashboard/profile/teacher/payment-methods/PaymentMethodsView.tsx`
- [ ] Create `frontend/views/dashboard/profile/teacher/payment-methods/PaymentMethods.stories.tsx`
- [ ] Update `frontend/views/dashboard/profile/core/profileTabs.ts` — delete `banking` tab; add `paymentMethods`
- [ ] Delete `frontend/views/dashboard/profile/teacher/banking/TeacherBankingTab.tsx`
- [ ] Delete `frontend/views/dashboard/profile/teacher/banking/TeacherBankingView.tsx`
- [ ] Delete `frontend/views/dashboard/profile/teacher/banking/TeacherBankingEmptyState.tsx`
- [ ] Delete `frontend/views/dashboard/profile/teacher/banking/TeacherBanking.stories.tsx`
- [ ] Update `frontend/views/dashboard/profile/teacher/TeacherProfileContainer.tsx`

### Profile forms

- [ ] Update `frontend/views/dashboard/profile/teacher/sections/CompensationSection.tsx`
- [ ] Update `frontend/views/dashboard/profile/teacher/TeacherAdminEditForm.tsx`
- [ ] Update `frontend/views/dashboard/profile/teacher/teacherProfileFormTypes.ts`
- [ ] Update `frontend/views/dashboard/profile/parent/sections/BillingSection.tsx`
- [ ] Update `frontend/views/dashboard/profile/parent/ParentProfileEditForm.tsx`
- [ ] Update `frontend/views/dashboard/profile/parent/ParentProfileContainer.tsx`
- [ ] Update `frontend/views/dashboard/profile/parent/parentProfileFormTypes.ts`

### Teacher onboarding + profile

- [ ] Delete `frontend/views/dashboard/teachers/onboarding/components/BankingLedgerSection.tsx`
- [ ] Create `frontend/views/dashboard/teachers/onboarding/components/PaymentMethodSection.tsx`
- [ ] Update `frontend/views/dashboard/teachers/onboarding/TeacherOnboardingView.tsx`
- [ ] Update `frontend/views/dashboard/teachers/profile/components/SalaryDetailsSection.tsx`
- [ ] Update `frontend/views/dashboard/teachers/profile/TeacherProfileContainer.tsx`
- [ ] Update `frontend/views/dashboard/teachers/profile/schemas/teacherProfileSchema.ts`
- [ ] Update `frontend/views/dashboard/teachers/own-profile/TeacherOwnProfileContainer.tsx`

### Parent onboarding + profile

- [ ] Update `frontend/views/dashboard/admin/parents/onboarding/FeesContractSection.tsx`
- [ ] Update `frontend/views/dashboard/admin/parents/onboarding/schemas/parentOnboardingSchema.ts`
- [ ] Update `frontend/views/dashboard/admin/parents/onboarding/ParentOnboardingContainer.tsx`
- [ ] Update `frontend/views/dashboard/parent/profile/edit/ParentProfileEditContainer.tsx`
- [ ] Update `frontend/views/dashboard/parent/profile/edit/parentProfileEditSchema.ts`
- [ ] Update `frontend/views/dashboard/parent/profile/ParentProfileDetails.tsx`
- [ ] Update `frontend/views/dashboard/parent/profile/ParentProfileContainer.tsx`

### Hooks + shared types

- [ ] Update `frontend/hooks/useCreateParentOnboarding.ts`
- [ ] Update `frontend/types/shared.types.ts`

### Admin catalog UI (new — composed from existing primitives)

> Mirror `SubjectsContainer`/`SubjectsView`/`SubjectDialogs` (Apollo queries/mutations + dialog state + view layout) and `PermissionCatalogDataGrid` (`AppDataGrid` + `LocalizedStringDisplay` columns). See plan.md [Component reuse map](./plan.md#component-reuse-map).

- [ ] Create `frontend/views/dashboard/admin/payment-catalogs/PaymentCatalogAdminContainer.tsx` — mirror `frontend/views/dashboard/subjects/home/SubjectsContainer.tsx` (Apollo query + mutation hook + dialog state)
- [ ] Create `frontend/views/dashboard/admin/payment-catalogs/PaymentCatalogAdminView.tsx` — compose `PageContainer` + `PageHeader` + MUI `Tabs` over the three per-catalog `*CatalogGrid` components
- [ ] Create `frontend/views/dashboard/admin/payment-catalogs/components/MobileWalletCatalogGrid.tsx` — thin `AppDataGrid<SupportedMobileWallet>` wrapper mirroring `PermissionCatalogDataGrid.tsx`; columns: `LocalizedStringDisplay` (name) + `CountryDisplay` + `CurrencyDisplay` + `StatusBadge(category="paymentMethod", status="active"|"inactive")` + edit/delete row actions
- [ ] Create `frontend/views/dashboard/admin/payment-catalogs/components/PaymentLinkCatalogGrid.tsx` — same pattern; `url_allowlist` column renders as read-only `TagInput` chips
- [ ] Create `frontend/views/dashboard/admin/payment-catalogs/components/OnlineAccountCatalogGrid.tsx` — same pattern; `identifier_kind` column renders as `StatusBadge`
- [ ] Create `frontend/views/dashboard/admin/payment-catalogs/components/CatalogEditDialog.tsx` — compose MUI `Dialog` + `react-hook-form` + `LocalizedStringFormField` (name/description/instructions) + `CurrencySelect`/`CountryAutocomplete` + `TagInput` (url allowlist) + `EntityFormDialogActions` (from `frontend/views/dashboard/subjects/home/components/__shared__/`) + `CatalogImageUpload` (logo)
- [ ] Create `frontend/views/dashboard/admin/payment-catalogs/components/CatalogDeleteDialog.tsx` — thin wrapper over `BaseDeleteDialog` mirroring `DeleteSubjectDialog.tsx`
- [ ] Create `frontend/views/dashboard/admin/payment-catalogs/PaymentCatalogAdmin.stories.tsx` — mirror `SubjectsContainer.stories.tsx`

- [ ] Update `frontend/views/dashboard/profile/core/notifications/notificationPreferenceTypes.ts` — replace `BANKING_DETAILS_CHANGED` with `PAYMENT_METHOD_CHANGED`

- [ ] Update `shared/messages/types/profile.ts`
- [ ] Update `shared/messages/profile.ts`
- [ ] Update `shared/messages/types/dashboard/parents/onboarding.ts`
- [ ] Update `shared/messages/ar/dashboard/parents/onboarding.ts`
- [ ] Update `shared/messages/types/dashboard/teachers/onboarding.ts`
- [ ] Update `shared/messages/types/errors/main.ts`
- [ ] Update `shared/messages/en/errors.ts`
- [ ] Update `shared/messages/ar/errors.ts`

### Stories + tests

- [ ] Update `frontend/views/dashboard/profile/teacher/TeacherProfileView.test.tsx`
- [ ] Update `frontend/views/dashboard/profile/parent/ParentProfileView.test.tsx`
- [ ] Update `frontend/views/dashboard/profile/teacher/TeacherProfileView.stories.tsx`
- [ ] Update `frontend/views/dashboard/profile/parent/ParentProfileView.stories.tsx`
- [ ] Update `frontend/views/dashboard/admin/parents/onboarding/ParentOnboardingView.stories.tsx`
- [ ] Update `frontend/views/dashboard/teachers/onboarding/TeacherOnboardingView.stories.tsx`

## Phase 9 — Verification

- [ ] `bun tsgo`
- [ ] `bun biome:check`
- [ ] Lint queue on all touched files
- [ ] `bun run test:db`
- [ ] `bun run test:graphql`
- [ ] `bun run test:ui:components` (payment method components)
- [ ] `bun quality-gate`
