"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useOnboardingAvatar } from "@/frontend/common/components/onboarding/hooks/useOnboardingAvatar";
import { useOnboardingSubmit } from "@/frontend/common/components/onboarding/hooks/useOnboardingSubmit";
import { CurrencyCode, ManagerAccountType } from "@/frontend/common/graphql/generated/gql/graphql";
import { useCreateManagerOnboarding } from "@/frontend/common/hooks/useCreateManagerOnboarding";
import type { ManagerOnboardingFormData } from "@/frontend/common/types/shared.types";
import { managerOnboardingSchema } from "@/frontend/common/views/dashboard/staff/onboarding/schemas/managerOnboardingSchema";
import type { ManagerOnboardingViewProps } from "@/frontend/common/views/dashboard/staff/onboarding/types";
import { useOnboardingMetrics } from "@/frontend/common/views/dashboard/staff/onboarding/useOnboardingMetrics";
import { IanaTimezone } from "@/shared/constants/iana-timezone.enum";
import { useRouter } from "@/shared/i18n/navigation";
import { Translation, useAppTranslation } from "@/shared/locale";

const defaultValues: ManagerOnboardingFormData = {
  name: "",
  email: "",
  avatarUrl: undefined,
  phone: "",
  timezone: IanaTimezone.Africa_Cairo,
  displayCurrency: CurrencyCode.Usd,
  accountType: ManagerAccountType.Manager,
  password: "",
};

export type ManagerOnboardingContainerViewModel = ManagerOnboardingViewProps;

export type UseManagerOnboardingContainerViewModelProps = Record<string, never>;

export function useManagerOnboardingContainerViewModel(
  _props: Readonly<UseManagerOnboardingContainerViewModelProps>
): ManagerOnboardingContainerViewModel {
  const labels = useAppTranslation(Translation.Dashboard.StaffOnboarding);
  const router = useRouter();
  const { execute, loading } = useCreateManagerOnboarding();
  const metricsModel = useOnboardingMetrics();
  const { onUploadAvatar } = useOnboardingAvatar();

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

  const {
    isSubmitting,
    showSuccess: showSuccessState,
    submitError,
    onSubmit,
    onDismissSuccess,
    onDismissError,
  } = useOnboardingSubmit<ManagerOnboardingFormData, { userId: string }>({
    execute: async data => {
      await execute(data);
      return { userId: "" }; // execute doesn't return userId, but we need to satisfy the return type
    },
    onSuccess: () => "/staff",
    successAutoDismissMs: 3000,
    resetForm,
    onError: () => labels.actions.errorMessage,
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
    submitError,
    onSubmit,
    onCancel,
    onDismissSuccess,
    onDismissError,
    metricsModel,
    onUploadAvatar,
  };
}
