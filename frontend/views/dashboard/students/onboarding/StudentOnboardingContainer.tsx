"use client";

import { useQuery } from "@apollo/client/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNotifications } from "@toolpad/core/useNotifications";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { RequirePermission } from "@/frontend/components/auth/RequirePermission";
import { FormSuccessSnackbar } from "@/frontend/components/ui";
import { AppPermission, StudentStatus } from "@/frontend/graphql/generated/gql/graphql-types";
import { parentDirectoryQueryDocument } from "@/frontend/graphql/sharedDocuments/parent-directory.documents";
import { teachersQueryDocument } from "@/frontend/graphql/sharedDocuments/teacher.documents";
import { useCreateStudentOnboarding } from "@/frontend/hooks/useCreateStudentOnboarding";
import { logger } from "@/frontend/utils/logger";
import type { ParentOption } from "@/frontend/views/dashboard/students/onboarding/ParentAssignmentSection";
import { StudentOnboardingView } from "@/frontend/views/dashboard/students/onboarding/StudentOnboardingView";
import {
  type StudentOnboardingFormData,
  studentOnboardingSchema,
} from "@/frontend/views/dashboard/students/onboarding/schemas/studentOnboardingSchema";
import type { TeacherOption } from "@/frontend/views/dashboard/students/onboarding/TeacherAssignmentSection";
import { useRouter } from "@/shared/i18n/routing";

export function StudentOnboardingContainer() {
  const t = useTranslations("dashboard.studentOnboarding");
  const tc = useTranslations("common");
  const router = useRouter();
  const notifications = useNotifications();
  const searchParams = useSearchParams();
  const initialParentId = searchParams.get("parentId") ?? "";

  const { execute, loading } = useCreateStudentOnboarding();
  const [showSuccess, setShowSuccess] = useState(false);

  const { data: parentData } = useQuery(parentDirectoryQueryDocument, {
    variables: { search: null, paginationArgs: null, statusFilter: null },
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
        router.push(`/students/${result.studentId}`);
      }
    } catch (error) {
      logger.error("Failed to submit student onboarding form", { error });
      notifications.show(tc("operationFailed"), { severity: "error", autoHideDuration: 5000 });
    }
  };

  return (
    <RequirePermission permissions={[AppPermission.StudentsCreate]}>
      <StudentOnboardingView
        register={register}
        control={control}
        errors={errors}
        handleSubmit={handleSubmit}
        isSubmitting={loading}
        parentOptions={parentOptions}
        teacherOptions={teacherOptions}
        parentLocked={Boolean(initialParentId)}
        labels={{
          pageTitle: t("pageTitle"),
          pageSubtitle: t("pageSubtitle"),
          statusBanner: t("statusBanner"),
          create: t("actions.create"),
          processing: t("actions.processing"),
          sections: {
            parentAssignment: t("sections.parentAssignment"),
            studentInfo: t("sections.studentInfo"),
            teacherAssignment: t("sections.teacherAssignment"),
          },
          fields: {
            parent: t("fields.parent"),
            name: t("fields.name"),
            dateOfBirth: t("fields.dateOfBirth"),
            gender: t("fields.gender"),
            male: t("fields.male"),
            female: t("fields.female"),
            language: t("fields.language"),
            status: t("fields.status"),
            primaryTeacher: t("fields.primaryTeacher"),
          },
          placeholders: {
            parent: t("placeholders.parent"),
            name: t("placeholders.name"),
            dateOfBirth: t("placeholders.dateOfBirth"),
            language: t("placeholders.language"),
            primaryTeacher: t("placeholders.primaryTeacher"),
          },
          options: {
            language: {
              arabic: t("options.language.arabic"),
              english: t("options.language.english"),
            },
            status: {
              onTrial: t("options.status.onTrial"),
              regular: t("options.status.regular"),
            },
          },
          validation: {
            parentRequired: t("validation.parentRequired"),
            nameMinLength: t("validation.nameMinLength"),
          },
        }}
        onSubmit={onSubmit}
      />
      <FormSuccessSnackbar
        open={showSuccess}
        message={t("actions.successMessage")}
        onClose={() => setShowSuccess(false)}
      />
    </RequirePermission>
  );
}
