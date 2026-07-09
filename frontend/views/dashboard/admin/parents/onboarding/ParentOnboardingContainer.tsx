"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { RequirePermission } from "@/frontend/components/auth/RequirePermission";
import { FormSuccessSnackbar } from "@/frontend/components/ui";
import { AppPermission, IanaTimezone } from "@/frontend/graphql/generated/gql/graphql-types";
import { useCreateParentOnboarding } from "@/frontend/hooks/useCreateParentOnboarding";
import { logger } from "@/frontend/utils/logger";
import { ParentOnboardingView } from "./ParentOnboardingView";
import { type ParentOnboardingFormData, parentOnboardingSchema } from "./schemas/parentOnboardingSchema";

import { InvoiceType, PaymentMethod } from "./types";

const defaultValues: ParentOnboardingFormData = {
  name: "",
  email: "",
  phone: "",
  nationality: "",
  address: "",
  whatsapp: "",
  facebook: "",
  twitter: "",
  defaultZoomLink: "",
  invoiceType: InvoiceType.Monthly,
  feeAmount: "",
  paymentMethod: PaymentMethod.Paypal,
  currency: "USD",
  timezone: IanaTimezone.AfricaCairo,
};

export function ParentOnboardingContainer() {
  const t = useTranslations("dashboard.parentOnboarding");
  const { execute, loading } = useCreateParentOnboarding();
  const [showSuccess, setShowSuccess] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
    reset: resetForm,
  } = useForm<ParentOnboardingFormData>({
    resolver: zodResolver(parentOnboardingSchema),
    defaultValues,
  });

  const onSubmit = async (formData: ParentOnboardingFormData) => {
    try {
      logger.info("Submitting parent onboarding form", { formData });
      await execute(formData);
      logger.info("Parent onboarding form submitted successfully");
      setShowSuccess(true);
      resetForm();
    } catch (error) {
      logger.error("Failed to submit parent onboarding form", { error });
    }
  };

  return (
    <RequirePermission permissions={[AppPermission.ParentsCreate]}>
      <ParentOnboardingView
        register={register}
        control={control}
        errors={errors}
        handleSubmit={handleSubmit}
        isSubmitting={loading}
        onSubmit={onSubmit}
      />
      <FormSuccessSnackbar
        open={showSuccess}
        message={t("actions.successMessage")}
        onClose={() => setShowSuccess(false)}
      />
    </RequirePermission>
  );
}
