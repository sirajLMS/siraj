"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { type UseFormReturn, useForm } from "react-hook-form";
import { useStudentFieldAccess } from "@/frontend/common/views/dashboard/students/profile/useStudentFieldAccess";
import {
  createStudentQuotaSchema,
  type StudentQuotaFormData,
  type StudentQuotaFormInput,
} from "@/frontend/common/views/dashboard/students/quota/schemas/studentQuotaSchema";
import type { StudentProfileData } from "@/frontend/common/views/dashboard/students/quota/types";
import { type StudentQuotaLabels, useAppTranslation } from "@/shared/locale";

export interface UseStudentQuotaViewModelProps {
  readonly studentData: StudentProfileData | null;
  readonly isSaving: boolean;
  readonly isSaved: boolean;
  readonly embedded?: boolean;
  readonly readOnly?: boolean;
  readonly onSave: (data: StudentQuotaFormData) => Promise<void>;
  readonly onCancel: () => void;
  readonly onEditAvatar?: () => void;
  readonly isLoading?: boolean;
}

export interface StudentQuotaViewModel {
  readonly t: StudentQuotaLabels;
  readonly studentData: StudentProfileData | null;
  readonly embedded: boolean;
  readonly readOnly: boolean;
  readonly isSaving: boolean;
  readonly isSaved: boolean;
  readonly isLoading: boolean;
  readonly canEditIdentity: boolean;
  readonly canEditQuota: boolean;
  readonly canViewQuota: boolean;
  readonly canViewTeacher: boolean;
  readonly methods: UseFormReturn<StudentQuotaFormInput, undefined, StudentQuotaFormData>;
  readonly onSubmit: (data: StudentQuotaFormData) => Promise<void>;
  readonly onCancel: () => void;
  readonly onEditAvatar?: () => void;
}

export function useStudentQuotaViewModel(props: Readonly<UseStudentQuotaViewModelProps>): StudentQuotaViewModel {
  const t = useAppTranslation().dashboardTranslations.studentQuota;
  const { canView, canEdit } = useStudentFieldAccess();

  const {
    studentData,
    isSaving,
    isSaved,
    embedded = false,
    readOnly = false,
    onSave,
    onCancel,
    onEditAvatar,
    isLoading = false,
  } = props;

  const canEditIdentity = canEdit("student_identity");
  const canEditQuota = canEdit("student_quota_edit");
  const canViewQuota = canView("student_quota_edit");
  const canViewTeacher = canView("student_teacher");

  const validationMessages = t.validation;
  const schema = createStudentQuotaSchema(validationMessages);

  const methods = useForm<StudentQuotaFormInput, undefined, StudentQuotaFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      studentName: "",
      dateOfBirth: "",
      language: "ar",
      gender: "",
      teacher: "",
      totalClasses: 0,
      classesLeft: 0,
    },
  });

  useEffect(() => {
    if (studentData) {
      methods.reset({
        studentName: studentData.studentName,
        dateOfBirth: studentData.dateOfBirth,
        language: studentData.language,
        gender: studentData.gender,
        teacher: studentData.teacher,
        totalClasses: studentData.totalClasses,
        classesLeft: studentData.classesLeft,
      });
    }
  }, [studentData, methods]);

  const onSubmit = async (data: StudentQuotaFormData) => {
    await onSave(data);
  };

  return {
    t,
    studentData,
    embedded,
    readOnly,
    isSaving,
    isSaved,
    isLoading,
    canEditIdentity,
    canEditQuota,
    canViewQuota,
    canViewTeacher,
    methods,
    onSubmit,
    onCancel,
    onEditAvatar,
  };
}
