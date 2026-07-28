import type { Control, FieldErrors, UseFormHandleSubmit, UseFormRegister } from "react-hook-form";
import type { ManagerOnboardingFormData } from "@/frontend/common/types/shared.types";
import type { OnboardingMetricsViewModel } from "@/frontend/common/views/dashboard/staff/onboarding/useOnboardingMetrics";
import type { StaffOnboardingLabels } from "@/shared/locale";

export type ManagerOnboardingViewProps = {
  readonly labels: StaffOnboardingLabels;
  readonly register: UseFormRegister<ManagerOnboardingFormData>;
  readonly control: Control<ManagerOnboardingFormData>;
  readonly errors: FieldErrors<ManagerOnboardingFormData>;
  readonly handleSubmit: UseFormHandleSubmit<ManagerOnboardingFormData>;
  readonly isSubmitting: boolean;
  readonly showSuccess: boolean;
  readonly onSubmit: (data: ManagerOnboardingFormData) => void | Promise<void>;
  readonly onCancel: () => void;
  readonly onDismissSuccess: () => void;
  readonly metricsModel: OnboardingMetricsViewModel;
  readonly onUploadAvatar: (file: File) => Promise<{ url: string }>;
};

// NEW FOR PLAN v5: lifted onboarding metrics overview props (was duplicated as `OnboardingMetricsOverviewMobileProps`/`DesktopProps` paired interfaces in tier — Class A PASS-THROUGH ALIAS removed per specs §4.1).
export interface OnboardingMetricsOverviewProps {
  readonly labels: StaffOnboardingLabels["metrics"];
  readonly model: OnboardingMetricsViewModel;
}
