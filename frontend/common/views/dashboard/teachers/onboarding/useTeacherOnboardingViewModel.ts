"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useEffect, useState } from "react";
import type { Control, FieldErrors, UseFormHandleSubmit, UseFormRegister, UseFormReturn } from "react-hook-form";
import { useForm } from "react-hook-form";
import {
  CountryCode,
  CurrencyCode,
  Gender,
  IanaTimezone,
  PaymentMethodType,
} from "@/frontend/common/graphql/generated/gql/graphql-types";
import { useAvatarUpload } from "@/frontend/common/hooks/useAvatarUpload";
import { useCreateTeacherOnboarding } from "@/frontend/common/hooks/useCreateTeacherOnboarding";
import { useTeacherOnboardingStore } from "@/frontend/common/stores/teacherOnboardingStore";
import { logger } from "@/frontend/common/utils/logger";
import { profileHrefForTeacher } from "@/frontend/common/utils/profileHref";
import type { TeacherOnboardingFormData } from "@/frontend/common/views/dashboard/teachers/onboarding/schemas/teacherOnboardingSchema";
import { teacherOnboardingSchema } from "@/frontend/common/views/dashboard/teachers/onboarding/schemas/teacherOnboardingSchema";
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
  readonly onUploadAvatar: (file: File) => Promise<{ url: string }>;
}

export type UseTeacherOnboardingViewModelProps = Record<string, never>;

interface OnboardingTranslations {
  readonly labels: TeacherOnboardingLabels;
  readonly tMeeting: ReturnType<typeof useAppTranslation>["uiTranslations"]["meetingConfigManager"];
  readonly tJoin: ReturnType<typeof useAppTranslation>["uiTranslations"]["meetingConfigJoin"];
}

function useOnboardingTranslations(): OnboardingTranslations {
  const app = useAppTranslation();
  return {
    labels: app.dashboardTranslations.teacherOnboarding,
    tMeeting: app.uiTranslations.meetingConfigManager,
    tJoin: app.uiTranslations.meetingConfigJoin,
  };
}

interface OnboardingForm {
  readonly form: UseFormReturn<TeacherOnboardingFormData>;
  readonly register: UseFormRegister<TeacherOnboardingFormData>;
  readonly control: Control<TeacherOnboardingFormData>;
  readonly errors: FieldErrors<TeacherOnboardingFormData>;
  readonly handleSubmit: UseFormHandleSubmit<TeacherOnboardingFormData>;
}

function useOnboardingForm(labels: TeacherOnboardingLabels): OnboardingForm {
  const schema = teacherOnboardingSchema(labels.validation);
  const form = useForm<TeacherOnboardingFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      gender: Gender.Male,
      countryCode: CountryCode.Eg,
      timezone: IanaTimezone.AfricaCairo,
      rateCurrency: CurrencyCode.Usd,
      avatarUrl: undefined,
      payoutMethod: {
        type: PaymentMethodType.BankTransfer,
        label: "",
        details: {},
      },
    },
  });
  const { register, control, handleSubmit, formState } = form;
  return {
    form,
    register,
    control,
    errors: formState.errors,
    handleSubmit,
  };
}

type OnboardingExecutor = (data: TeacherOnboardingFormData) => Promise<unknown>;

interface OnboardingSubmit {
  readonly showSuccess: boolean;
  readonly onSubmit: (data: TeacherOnboardingFormData) => Promise<void>;
  readonly onDismissSuccess: () => void;
}

function useOnboardingSubmit(execute: OnboardingExecutor): OnboardingSubmit {
  const [showSuccess, setShowSuccess] = useState(false);
  const onSubmit = useCallback(
    async (data: TeacherOnboardingFormData) => {
      logger.info("Submitting teacher onboarding data:", data);
      try {
        await execute(data);
        setShowSuccess(true);
      } catch (error) {
        logger.error("Failed to submit teacher onboarding form", { error });
      }
    },
    [execute]
  );
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

  return { showSuccess, onSubmit, onDismissSuccess };
}

function useOnboardingAvatar() {
  // Lazy initializer: generate the pending-avatar storage key once per hook
  // instance. Using useState with a lazy initializer (instead of useRef) avoids
  // reading ref.current during render (which trips `react-hooks/refs`).
  const [pendingAvatarKey] = useState(() => `pending-${crypto.randomUUID()}`);
  const { onUploadAvatar } = useAvatarUpload({ storageOwnerKey: pendingAvatarKey });
  return { onUploadAvatar };
}

function useMeetingSetupHref(): string | undefined {
  const createdTeacher = useTeacherOnboardingStore(state => state.result);
  return createdTeacher
    ? `${profileHrefForTeacher({ userId: createdTeacher.userId, teacherId: createdTeacher.id })}?tab=meeting`
    : undefined;
}

export function useTeacherOnboardingViewModel(): TeacherOnboardingViewModel {
  const { execute, loading, meetingConfigWarning, clearMeetingConfigWarning } = useCreateTeacherOnboarding();
  const { labels, tMeeting, tJoin } = useOnboardingTranslations();
  const { form, register, control, errors, handleSubmit } = useOnboardingForm(labels);
  const { showSuccess, onSubmit, onDismissSuccess } = useOnboardingSubmit(execute);
  const { onUploadAvatar } = useOnboardingAvatar();
  const meetingSetupHref = useMeetingSetupHref();

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
    onUploadAvatar,
  };
}
