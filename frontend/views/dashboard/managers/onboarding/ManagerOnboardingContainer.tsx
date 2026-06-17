"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useManagerOnboardingStore } from "@/frontend/stores/mockManagerOnboardingStore";
import { logger } from "@/frontend/utils/logger";
import { useRouter } from "@/shared/i18n/routing";
import { ManagerOnboardingView } from "./ManagerOnboardingView";
import { type ManagerOnboardingFormData, managerOnboardingSchema } from "./schemas/managerOnboardingSchema";

export function ManagerOnboardingContainer() {
  const router = useRouter();
  const { data, isSubmitting, setSubmitting, reset } = useManagerOnboardingStore();
  const [showSuccess, setShowSuccess] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
    reset: resetForm,
  } = useForm<ManagerOnboardingFormData>({
    resolver: zodResolver(managerOnboardingSchema),
    defaultValues: data,
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
    setSubmitting(true);
    try {
      logger.info("Submitting manager onboarding form", { formData });
      await new Promise(resolve => setTimeout(resolve, 1500));
      logger.info("Manager onboarding form submitted successfully");
      setShowSuccess(true);
      resetForm();
      reset();
    } catch (error) {
      logger.error("Failed to submit manager onboarding form", { error });
    } finally {
      setSubmitting(false);
    }
  };

  const onCancel = () => {
    router.push("/managers");
  };

  return (
    <ManagerOnboardingView
      register={register}
      control={control}
      errors={errors}
      handleSubmit={handleSubmit}
      isSubmitting={isSubmitting}
      showSuccess={showSuccess}
      onSubmit={onSubmit}
      onCancel={onCancel}
      onDismissSuccess={() => {
        setShowSuccess(false);
      }}
    />
  );
}
