"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { ManagerAccountType } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { useAvatarUpload } from "@/frontend/common/hooks/useAvatarUpload";
import { useCreateManagerOnboarding } from "@/frontend/common/hooks/useCreateManagerOnboarding";
import type { ManagerOnboardingFormData } from "@/frontend/common/types/shared.types";
import { logger } from "@/frontend/common/utils/logger";
import { managerOnboardingSchema } from "@/frontend/common/views/dashboard/managers/onboarding/schemas/managerOnboardingSchema";
import type { OnboardingMetricsViewModel } from "@/frontend/common/views/dashboard/managers/onboarding/useOnboardingMetrics";
import { useOnboardingMetrics } from "@/frontend/common/views/dashboard/managers/onboarding/useOnboardingMetrics";
import { useRouter } from "@/shared/i18n/navigation";

const defaultValues: ManagerOnboardingFormData = {
  name: "",
  email: "",
  avatarUrl: undefined,
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
  // NEW FOR PLAN v5: metricsModel exposed by the Container VM so the tier views no longer call `useOnboardingMetrics` directly (was a GraphQL-in-tier violation per specs §3 N1 / §6.2).
  readonly metricsModel: OnboardingMetricsViewModel;
  readonly onUploadAvatar: (file: File) => Promise<{ url: string }>;
}

export type UseManagerOnboardingContainerViewModelProps = Record<string, never>;

export function useManagerOnboardingContainerViewModel(
  _props: Readonly<UseManagerOnboardingContainerViewModelProps>
): ManagerOnboardingContainerViewModel {
  const router = useRouter();
  const { execute, loading } = useCreateManagerOnboarding();
  const [showSuccess, setShowSuccess] = useState(false);
  const metricsModel = useOnboardingMetrics();
  // Lazy initializer: generate the pending-avatar storage key once per hook
  // instance. Using useState with a lazy initializer (instead of useRef) avoids
  // reading ref.current during render (which trips `react-hooks/refs`).
  const [pendingAvatarKey] = useState(() => `pending-${crypto.randomUUID()}`);
  const { onUploadAvatar } = useAvatarUpload({ storageOwnerKey: pendingAvatarKey });

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
    metricsModel,
    onUploadAvatar,
  };
}
