"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useOnboardingAvatar } from "@/frontend/common/components/onboarding/hooks/useOnboardingAvatar";
import { useOnboardingSubmit } from "@/frontend/common/components/onboarding/hooks/useOnboardingSubmit";
import { ManagerAccountType } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { useCreateManagerOnboarding } from "@/frontend/common/hooks/useCreateManagerOnboarding";
import type { ManagerOnboardingFormData } from "@/frontend/common/types/shared.types";
import { managerOnboardingSchema } from "@/frontend/common/views/dashboard/staff/onboarding/schemas/managerOnboardingSchema";
import type { OnboardingMetricsViewModel } from "@/frontend/common/views/dashboard/staff/onboarding/useOnboardingMetrics";
import { useOnboardingMetrics } from "@/frontend/common/views/dashboard/staff/onboarding/useOnboardingMetrics";
import { useRouter } from "@/shared/i18n/navigation";
import { type StaffOnboardingLabels, Translation, useAppTranslation } from "@/shared/locale";

const defaultValues: ManagerOnboardingFormData = {
  name: "",
  email: "",
  avatarUrl: undefined,
  phone: "",
  accountType: ManagerAccountType.Manager,
  password: "",
};

export interface ManagerOnboardingContainerViewModel {
  readonly labels: StaffOnboardingLabels;
  readonly register: ReturnType<typeof useForm<ManagerOnboardingFormData>>["register"];
  readonly control: ReturnType<typeof useForm<ManagerOnboardingFormData>>["control"];
  readonly errors: ReturnType<typeof useForm<ManagerOnboardingFormData>>["formState"]["errors"];
  readonly handleSubmit: ReturnType<typeof useForm<ManagerOnboardingFormData>>["handleSubmit"];
  readonly isSubmitting: boolean;
  readonly showSuccess: boolean;
  readonly onSubmit: (data: ManagerOnboardingFormData) => void | Promise<void>;
  readonly onCancel: () => void;
  readonly onDismissSuccess: () => void;
  // NEW FOR PLAN v5: metricsModel exposed by the Container VM so the tier views no longer call `useOnboardingMetrics` directly (was a GraphQL-in-tier violation per specs §3 N1 / §6.2).
  readonly metricsModel: OnboardingMetricsViewModel;
  readonly onUploadAvatar: (file: File) => Promise<{ url: string }>;
}

export type UseManagerOnboardingContainerViewModelProps = Record<string, never>;

export function useManagerOnboardingContainerViewModel(
  _props: Readonly<UseManagerOnboardingContainerViewModelProps>
): ManagerOnboardingContainerViewModel {
  const labels = useAppTranslation(Translation.Dashboard.StaffOnboarding);
  const router = useRouter();
  const { execute, loading } = useCreateManagerOnboarding();
  const metricsModel = useOnboardingMetrics();
  const { onUploadAvatar } = useOnboardingAvatar();

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

  const {
    isSubmitting,
    showSuccess: showSuccessState,
    onSubmit,
    onDismissSuccess,
  } = useOnboardingSubmit<ManagerOnboardingFormData, { userId: string }>({
    execute: async data => {
      await execute(data);
      return { userId: "" }; // execute doesn't return userId, but we need to satisfy the return type
    },
    onSuccess: () => "/staff",
    successAutoDismissMs: 3000,
    resetForm,
  });

  const onCancel = () => {
    router.push("/staff");
  };

  return {
    labels,
    register,
    control,
    errors,
    handleSubmit,
    isSubmitting: loading || isSubmitting,
    showSuccess: showSuccessState,
    onSubmit,
    onCancel,
    onDismissSuccess,
    metricsModel,
    onUploadAvatar,
  };
}
