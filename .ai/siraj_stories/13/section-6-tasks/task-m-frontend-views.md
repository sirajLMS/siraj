### Task M — Frontend Views: Real Data Integration & RBAC Enforcement for Onboarding

**Objective:** Replace mock store imports in production onboarding containers with real Apollo `useMutation` hooks from new stores. Add RBAC gates via `<RequirePermission>`. Replace `alert()` with MUI `Snackbar`. Wire form submissions to real GraphQL mutations.

**Dependencies:** Task L — real stores are implemented with `useMutation` hooks. Task J — stories are migrated to `MockedProvider`. Task K — i18n translations verified.

**Layer-Specific Rules (Frontend Views - Flattened from frontend/views/AGENTS.md):**
- Functional Components only.
- Access Control: Use `<RequirePermission permissions={["domain.action"]} />` to gate components.
- Data Fetching: Use Apollo `useMutation` with generated TypedDocumentNodes.
- NO hardcoded colors — all from theme palette.
- MUI breaking changes: Typography style props via `sx` only. Stack layout props in `sx`.
- **Mock Data Ban**: Mock data is strictly forbidden in production. Migrate to real components. (`*.stories.tsx` MUST KEEP dummy data).
- Dashboard UI Patterns: Use `PageContainer`, `PageHeader`, `SectionPanel`, `Snackbar` from `@/frontend/components/ui`.

**Target Files:**
- `frontend/views/dashboard/teachers/onboarding/TeacherOnboardingContainer.tsx` — Replace mock store with real mutation
- `frontend/views/dashboard/parents/onboarding/ParentOnboardingContainer.tsx` — Replace mock store with real mutation
- `frontend/views/dashboard/managers/onboarding/ManagerOnboardingContainer.tsx` — Replace mock store with real mutation

**Detailed Implementation Steps:**

*Step 1: Update Teacher Onboarding Container*

Replace `frontend/views/dashboard/teachers/onboarding/TeacherOnboardingContainer.tsx`:

```typescript
"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { useRouter } from "@/shared/i18n/routing";
import { RequirePermission } from "@/frontend/components/auth/RequirePermission";
import { useCreateTeacherMutation } from "@/frontend/stores/teacherOnboardingStore";
import { logger } from "@/frontend/utils/logger";
import { AppPermission } from "@/shared/lib/enum";
import type { TeacherOnboardingFormData } from "./types";
import { TeacherOnboardingView } from "./TeacherOnboardingView";

export function TeacherOnboardingContainer() {
  const t = useTranslations("dashboard.teacherOnboarding");
  const router = useRouter();
  const { execute, loading } = useCreateTeacherMutation();
  const [showSuccess, setShowSuccess] = useState(false);

  const labels = {
    pageTitle: t("pageTitle"),
    pageSubtitle: t("pageSubtitle"),
    mandatoryFields: t("mandatoryFields"),
    sections: {
      teacherInfo: t("sections.teacherInfo"),
      officialDetails: t("sections.officialDetails"),
      salaryDetails: t("sections.salaryDetails"),
      bankingLedger: t("sections.bankingLedger"),
    },
    fields: {
      fullName: t("fields.fullName"),
      email: t("fields.email"),
      nationality: t("fields.nationality"),
      nationalId: t("fields.nationalId"),
      phone: t("fields.phone"),
      age: t("fields.age"),
      gender: t("fields.gender"),
      male: t("fields.male"),
      female: t("fields.female"),
      address: t("fields.address"),
      qualifications: t("fields.qualifications"),
      skypeId: t("fields.skypeId"),
      zoomLink: t("fields.zoomLink"),
      country: t("fields.country"),
      zoomUsername: t("fields.zoomUsername"),
      zoomPassword: t("fields.zoomPassword"),
      timezone: t("fields.timezone"),
      salaryAmount: t("fields.salaryAmount"),
      currency: t("fields.currency"),
      beneficiaryName: t("fields.beneficiaryName"),
      bankName: t("fields.bankName"),
      accountNumber: t("fields.accountNumber"),
      routingNumber: t("fields.routingNumber"),
      swiftBic: t("fields.swiftBic"),
      iban: t("fields.iban"),
    },
    placeholders: {
      fullName: t("placeholders.fullName"),
      email: t("placeholders.email"),
      nationality: t("placeholders.nationality"),
      nationalId: t("placeholders.nationalId"),
      phone: t("placeholders.phone"),
      age: t("placeholders.age"),
      address: t("placeholders.address"),
      qualifications: t("placeholders.qualifications"),
      skypeId: t("placeholders.skypeId"),
      zoomLink: t("placeholders.zoomLink"),
      zoomUsername: t("placeholders.zoomUsername"),
      zoomPassword: t("placeholders.zoomPassword"),
      salaryAmount: t("placeholders.salaryAmount"),
      beneficiaryName: t("placeholders.beneficiaryName"),
      bankName: t("placeholders.bankName"),
      accountNumber: t("placeholders.accountNumber"),
      routingNumber: t("placeholders.routingNumber"),
      swiftBic: t("placeholders.swiftBic"),
      iban: t("placeholders.iban"),
    },
    actions: {
      signup: t("actions.signup"),
      cancel: t("actions.cancel"),
      proceeding: t("actions.proceeding"),
      successMessage: t("actions.successMessage"),
    },
    validation: {
      fullNameRequired: t("validation.fullNameRequired"),
      emailRequired: t("validation.emailRequired"),
      emailInvalid: t("validation.emailInvalid"),
      nationalIdRequired: t("validation.nationalIdRequired"),
      phoneRequired: t("validation.phoneRequired"),
      genderRequired: t("validation.genderRequired"),
      countryRequired: t("validation.countryRequired"),
      timezoneRequired: t("validation.timezoneRequired"),
      salaryAmountRequired: t("validation.salaryAmountRequired"),
      currencyRequired: t("validation.currencyRequired"),
      beneficiaryNameRequired: t("validation.beneficiaryNameRequired"),
      bankNameRequired: t("validation.bankNameRequired"),
      accountNumberRequired: t("validation.accountNumberRequired"),
      ibanRequired: t("validation.ibanRequired"),
      urlInvalid: t("validation.urlInvalid"),
    },
  };

  const handleSubmit = async (data: TeacherOnboardingFormData) => {
    try {
      await execute(data);
      setShowSuccess(true);
      logger.info("Teacher onboarding successful");
    } catch (error) {
      logger.error("Teacher onboarding failed", { error });
    }
  };

  return (
    <RequirePermission permissions={[AppPermission.STAFF_CREATE_TEACHER]}>
      <TeacherOnboardingView
        isSubmitting={loading}
        showSuccess={showSuccess}
        labels={labels}
        onSubmit={handleSubmit}
        onDismissSuccess={() => setShowSuccess(false)}
      />
    </RequirePermission>
  );
}
```

