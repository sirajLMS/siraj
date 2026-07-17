"use client";

import { useQuery } from "@apollo/client/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNotifications } from "@toolpad/core/useNotifications";
import { useSearchParams } from "next/navigation";
import {
  type Control,
  type FieldErrors,
  type UseFormHandleSubmit,
  type UseFormRegister,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useForm } from "react-hook-form";
import { StudentStatus } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { parentDirectoryQueryDocument } from "@/frontend/common/graphql/sharedDocuments/parents/parent-directory.documents";
import { teachersQueryDocument } from "@/frontend/common/graphql/sharedDocuments/teachers/teacher.documents";
import { useCreateStudentOnboarding } from "@/frontend/common/hooks/useCreateStudentOnboarding";
import { logger } from "@/frontend/common/utils/logger";
import { studentHref } from "@/frontend/common/utils/profileHref";
import {
  type StudentOnboardingFormData,
  studentOnboardingSchema,
} from "@/frontend/common/views/dashboard/students/onboarding/schemas/studentOnboardingSchema";
import { useRouter } from "@/shared/i18n/routing";
import { useAppTranslation } from "@/shared/locale";

export interface ParentOption {
  readonly id: string;
  readonly label: string;
}

export interface TeacherOption {
  readonly id: string;
  readonly name: string;
}

export interface StudentOnboardingLabels {
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
  readonly parentOptions: readonly ParentOption[];
  readonly teacherOptions: readonly TeacherOption[];
  readonly parentLocked: boolean;
  readonly labels: StudentOnboardingLabels;
  readonly onSubmit: (data: StudentOnboardingFormData) => void | Promise<void>;
  readonly successOpen: boolean;
  readonly onCloseSuccess: () => void;
  readonly successMessage: string;
}

export function useStudentOnboardingViewModel(
  _props: Readonly<UseStudentOnboardingViewModelProps> = {}
): StudentOnboardingViewModel {
  return useStudentOnboardingViewModelImpl();
}

function useStudentOnboardingViewModelImpl(): StudentOnboardingViewModel {
  const t = useAppTranslation().dashboardTranslations.studentOnboarding;
  const tc = useAppTranslation().commonTranslations;
  const router = useRouter();
  const notifications = useNotifications();
  const searchParams = useSearchParams();
  const initialParentId = searchParams.get("parentId") ?? "";

  const { execute, loading } = useCreateStudentOnboarding();
  const [showSuccess, setShowSuccess] = useState(false);

  const { data: parentData } = useQuery(parentDirectoryQueryDocument, {
    variables: { search: null, paginationArgs: null, lifecycleStatusFilter: null },
    fetchPolicy: "cache-first",
  });

  const { data: teacherData } = useQuery(teachersQueryDocument, {
    variables: { search: "", limit: 100 },
    fetchPolicy: "cache-first",
  });

  const parentOptions: ParentOption[] = useMemo(
    () =>
      (parentData?.parentDirectory?.rows ?? [])
        .filter((row): row is typeof row & { id: string; name: string } => Boolean(row.id && row.name))
        .map(row => ({
          id: row.id,
          label: row.name,
        })),
    [parentData]
  );

  const teacherOptions: TeacherOption[] = useMemo(
    () =>
      (teacherData?.teachers ?? [])
        .filter((teacher): teacher is typeof teacher & { id: string; name: string } =>
          Boolean(teacher.id && teacher.name)
        )
        .map(teacher => ({
          id: teacher.id,
          name: teacher.name,
        })),
    [teacherData]
  );

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<StudentOnboardingFormData>({
    resolver: zodResolver(studentOnboardingSchema),
    defaultValues: {
      parentId: initialParentId,
      name: "",
      dateOfBirth: "",
      gender: null,
      language: null,
      status: StudentStatus.OnTrial,
      primaryTeacherId: "",
    },
  });

  useEffect(() => {
    if (initialParentId) {
      setValue("parentId", initialParentId);
    }
  }, [initialParentId, setValue]);

  const onSubmit = async (formData: StudentOnboardingFormData) => {
    try {
      logger.info("Submitting student onboarding form", { formData });
      const result = await execute(formData);
      setShowSuccess(true);
      reset({
        parentId: initialParentId || formData.parentId,
        name: "",
        dateOfBirth: "",
        gender: null,
        language: null,
        status: StudentStatus.OnTrial,
        primaryTeacherId: "",
      });
      if (result.studentId) {
        router.push(studentHref(result.studentId));
      }
    } catch (error) {
      logger.error("Failed to submit student onboarding form", { error });
      notifications.show(tc.operationFailed, { severity: "error", autoHideDuration: 5000 });
    }
  };

  const labels: StudentOnboardingLabels = useMemo(
    () => ({
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
    }),
    [t]
  );

  const onCloseSuccess = useCallback(() => setShowSuccess(false), []);

  return {
    register,
    control,
    errors,
    handleSubmit,
    isSubmitting: loading,
    parentOptions,
    teacherOptions,
    parentLocked: Boolean(initialParentId),
    labels,
    onSubmit,
    successOpen: showSuccess,
    onCloseSuccess,
    successMessage: t.actions.successMessage,
  };
}
