"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { useCreateParentMutation, useParentOnboardingStore } from "@/frontend/stores/parentOnboardingStore";
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
  skype: "",
  defaultZoomLink: "",
  invoiceType: InvoiceType.Monthly,
  feeAmount: "",
  paymentMethod: PaymentMethod.Paypal,
  currency: "USD",
};

export function ParentOnboardingContainer() {
  const t = useTranslations("dashboard.parentOnboarding");
  const { isSubmitting, reset } = useParentOnboardingStore();
  const { execute } = useCreateParentMutation();

  const {
    register,
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
      alert(t("actions.successMessage"));
      resetForm();
      reset();
    } catch (error) {
      logger.error("Failed to submit parent onboarding form", { error });
    }
  };

  return (
    <ParentOnboardingView
      register={register}
      errors={errors}
      handleSubmit={handleSubmit}
      isSubmitting={isSubmitting}
      onSubmit={onSubmit}
    />
  );
}
