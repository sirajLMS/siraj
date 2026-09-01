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
import { CurrencyCode, StudentStatus } from "@/frontend/common/graphql/generated/gql/graphql";
import { useCreateStudentOnboarding } from "@/frontend/common/hooks/useCreateStudentOnboarding";
import { studentHref } from "@/frontend/common/utils/profileHref";
import {
  type StudentOnboardingFormData,
  studentOnboardingSchema,
} from "@/frontend/common/views/dashboard/students/onboarding/schemas/studentOnboardingSchema";
import { IanaTimezone } from "@/shared/constants/iana-timezone.enum";
import { Translation, useAppTranslation } from "@/shared/locale";
import type { StudentOnboardingLabels as StudentOnboardingLocaleLabels } from "@/shared/locale/types/dashboard/students/onboarding";

interface StudentOnboardingLabels {
  readonly pageTitle: string;
  readonly pageSubtitle: string;
  readonly statusBanner: string;
  readonly create: string;
  readonly processing: string;
  readonly sections: {
    readonly parentAssignment: string;
    readonly studentInfo: string;
    readonly teacherAssignment: string;
  };
  readonly fields: {
    readonly parent: string;
    readonly name: string;
    readonly dateOfBirth: string;
    readonly gender: string;
    readonly male: string;
    readonly female: string;
    readonly language: string;
    readonly status: string;
    readonly primaryTeacher: string;
    readonly avatar: string;
  };
  readonly placeholders: {
    readonly parent: string;
    readonly name: string;
    readonly dateOfBirth: string;
    readonly language: string;
    readonly primaryTeacher: string;
  };
  readonly options: {
    readonly status: {
      readonly onTrial: string;
      readonly regular: string;
    };
  };
  readonly validation: {
    readonly parentRequired: string;
    readonly nameMinLength: string;
  };
}

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
    defaultValues: {
      parentId: initialParentId,
      name: "",
      email: "",
      password: "",
      avatarUrl: undefined,
      phone: "",
      timezone: IanaTimezone.Africa_Cairo,
      displayCurrency: CurrencyCode.Usd,
      dateOfBirth: "",
      gender: null,
      language: null,
      status: StudentStatus.OnTrial,
      primaryTeacherId: "",
    },
  });
}

function buildResetPayload(initialParentId: string, formData: StudentOnboardingFormData) {
  return {
    parentId: initialParentId || formData.parentId,
    name: "",
    email: "",
    password: "",
    avatarUrl: undefined,
    phone: "",
    timezone: IanaTimezone.Africa_Cairo,
    displayCurrency: CurrencyCode.Usd,
    dateOfBirth: "",
    gender: null,
    language: null,
    status: StudentStatus.OnTrial,
    primaryTeacherId: "",
  } as StudentOnboardingFormData;
}

function buildLabels(t: StudentOnboardingLocaleLabels): StudentOnboardingLabels {
  return {
    pageTitle: t.pageTitle,
    pageSubtitle: t.pageSubtitle,
    statusBanner: t.statusBanner,
    create: t.actions.create,
    processing: t.actions.processing,
    sections: {
      parentAssignment: t.sections.parentAssignment,
      studentInfo: t.sections.studentInfo,
      teacherAssignment: t.sections.teacherAssignment,
    },
    fields: {
      parent: t.fields.parent,
      name: t.fields.name,
      dateOfBirth: t.fields.dateOfBirth,
      gender: t.fields.gender,
      male: t.fields.male,
      female: t.fields.female,
      language: t.fields.language,
      status: t.fields.status,
      primaryTeacher: t.fields.primaryTeacher,
      avatar: t.fields.avatar,
    },
    placeholders: {
      parent: t.placeholders.parent,
      name: t.placeholders.name,
      dateOfBirth: t.placeholders.dateOfBirth,
      language: t.placeholders.language,
      primaryTeacher: t.placeholders.primaryTeacher,
    },
    options: {
      status: {
        onTrial: t.options.status.onTrial,
        regular: t.options.status.regular,
      },
    },
    validation: {
      parentRequired: t.validation.parentRequired,
      nameMinLength: t.validation.nameMinLength,
    },
  };
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
      reset(buildResetPayload(initialParentId, formData));
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
