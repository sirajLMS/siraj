"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo } from "react";
import {
  type Control,
  type FieldErrors,
  type UseFormHandleSubmit,
  type UseFormRegister,
  useForm,
} from "react-hook-form";
import { useOnboardingAvatar } from "@/frontend/common/components/onboarding/hooks/useOnboardingAvatar";
import { useOnboardingSubmit } from "@/frontend/common/components/onboarding/hooks/useOnboardingSubmit";
import { useCreateStudentOnboarding } from "@/frontend/common/hooks/useCreateStudentOnboarding";
import { studentHref } from "@/frontend/common/utils/profileHref";
import {
  type StudentOnboardingFormData,
  studentOnboardingSchema,
} from "@/frontend/common/views/dashboard/students/onboarding/schemas/studentOnboardingSchema";
import {
  buildLabels,
  buildOnboardingFormValues,
  type StudentOnboardingLabels,
} from "@/frontend/common/views/dashboard/students/onboarding/useStudentOnboardingViewModel.helpers";
import { Translation, useAppTranslation } from "@/shared/locale";

export type UseStudentOnboardingViewModelProps = Record<string, never>;

export interface StudentOnboardingViewModel {
  readonly register: UseFormRegister<StudentOnboardingFormData>;
  readonly control: Control<StudentOnboardingFormData>;
  readonly errors: FieldErrors<StudentOnboardingFormData>;
  readonly handleSubmit: UseFormHandleSubmit<StudentOnboardingFormData>;
  readonly isSubmitting: boolean;
  readonly parentLocked: boolean;
  readonly labels: StudentOnboardingLabels;
  readonly onSubmit: (data: StudentOnboardingFormData) => void | Promise<void>;
  readonly successOpen: boolean;
  readonly onCloseSuccess: () => void;
  readonly successMessage: string;
  readonly onUploadAvatar: (file: File) => Promise<{ url: string }>;
}

export function useStudentOnboardingViewModel(
  _props: Readonly<UseStudentOnboardingViewModelProps> = {}
): StudentOnboardingViewModel {
  return useStudentOnboardingViewModelImpl();
}

type StudentOnboardingFormHook = ReturnType<typeof useForm<StudentOnboardingFormData>>;

function useStudentOnboardingForm(initialParentId: string): StudentOnboardingFormHook {
  return useForm<StudentOnboardingFormData>({
    resolver: zodResolver(studentOnboardingSchema),
    defaultValues: buildOnboardingFormValues(initialParentId),
  });
}

function useStudentOnboardingViewModelImpl(): StudentOnboardingViewModel {
  const t = useAppTranslation(Translation.Dashboard.StudentOnboarding);
  const searchParams = useSearchParams();
  const initialParentId = searchParams.get("parentId") ?? "";

  const { execute, loading } = useCreateStudentOnboarding();
  const { onUploadAvatar } = useOnboardingAvatar();
  const { showSuccess, onSubmit, onDismissSuccess, isSubmitting } = useOnboardingSubmit<
    StudentOnboardingFormData,
    { studentId: string | null }
  >({
    execute,
    onSuccess: result => (result?.studentId ? studentHref(result.studentId) : undefined),
    onError: error => (error instanceof Error ? error.message : "operationFailed"),
    successAutoDismissMs: 3000,
  });

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useStudentOnboardingForm(initialParentId);

  useEffect(() => {
    if (initialParentId) {
      setValue("parentId", initialParentId);
    }
  }, [initialParentId, setValue]);

  const wrappedOnSubmit = useCallback(
    async (formData: StudentOnboardingFormData) => {
      await onSubmit(formData);
      reset(buildOnboardingFormValues(initialParentId || formData.parentId));
    },
    [onSubmit, reset, initialParentId]
  );

  const labels = useMemo(() => buildLabels(t), [t]);

  return {
    register,
    control,
    errors,
    handleSubmit,
    isSubmitting: loading || isSubmitting,
    parentLocked: Boolean(initialParentId),
    labels,
    onSubmit: wrappedOnSubmit,
    successOpen: showSuccess,
    onCloseSuccess: onDismissSuccess,
    successMessage: t.actions.successMessage,
    onUploadAvatar,
  };
}
