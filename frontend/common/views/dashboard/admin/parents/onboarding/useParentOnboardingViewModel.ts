"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import type { Control, FieldErrors, UseFormHandleSubmit, UseFormRegister, UseFormReturn } from "react-hook-form";
import { useForm } from "react-hook-form";
import { useOnboardingAvatar } from "@/frontend/common/components/onboarding/hooks/useOnboardingAvatar";
import { useOnboardingSubmit } from "@/frontend/common/components/onboarding/hooks/useOnboardingSubmit";
import type { ParentOnboardingResult } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { CurrencyCode } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { useCreateParentOnboarding } from "@/frontend/common/hooks/useCreateParentOnboarding";
import { useParentOnboardingStore } from "@/frontend/common/stores/parentOnboardingStore";
import { profileHrefForParent } from "@/frontend/common/utils/profileHref";
import {
  type ParentOnboardingFormData,
  parentOnboardingSchema,
} from "@/frontend/common/views/dashboard/admin/parents/onboarding/schemas/parentOnboardingSchema";
import { InvoiceType } from "@/frontend/common/views/dashboard/admin/parents/onboarding/types";
import type { ParentOnboardingLabelsBySection } from "@/frontend/common/views/dashboard/admin/parents/onboarding/types/parentOnboardingViewModel.types";
import { Translation, useAppTranslation } from "@/shared/locale";

const defaultValues: ParentOnboardingFormData = {
  name: "",
  email: "",
  password: "",
  avatarUrl: undefined,
  phone: "",
  nationality: "",
  address: "",
  whatsapp: "",
  facebook: "",
  twitter: "",
  invoiceType: InvoiceType.Monthly,
  feeAmount: "",
  payinMethod: null,
  currency: CurrencyCode.Usd,
  timezone: "Africa/Cairo",
  displayCurrency: CurrencyCode.Usd,
  meetingProvider: null,
  meetingUrl: "",
  meetingLabel: "",
};

export interface ParentOnboardingViewModel {
  readonly form: UseFormReturn<ParentOnboardingFormData>;
  readonly register: UseFormRegister<ParentOnboardingFormData>;
  readonly control: Control<ParentOnboardingFormData>;
  readonly errors: FieldErrors<ParentOnboardingFormData>;
  readonly handleSubmit: UseFormHandleSubmit<ParentOnboardingFormData>;
  readonly isSubmitting: boolean;
  readonly onSubmit: (data: ParentOnboardingFormData) => Promise<void>;
  readonly meetingConfigWarning: boolean;
  readonly clearMeetingConfigWarning: () => void;
  readonly meetingSetupHref: string | undefined;
  readonly showSuccess: boolean;
  readonly onDismissSuccess: () => void;
  readonly labelsBySection: ParentOnboardingLabelsBySection;
  readonly onUploadAvatar: (file: File) => Promise<{ url: string }>;
}

export type UseParentOnboardingViewModelProps = Record<string, never>;

export function useParentOnboardingViewModel(): ParentOnboardingViewModel {
  const t = useAppTranslation(Translation.Dashboard.ParentOnboarding);
  const tMeeting = useAppTranslation(Translation.Ui.MeetingConfig).manager;
  const tJoin = useAppTranslation(Translation.Ui.MeetingConfig).join;
  const { execute, loading, meetingConfigWarning, clearMeetingConfigWarning } = useCreateParentOnboarding();
  const createdParent = useParentOnboardingStore(state => state.result);
  const { onUploadAvatar } = useOnboardingAvatar();
  const { showSuccess, onSubmit, onDismissSuccess, isSubmitting } = useOnboardingSubmit<
    ParentOnboardingFormData,
    ParentOnboardingResult
  >({
    execute,
    onSuccess: created =>
      created?.userId
        ? (profileHrefForParent({ userId: created.userId, parentId: created.parentId ?? "" }) ?? undefined)
        : undefined,
    onError: error => (error instanceof Error ? error.message : "operationFailed"),
    successAutoDismissMs: 3000,
  });

  const meetingSetupHref = createdParent?.userId
    ? `${profileHrefForParent({ userId: createdParent.userId, parentId: createdParent.parentId ?? "" })}?tab=meeting`
    : undefined;

  const form = useForm<ParentOnboardingFormData>({
    resolver: zodResolver(parentOnboardingSchema),
    defaultValues,
  });

  const { register, control, handleSubmit, formState } = form;
  const errors = formState.errors;

  return {
    form,
    register,
    control,
    errors,
    handleSubmit,
    isSubmitting: loading || isSubmitting,
    onSubmit,
    meetingConfigWarning,
    clearMeetingConfigWarning,
    meetingSetupHref,
    showSuccess,
    onDismissSuccess,
    labelsBySection: {
      form: t,
      meeting: {
        manager: tMeeting,
        join: tJoin,
      },
    },
    onUploadAvatar,
  };
}
