"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useEffect, useState } from "react";
import type { Control, FieldErrors, UseFormHandleSubmit, UseFormRegister, UseFormReturn } from "react-hook-form";
import { FormProvider, useForm } from "react-hook-form";
import { CurrencyCode, IanaTimezone, PaymentMethodType } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { useCreateTeacherOnboarding } from "@/frontend/common/hooks/useCreateTeacherOnboarding";
import { useTeacherOnboardingStore } from "@/frontend/common/stores/teacherOnboardingStore";
import { logger } from "@/frontend/common/utils/logger";
import { profileHrefForTeacher } from "@/frontend/common/utils/profileHref";
import type { TeacherOnboardingFormData } from "@/frontend/common/views/dashboard/teachers/onboarding/schemas/teacherOnboardingSchema";
import { teacherOnboardingSchema } from "@/frontend/common/views/dashboard/teachers/onboarding/schemas/teacherOnboardingSchema";
import { CountryCode, Gender } from "@/frontend/common/views/dashboard/teachers/onboarding/types";
import type { TeacherOnboardingLabels } from "@/shared/locale";
import { useAppTranslation } from "@/shared/locale";

/**
 * TeacherOnboarding ViewModel.
 *
 * Contains ALL business logic for teacher onboarding including:
 * - Form management with Zod validation
 * - Create teacher mutation
 * - Post-create meeting-config warning handling
 * - Router navigation
 * - Success snackbar auto-dismiss
 * The container (`TeacherOnboardingContainer`) is now a thin switcher that
 * only wraps the view model in permission check and ResponsiveViewSwitch.
 */

export interface TeacherOnboardingViewModel {
  readonly form: UseFormReturn<TeacherOnboardingFormData>;
  readonly register: UseFormRegister<TeacherOnboardingFormData>;
  readonly control: Control<TeacherOnboardingFormData>;
  readonly errors: FieldErrors<TeacherOnboardingFormData>;
  readonly handleSubmit: UseFormHandleSubmit<TeacherOnboardingFormData>;
  readonly isSubmitting: boolean;
  readonly showSuccess: boolean;
  readonly labels: TeacherOnboardingLabels;
  readonly onSubmit: (data: TeacherOnboardingFormData) => Promise<void>;
  readonly onDismissSuccess: () => void;
  readonly meetingConfigWarning: boolean;
  readonly clearMeetingConfigWarning: () => void;
  readonly meetingSetupHref: string | undefined;
  readonly tMeeting: ReturnType<typeof useAppTranslation>["uiTranslations"]["meetingConfigManager"];
  readonly tJoin: ReturnType<typeof useAppTranslation>["uiTranslations"]["meetingConfigJoin"];
}

export type UseTeacherOnboardingViewModelProps = Record<string, never>;

export function useTeacherOnboardingViewModel(): TeacherOnboardingViewModel {
  const { execute, loading, meetingConfigWarning, clearMeetingConfigWarning } = useCreateTeacherOnboarding();
  const createdTeacher = useTeacherOnboardingStore(state => state.result);
  const [showSuccess, setShowSuccess] = useState(false);
  const labels = useAppTranslation().dashboardTranslations.teacherOnboarding;
  const tMeeting = useAppTranslation().uiTranslations.meetingConfigManager;
  const tJoin = useAppTranslation().uiTranslations.meetingConfigJoin;

  const meetingSetupHref = createdTeacher
    ? `${profileHrefForTeacher({ userId: createdTeacher.userId, teacherId: createdTeacher.id })}?tab=meeting`
    : undefined;

  const schema = teacherOnboardingSchema(labels.validation);

  const form = useForm<TeacherOnboardingFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      gender: Gender.Male,
      countryCode: CountryCode.Eg,
      timezone: IanaTimezone.AfricaCairo,
      rateCurrency: CurrencyCode.Usd,
      payoutMethod: {
        type: PaymentMethodType.BankTransfer,
        label: "",
        details: {},
      },
    },
  });

  const { register, control, handleSubmit, formState } = form;
  const errors = formState.errors;

  const onSubmit = async (data: TeacherOnboardingFormData) => {
    logger.info("Submitting teacher onboarding data:", data);
    try {
      await execute(data);
      setShowSuccess(true);
    } catch (error) {
      logger.error("Failed to submit teacher onboarding form", { error });
    }
  };

  const onDismissSuccess = useCallback(() => {
    setShowSuccess(false);
  }, []);

  useEffect(() => {
    if (!showSuccess) return undefined;
    const timer = setTimeout(() => {
      onDismissSuccess();
    }, 3000);
    return () => {
      clearTimeout(timer);
    };
  }, [showSuccess, onDismissSuccess]);

  return {
    form,
    register,
    control,
    errors,
    handleSubmit,
    isSubmitting: loading,
    showSuccess,
    labels,
    onSubmit,
    onDismissSuccess,
    meetingConfigWarning,
    clearMeetingConfigWarning,
    meetingSetupHref,
    tMeeting,
    tJoin,
  };
}

export { FormProvider };
