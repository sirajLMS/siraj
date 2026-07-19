"use client";

import type { ManagerOnboardingViewProps } from "@/frontend/common/views/dashboard/managers/onboarding/types";

export interface ManagerOnboardingViewModel {
  readonly register: ManagerOnboardingViewProps["register"];
  readonly control: ManagerOnboardingViewProps["control"];
  readonly errors: ManagerOnboardingViewProps["errors"];
  readonly handleSubmit: ManagerOnboardingViewProps["handleSubmit"];
  readonly isSubmitting: ManagerOnboardingViewProps["isSubmitting"];
  readonly showSuccess: ManagerOnboardingViewProps["showSuccess"];
  readonly onSubmit: ManagerOnboardingViewProps["onSubmit"];
  readonly onCancel: ManagerOnboardingViewProps["onCancel"];
  readonly onDismissSuccess: ManagerOnboardingViewProps["onDismissSuccess"];
  readonly metricsModel: ManagerOnboardingViewProps["metricsModel"];
  readonly onUploadAvatar: (file: File) => Promise<{ url: string }>;
}

export type UseManagerOnboardingViewModelProps = ManagerOnboardingViewModel;

export function useManagerOnboardingViewModel(
  props: Readonly<UseManagerOnboardingViewModelProps>
): ManagerOnboardingViewModel {
  return props;
}
