"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import type { Control, FieldErrors, UseFormHandleSubmit, UseFormRegister, UseFormReturn } from "react-hook-form";
import { useForm } from "react-hook-form";
import { useOnboardingAvatar } from "@/frontend/common/components/onboarding/hooks/useOnboardingAvatar";
import { useOnboardingSubmit } from "@/frontend/common/components/onboarding/hooks/useOnboardingSubmit";
import {
  CountryCode,
  CurrencyCode,
  Gender,
  IanaTimezone,
  type TeacherOnboarding,
} from "@/frontend/common/graphql/generated/gql/graphql-types";
import { useCreateTeacherOnboarding } from "@/frontend/common/hooks/useCreateTeacherOnboarding";
import { useTeacherOnboardingStore } from "@/frontend/common/stores/teacherOnboardingStore";
import { profileHrefForTeacher } from "@/frontend/common/utils/profileHref";
import type { TeacherOnboardingFormData } from "@/frontend/common/views/dashboard/teachers/onboarding/schemas/teacherOnboardingSchema";
import { teacherOnboardingSchema } from "@/frontend/common/views/dashboard/teachers/onboarding/schemas/teacherOnboardingSchema";
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
  const { showSuccess, submitError, onSubmit, onDismissSuccess, onDismissError, isSubmitting } = useOnboardingSubmit<
    TeacherOnboardingFormData,
    TeacherOnboarding
  >({
    execute,
    onSuccess: created => profileHrefForTeacher({ userId: created.userId, teacherId: created.id }) ?? undefined,
    onError: error => (error instanceof Error ? error.message : "operationFailed"),
    successAutoDismissMs: 3000,
  });
  const { onUploadAvatar } = useOnboardingAvatar();
  const meetingSetupHref = useMeetingSetupHref();

  return {
    form,
    register,
    control,
    errors,
    handleSubmit,
    isSubmitting: loading || isSubmitting,
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
