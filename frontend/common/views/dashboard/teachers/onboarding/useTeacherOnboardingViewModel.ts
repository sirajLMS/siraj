"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import type { Control, FieldErrors, UseFormHandleSubmit, UseFormRegister, UseFormReturn } from "react-hook-form";
import { FormProvider, useForm } from "react-hook-form";
import { CurrencyCode, IanaTimezone, PaymentMethodType } from "@/frontend/common/graphql/generated/gql/graphql-types";
import type { TeacherOnboardingFormData } from "@/frontend/common/views/dashboard/teachers/onboarding/schemas/teacherOnboardingSchema";
import { teacherOnboardingSchema } from "@/frontend/common/views/dashboard/teachers/onboarding/schemas/teacherOnboardingSchema";
import { CountryCode, Gender } from "@/frontend/common/views/dashboard/teachers/onboarding/types";
import type { TeacherOnboardingLabels } from "@/shared/locale";

/**
 * TeacherOnboarding ViewModel.
 *
 * The container (`TeacherOnboardingContainer`) owns the create-teacher
 * mutation, the post-create meeting-config warning, and router navigation.
 * It passes a flat prop bag to this hook, which derives the form instance
 * (zodResolver + default values) and the snackbar-dismiss effect. The view
 * model exposes the same interface for both tiers; no viewport logic lives
 * here. The `FormProvider` is intentionally created in the switcher-side
 * consumers (mobile/desktop) so both tiers wrap the same form instance.
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
  readonly onSubmit: (data: TeacherOnboardingFormData) => void | Promise<void>;
  readonly onDismissSuccess: () => void;
}

export type UseTeacherOnboardingViewModelProps = Pick<
  TeacherOnboardingViewModel,
  "isSubmitting" | "showSuccess" | "labels" | "onSubmit" | "onDismissSuccess"
>;

export function useTeacherOnboardingViewModel(
  props: Readonly<UseTeacherOnboardingViewModelProps>
): TeacherOnboardingViewModel {
  const schema = teacherOnboardingSchema(props.labels.validation);

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

  useEffect(() => {
    if (!props.showSuccess) return undefined;
    const timer = setTimeout(() => {
      props.onDismissSuccess();
    }, 3000);
    return () => {
      clearTimeout(timer);
    };
  }, [props.showSuccess, props.onDismissSuccess]);

  return {
    form,
    register,
    control,
    errors,
    handleSubmit,
    isSubmitting: props.isSubmitting,
    showSuccess: props.showSuccess,
    labels: props.labels,
    onSubmit: props.onSubmit,
    onDismissSuccess: props.onDismissSuccess,
  };
}

export { FormProvider };
