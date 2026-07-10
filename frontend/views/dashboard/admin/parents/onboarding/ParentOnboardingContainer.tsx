"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { RequirePermission } from "@/frontend/components/auth/RequirePermission";
import { FormSuccessSnackbar } from "@/frontend/components/ui";
import { AppPermission, CurrencyCode, IanaTimezone } from "@/frontend/graphql/generated/gql/graphql-types";
import { useCreateParentOnboarding } from "@/frontend/hooks/useCreateParentOnboarding";
import { logger } from "@/frontend/utils/logger";
import { ParentOnboardingView } from "@/frontend/views/dashboard/admin/parents/onboarding/ParentOnboardingView";
import {
  type ParentOnboardingFormData,
  parentOnboardingSchema,
} from "@/frontend/views/dashboard/admin/parents/onboarding/schemas/parentOnboardingSchema";

import { InvoiceType, PaymentMethodType } from "@/frontend/views/dashboard/admin/parents/onboarding/types";

const defaultValues: ParentOnboardingFormData = {
  name: "",
  email: "",
  phone: "",
  nationality: "",
  address: "",
  whatsapp: "",
  facebook: "",
  twitter: "",
  invoiceType: InvoiceType.Monthly,
  feeAmount: "",
  payinMethod: {
    type: PaymentMethodType.BankTransfer,
    label: "",
    details: {},
  },
  currency: CurrencyCode.Usd,
  timezone: IanaTimezone.AfricaCairo,
  meetingProvider: null,
  meetingUrl: "",
  meetingLabel: "",
};

export function ParentOnboardingContainer() {
  const t = useTranslations("dashboard.parentOnboarding");
  const { execute, loading } = useCreateParentOnboarding();
  const [showSuccess, setShowSuccess] = useState(false);

  const form = useForm<ParentOnboardingFormData>({
    resolver: zodResolver(parentOnboardingSchema),
    defaultValues,
  });

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
    reset: resetForm,
  } = form;

  const onSubmit = async (formData: ParentOnboardingFormData) => {
    try {
      logger.info("Submitting parent onboarding form", { formData });
      await execute(formData);
      logger.info("Parent onboarding form submitted successfully");
      setShowSuccess(true);
      resetForm(defaultValues);
    } catch (error) {
      logger.error("Failed to submit parent onboarding form", { error });
    }
  };

  return (
    <RequirePermission permissions={[AppPermission.ParentsCreate]}>
      <FormProvider {...form}>
        <ParentOnboardingView
          register={register}
          control={control}
          errors={errors}
          handleSubmit={handleSubmit}
          isSubmitting={loading}
          onSubmit={onSubmit}
        />
      </FormProvider>
      <FormSuccessSnackbar
        open={showSuccess}
        message={t("actions.successMessage")}
        onClose={() => setShowSuccess(false)}
      />
    </RequirePermission>
  );
}
