"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useEffect, useState } from "react";
import type { Control, FieldErrors, UseFormHandleSubmit, UseFormRegister, UseFormReturn } from "react-hook-form";
import { useForm } from "react-hook-form";
import { CurrencyCode } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { useAvatarUpload } from "@/frontend/common/hooks/useAvatarUpload";
import { useCreateParentOnboarding } from "@/frontend/common/hooks/useCreateParentOnboarding";
import { useParentOnboardingStore } from "@/frontend/common/stores/parentOnboardingStore";
import { logger } from "@/frontend/common/utils/logger";
import { profileHrefForParent } from "@/frontend/common/utils/profileHref";
import {
  type ParentOnboardingFormData,
  parentOnboardingSchema,
} from "@/frontend/common/views/dashboard/admin/parents/onboarding/schemas/parentOnboardingSchema";
import { InvoiceType, PaymentMethodType } from "@/frontend/common/views/dashboard/admin/parents/onboarding/types";
import type { ParentOnboardingLabelsBySection } from "@/frontend/common/views/dashboard/admin/parents/onboarding/types/parentOnboardingViewModel.types";
import { useRouter } from "@/shared/i18n/navigation";
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
  payinMethod: {
    type: PaymentMethodType.BankTransfer,
    label: "",
    details: {},
  },
  currency: CurrencyCode.Usd,
  timezone: "Africa/Cairo",
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
  const [showSuccess, setShowSuccess] = useState(false);
  // Lazy initializer: generate the pending-avatar storage key once per hook
  // instance. State with a lazy initializer is the React-blessed pattern for
  // "compute a stable value once" — using useRef + reading .current during
  // render trips `react-hooks/refs`.
  const [pendingAvatarKey] = useState(() => `pending-${crypto.randomUUID()}`);
  const { onUploadAvatar } = useAvatarUpload({ storageOwnerKey: pendingAvatarKey });

  const meetingSetupHref = createdParent
    ? `${profileHrefForParent({ userId: createdParent.userId, parentId: createdParent.parentId })}?tab=meeting`
    : undefined;

  const form = useForm<ParentOnboardingFormData>({
    resolver: zodResolver(parentOnboardingSchema),
    defaultValues,
  });

  const { register, control, handleSubmit, formState, reset } = form;
  const errors = formState.errors;

  const router = useRouter();
  const onSubmit = async (formData: ParentOnboardingFormData) => {
    try {
      logger.info("Submitting parent onboarding form", { formData });
      const created = await execute(formData);
      logger.info("Parent onboarding form submitted successfully");
      setShowSuccess(true);
      reset(defaultValues);
      const href = profileHrefForParent({ userId: created.userId, parentId: created.parentId });
      if (href) {
        router.push(href);
      }
    } catch (error) {
      logger.error("Failed to submit parent onboarding form", { error });
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
