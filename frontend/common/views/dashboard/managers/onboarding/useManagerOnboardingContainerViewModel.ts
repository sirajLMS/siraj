"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useCreateManagerOnboarding } from "@/frontend/common/hooks/useCreateManagerOnboarding";
import { logger } from "@/frontend/common/utils/logger";
import {
  type ManagerOnboardingFormData,
  managerOnboardingSchema,
} from "@/frontend/common/views/dashboard/managers/onboarding/schemas/managerOnboardingSchema";
import { ManagerAccountType } from "@/frontend/common/views/dashboard/managers/onboarding/types";
import { useRouter } from "@/shared/i18n/routing";

const defaultValues: ManagerOnboardingFormData = {
  name: "",
  email: "",
  phone: "",
  accountType: ManagerAccountType.Manager,
  password: "",
};

export interface ManagerOnboardingContainerViewModel {
  readonly register: ReturnType<typeof useForm<ManagerOnboardingFormData>>["register"];
  readonly control: ReturnType<typeof useForm<ManagerOnboardingFormData>>["control"];
  readonly errors: ReturnType<typeof useForm<ManagerOnboardingFormData>>["formState"]["errors"];
  readonly handleSubmit: ReturnType<typeof useForm<ManagerOnboardingFormData>>["handleSubmit"];
  readonly isSubmitting: boolean;
  readonly showSuccess: boolean;
  readonly onSubmit: (data: ManagerOnboardingFormData) => void | Promise<void>;
  readonly onCancel: () => void;
  readonly onDismissSuccess: () => void;
}

export type UseManagerOnboardingContainerViewModelProps = {};

export function useManagerOnboardingContainerViewModel(
  _props: Readonly<UseManagerOnboardingContainerViewModelProps>
): ManagerOnboardingContainerViewModel {
  const router = useRouter();
  const { execute, loading } = useCreateManagerOnboarding();
  const [showSuccess, setShowSuccess] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
    reset: resetForm,
  } = useForm<ManagerOnboardingFormData>({
    resolver: zodResolver(managerOnboardingSchema),
    defaultValues,
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
      logger.info("Submitting manager onboarding form", { formData });
      await execute(formData);
      logger.info("Manager onboarding form submitted successfully");
      setShowSuccess(true);
      resetForm();
      router.push("/managers");
    } catch (error) {
      logger.error("Failed to submit manager onboarding form", { error });
    }
  };

  const onCancel = () => {
    router.push("/managers");
  };

  return {
    register,
    control,
    errors,
    handleSubmit,
    isSubmitting: loading,
    showSuccess,
    onSubmit,
    onCancel,
    onDismissSuccess: () => setShowSuccess(false),
  };
}
