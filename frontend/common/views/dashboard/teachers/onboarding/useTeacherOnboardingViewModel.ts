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
  type TeacherOnboarding,
} from "@/frontend/common/graphql/generated/gql/graphql-types";
import { useAvatarUpload } from "@/frontend/common/hooks/useAvatarUpload";
import { useCreateTeacherOnboarding } from "@/frontend/common/hooks/useCreateTeacherOnboarding";
import { useTeacherOnboardingStore } from "@/frontend/common/stores/teacherOnboardingStore";
import { logger } from "@/frontend/common/utils/logger";
import { profileHrefForTeacher } from "@/frontend/common/utils/profileHref";
import type { TeacherOnboardingFormData } from "@/frontend/common/views/dashboard/teachers/onboarding/schemas/teacherOnboardingSchema";
import { teacherOnboardingSchema } from "@/frontend/common/views/dashboard/teachers/onboarding/schemas/teacherOnboardingSchema";
import { useRouter } from "@/shared/i18n/navigation";
import type { TeacherOnboardingLabels } from "@/shared/locale";
import { Translation, useAppTranslation } from "@/shared/locale";
import type { MeetingConfigJoinLabels, MeetingConfigManagerLabels } from "@/shared/locale/types/ui";

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
  readonly submitError: string | null;
  readonly labels: TeacherOnboardingLabels;
  readonly onSubmit: (data: TeacherOnboardingFormData) => Promise<void>;
  readonly onDismissSuccess: () => void;
  readonly onDismissError: () => void;
  readonly meetingConfigWarning: boolean;
  readonly clearMeetingConfigWarning: () => void;
  readonly meetingSetupHref: string | undefined;
  readonly tMeeting: MeetingConfigManagerLabels;
  readonly tJoin: MeetingConfigJoinLabels;
  readonly onUploadAvatar: (file: File) => Promise<{ url: string }>;
}

export type UseTeacherOnboardingViewModelProps = Record<string, never>;

interface OnboardingTranslations {
  readonly labels: TeacherOnboardingLabels;
  readonly tMeeting: MeetingConfigManagerLabels;
  readonly tJoin: MeetingConfigJoinLabels;
}

function useOnboardingTranslations(): OnboardingTranslations {
  return {
    labels: useAppTranslation(Translation.Dashboard.TeacherOnboarding),
    tMeeting: useAppTranslation(Translation.Ui.MeetingConfig).manager,
    tJoin: useAppTranslation(Translation.Ui.MeetingConfig).join,
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
      name: "",
      email: "",
      password: "",
      gender: Gender.Male,
      countryCode: CountryCode.Eg,
      timezone: IanaTimezone.AfricaCairo,
      rateCurrency: CurrencyCode.Usd,
      avatarUrl: undefined,
      payoutMethod: null,
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

type OnboardingExecutor = (data: TeacherOnboardingFormData) => Promise<TeacherOnboarding>;

interface OnboardingSubmit {
  readonly showSuccess: boolean;
  readonly submitError: string | null;
  readonly onSubmit: (data: TeacherOnboardingFormData) => Promise<void>;
  readonly onDismissSuccess: () => void;
  readonly onDismissError: () => void;
}

function useOnboardingSubmit(execute: OnboardingExecutor): OnboardingSubmit {
  const router = useRouter();
  const [showSuccess, setShowSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const onSubmit = useCallback(
    async (data: TeacherOnboardingFormData) => {
      logger.info("Submitting teacher onboarding data:", data);
      setSubmitError(null);
      try {
        const created = await execute(data);
        setShowSuccess(true);
        const href = profileHrefForTeacher({ userId: created.userId, teacherId: created.id });
        if (href) {
          router.push(href);
        }
      } catch (error) {
        logger.error("Failed to submit teacher onboarding form", { error });
        const message = error instanceof Error ? error.message : "operationFailed";
        setSubmitError(message);
      }
    },
    [execute, router]
  );
  const onDismissSuccess = useCallback(() => {
    setShowSuccess(false);
  }, []);

  const onDismissError = useCallback(() => {
    setSubmitError(null);
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

  return { showSuccess, submitError, onSubmit, onDismissSuccess, onDismissError };
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
  const { showSuccess, submitError, onSubmit, onDismissSuccess, onDismissError } = useOnboardingSubmit(execute);
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
    submitError,
    labels,
    onSubmit,
    onDismissSuccess,
    onDismissError,
    meetingConfigWarning,
    clearMeetingConfigWarning,
    meetingSetupHref,
    tMeeting,
    tJoin,
    onUploadAvatar,
  };
}