*Step 2: Update Parent Onboarding Container*

Replace `frontend/views/dashboard/parents/onboarding/ParentOnboardingContainer.tsx`:

```typescript
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { RequirePermission } from "@/frontend/components/auth/RequirePermission";
import { useCreateParentMutation } from "@/frontend/stores/parentOnboardingStore";
import { logger } from "@/frontend/utils/logger";
import { AppPermission } from "@/shared/lib/enum";
import { ParentOnboardingView } from "./ParentOnboardingView";
import { type ParentOnboardingFormData, parentOnboardingSchema } from "./schemas/parentOnboardingSchema";

export function ParentOnboardingContainer() {
  const t = useTranslations("dashboard.parentOnboarding");
  const { execute, loading } = useCreateParentMutation();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset: resetForm,
  } = useForm<ParentOnboardingFormData>({
    resolver: zodResolver(parentOnboardingSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      nationality: "",
      address: "",
      whatsapp: "",
      facebook: "",
      twitter: "",
      skype: "",
      zoomId: "",
      invoiceType: "",
      feeAmount: "",
      paymentMethod: "",
      currency: "USD",
    },
  });

  const onSubmit = async (formData: ParentOnboardingFormData) => {
    try {
      await execute(formData);
      resetForm();
      logger.info("Parent onboarding successful");
    } catch (error) {
      logger.error("Parent onboarding failed", { error });
    }
  };

  return (
    <RequirePermission permissions={[AppPermission.PARENT_CREATE_ACCOUNT]}>
      <ParentOnboardingView
        register={register}
        errors={errors}
        handleSubmit={handleSubmit}
        isSubmitting={loading}
        onSubmit={onSubmit}
      />
    </RequirePermission>
  );
}
```

*Step 3: Update Manager Onboarding Container*

Replace `frontend/views/dashboard/managers/onboarding/ManagerOnboardingContainer.tsx`:

