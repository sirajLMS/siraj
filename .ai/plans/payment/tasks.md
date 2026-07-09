# Payment Methods Enhancement — Tasks

Check off as completed. See [plan.md](./plan.md) for phase details and [spec.md](./spec.md) for requirements.

## Phase 0 — Planning

- [x] Create `spec.md`
- [x] Create `plan.md`
- [x] Create `tasks.md`

## Phase 1 — Enums + types + validation libs

- [ ] Create `backend/enum/payment-method.enum.ts` (`PaymentMethodType`, `PaymentDirection`, `IdentifierKind`)
- [ ] Update `backend/enum/billing.enum.ts` — deprecate old `PaymentMethod` enum
- [ ] Update `backend/enum/permission.enum.ts` — `PAYMENT_METHODS_MANAGE_CATALOGS`, `PAYMENT_METHODS_VERIFY_BANK_TRANSFER`
- [ ] Update `backend/enum/index.ts`
- [ ] Create `backend/types/payment-method.types.ts` — Select/Insert/Return/Submit + details union
- [ ] Update `backend/types/billing.types.ts` — `PaymentRecordInput` with `userPaymentMethodId`
- [ ] Update `backend/types/teacher.types.ts` — remove banking history types
- [ ] Update `backend/types/parent.types.ts` — remove scalar `paymentMethod`
- [ ] Update `backend/types/profile.types.ts` — replace `bankingSummary` with payment methods
- [ ] Update `backend/types/teacher-onboarding.types.ts`
- [ ] Update `backend/types/index.ts`
- [ ] Create `backend/lib/payment-method.validation.ts` — discriminated Zod
- [ ] Create `frontend/lib/payment-method.ts` — display helpers
- [ ] Gate: `bun tsgo`

## Phase 2 — Schema + migration + seeds

- [ ] Create `backend/db/schema/user-payment-methods.ts`
- [ ] Create `backend/db/schema/supported-mobile-wallets.ts`
- [ ] Create `backend/db/schema/supported-payment-links.ts`
- [ ] Create `backend/db/schema/supported-online-accounts.ts`
- [ ] Update `backend/db/schema/enums.ts` — `paymentMethodTypeEnum`, `paymentDirectionEnum`, `identifierKindEnum`
- [ ] Update `backend/db/schema/teachers.ts` — drop `payment_method`
- [ ] Update `backend/db/schema/parents.ts` — drop `payment_method`
- [ ] Delete `backend/db/schema/teacher-banking.ts`
- [ ] Update `backend/db/schema/billing.ts` — `user_payment_method_id` + `payment_method_type`
- [ ] Update `backend/db/schema/index.ts`
- [ ] Update `backend/db/drizzleRelations.ts`
- [ ] Regenerate Drizzle migrations (8C clean-slate)
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

- [ ] Create `backend/services/payment-method/payment-method.service.ts`
- [ ] Create `backend/services/payment-method/payment-method-mask.ts`
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

- [ ] Create `backend/graphql/pothos/payment-method.pothos.ts`
- [ ] Update `backend/graphql/pothos/enum.pothos.ts`
- [ ] Update `backend/graphql/pothos/profile.pothos.ts`
- [ ] Update `backend/graphql/pothos/staff-profile.pothos.ts`
- [ ] Update `backend/graphql/pothos/parent-profile.pothos.ts`
- [ ] Update `backend/graphql/pothos/parent-onboarding.pothos.ts`
- [ ] Update `backend/graphql/pothos/teacher-portal.pothos.ts`
- [ ] Update `backend/graphql/pothos/teacher-onboarding.pothos.ts`
- [ ] Update `backend/enum/notificationDeliveries.enum.ts` — `PAYMENT_METHOD_CHANGED`
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

## Phase 7 — UI components + i18n

- [ ] Create `frontend/components/ui/input/PaymentMethodSelect.tsx`
- [ ] Create `frontend/components/ui/input/PaymentMethodTypeFields.tsx`
- [ ] Create `frontend/components/ui/input/PaymentMethodDefaultsEditor.tsx`
- [ ] Create `frontend/components/ui/input/PaymentMethodSelect.stories.tsx`
- [ ] Create `frontend/components/ui/display/PaymentMethodDisplay.tsx`
- [ ] Create `frontend/components/ui/display/PaymentMethodList.tsx`
- [ ] Create `frontend/components/ui/display/PaymentMethodDisplay.stories.tsx`
- [ ] Update `frontend/components/ui/input/index.ts`
- [ ] Update `frontend/components/ui/display/index.ts`
- [ ] Create `shared/messages/types/ui/payment-method.ts`
- [ ] Create `shared/messages/ar/ui/payment-method.ts`
- [ ] Update `shared/messages/en.ts`
- [ ] Update `shared/messages/types/ui/index.ts`
- [ ] Update `shared/messages/ar/ui/index.ts`

## Phase 8 — View usages + admin catalog UI

### Teacher payment methods (replace banking tab)

- [ ] Create `frontend/views/dashboard/profile/teacher/payment-methods/PaymentMethodsTab.tsx`
- [ ] Create `frontend/views/dashboard/profile/teacher/payment-methods/PaymentMethodsView.tsx`
- [ ] Create `frontend/views/dashboard/profile/teacher/payment-methods/PaymentMethods.stories.tsx`
- [ ] Update `frontend/views/dashboard/profile/core/profileTabs.ts`
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

- [ ] Replace `frontend/views/dashboard/teachers/onboarding/components/BankingLedgerSection.tsx` → `PaymentMethodSection.tsx`
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

### Admin catalog UI (new)

- [ ] Create `frontend/views/dashboard/admin/payment-catalogs/PaymentCatalogAdminContainer.tsx`
- [ ] Create `frontend/views/dashboard/admin/payment-catalogs/PaymentCatalogAdminView.tsx`
- [ ] Create `frontend/views/dashboard/admin/payment-catalogs/components/MobileWalletCatalogGrid.tsx`
- [ ] Create `frontend/views/dashboard/admin/payment-catalogs/components/PaymentLinkCatalogGrid.tsx`
- [ ] Create `frontend/views/dashboard/admin/payment-catalogs/components/OnlineAccountCatalogGrid.tsx`
- [ ] Create `frontend/views/dashboard/admin/payment-catalogs/components/CatalogEditDialog.tsx`
- [ ] Create `frontend/views/dashboard/admin/payment-catalogs/PaymentCatalogAdmin.stories.tsx`

### i18n cleanup

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
