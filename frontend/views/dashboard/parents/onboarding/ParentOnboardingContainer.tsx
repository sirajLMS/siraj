"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { useParentOnboardingStore } from "@/frontend/stores/mockParentOnboardingStore";
import { logger } from "@/frontend/utils/logger";
import { ParentOnboardingView } from "./ParentOnboardingView";
import { type ParentOnboardingFormData, parentOnboardingSchema } from "./schemas/parentOnboardingSchema";

export function ParentOnboardingContainer() {
  const t = useTranslations("dashboard.parentOnboarding");
  const { data, isSubmitting, setSubmitting, reset } = useParentOnboardingStore();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset: resetForm,
  } = useForm<ParentOnboardingFormData>({
    resolver: zodResolver(parentOnboardingSchema),
    defaultValues: data as ParentOnboardingFormData,
  });

  const onSubmit = async (formData: ParentOnboardingFormData) => {
    setSubmitting(true);
    try {
      logger.info("Submitting parent onboarding form", { formData });
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      logger.info("Parent onboarding form submitted successfully");
      alert(t("actions.successMessage"));
      resetForm();
      reset();
    } catch (error) {
      logger.error("Failed to submit parent onboarding form", { error });
    } finally {
      setSubmitting(false);
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