```typescript
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "@/shared/i18n/routing";
import { RequirePermission } from "@/frontend/components/auth/RequirePermission";
import { useCreateManagerMutation } from "@/frontend/stores/managerOnboardingStore";
import { logger } from "@/frontend/utils/logger";
import { AppPermission } from "@/shared/lib/enum";
import { ManagerOnboardingView } from "./ManagerOnboardingView";
import { type ManagerOnboardingFormData, managerOnboardingSchema } from "./schemas/managerOnboardingSchema";

export function ManagerOnboardingContainer() {
  const router = useRouter();
  const { execute, loading } = useCreateManagerMutation();
  const [showSuccess, setShowSuccess] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
    reset: resetForm,
  } = useForm<ManagerOnboardingFormData>({
    resolver: zodResolver(managerOnboardingSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      skypeId: "",
      accountType: "manager",
      department: "academic",
    },
  });

  useEffect(() => {
    if (!showSuccess) return undefined;
    const timer = setTimeout(() => {
      setShowSuccess(false);
    }, 3000);
    return () => {
      clearTimeout(timer);
    };
  }, [showSuccess]);

  const onSubmit = async (formData: ManagerOnboardingFormData) => {
    try {
      await execute(formData);
      setShowSuccess(true);
      resetForm();
      logger.info("Manager onboarding successful");
    } catch (error) {
      logger.error("Manager onboarding failed", { error });
    }
  };

  const onCancel = () => {
    router.push("/managers");
  };

  return (
    <RequirePermission permissions={[AppPermission.MANAGER_CREATE_ACCOUNT]}>
      <ManagerOnboardingView
        register={register}
        control={control}
        errors={errors}
        handleSubmit={handleSubmit}
        isSubmitting={loading}
        showSuccess={showSuccess}
        onSubmit={onSubmit}
        onCancel={onCancel}
        onDismissSuccess={() => setShowSuccess(false)}
      />
    </RequirePermission>
  );
}
```

*Step 4: Verify no mock store imports remain in production files*

Run the following verification:

```bash
rg "mock.*Onboarding.*Store" frontend/views --glob "!**/*.stories.tsx"
```

Expected result: No matches. All mock store imports should only exist in `*.stories.tsx` files.

*Step 5: Verify no `alert()` calls remain*

```bash
rg "alert\(" frontend/views/dashboard/teachers/onboarding frontend/views/dashboard/parents/onboarding frontend/views/dashboard/managers/onboarding
```

Expected result: No matches. All `alert()` calls should be replaced with MUI `Snackbar` or the existing success UI.

**Test Execution Requirements:**
- Run UI component tests:
  ```bash
  bun run test:ui:components
  ```
- Run GraphQL tests:
  ```bash
  bun run test:graphql
  ```
- Verify TypeScript compilation:
  ```bash
  bun tsgo
  ```

**Success Criteria / Check Progress Points:**
- [ ] Teacher container uses `useCreateTeacherMutation` from real store
- [ ] Parent container uses `useCreateParentMutation` from real store
- [ ] Manager container uses `useCreateManagerMutation` from real store
- [ ] All containers wrap content in `<RequirePermission>` with correct permission key
- [ ] All containers use `logger.info` / `logger.error` for logging (no `console.log`)
- [ ] No `alert()` calls remain in parent container (replaced with Snackbar or existing success UI)
- [ ] No mock store imports in production files
- [ ] No `any` or blind casts in modified components
- [ ] `bun run test:graphql` passes with zero failures
- [ ] `bun tsgo` passes with zero TypeScript errors

**Quality Gate — Per-File Validation:**
- [ ] `bun tsgo` on working files passes with 0 TypeScript errors & 0 warnings, after creating/modifying a single file
- [ ] `bun biome:check` on working files passes with 0 errors & 0 warnings, after creating/modifying a single file
- [ ] `bun lint` on working files passes with 0 errors & 0 warnings, after creating/modifying a single file
- [ ] `bun codescene` on working files passes with 0 errors & 0 warnings, after creating/modifying a single file
- [ ] `loop over tsgo, biome:check, lint, codescene` on working files till no issues at all, after creating/modifying a single file

**Quality Gate — Task Completion Validation:**
- [ ] `bun tsgo` on working files passes with 0 TypeScript errors & 0 warnings, after completing all steps
- [ ] `bun biome:check` on working files passes with 0 errors & 0 warnings, after completing all steps
- [ ] `bun lint` on working files passes with 0 errors & 0 warnings, after completing all steps
- [ ] `bun codescene` on working files passes with 0 errors & 0 warnings, after completing all steps
- [ ] `loop over tsgo, biome:check, lint, codescene` on working files till no issues at all, after completing all steps
