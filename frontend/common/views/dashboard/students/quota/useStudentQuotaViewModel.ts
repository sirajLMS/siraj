"use client";

import { useQuery } from "@apollo/client/react";
import { useMemo } from "react";
import { studentByIdQueryDocument } from "@/frontend/common/graphql/sharedDocuments";
import { useStudentFieldAccess } from "@/frontend/common/views/dashboard/students/profile/useStudentFieldAccess";
import { useStudentProfileContext } from "@/frontend/common/views/dashboard/students/profile/useStudentProfileContext";
import type { StudentQuotaFormData } from "@/frontend/common/views/dashboard/students/quota/schemas/studentQuotaSchema";
import type { StudentProfileData } from "@/frontend/common/views/dashboard/students/quota/types";
import {
  buildStudentQuotaData,
  resolveQuotaLoadingState,
  type StudentQuotaLoadingState,
} from "@/frontend/common/views/dashboard/students/quota/useStudentQuotaViewModel.helpers";
import {
  type StudentQuotaMethods,
  useStudentQuotaCancelNavigation,
  useStudentQuotaFormMethods,
  useStudentQuotaSaveMutation,
} from "@/frontend/common/views/dashboard/students/quota/useStudentQuotaViewModel.hooks";
import { type CommonLabels, Translation, useAppTranslation } from "@/shared/locale";
import type { StudentQuotaLabels } from "@/shared/locale/types/dashboard/students/quota";

export interface UseStudentQuotaViewModelProps {
  readonly studentId?: string;
}

export interface StudentQuotaViewModel {
  readonly t: StudentQuotaLabels;
  readonly tc: CommonLabels;
  readonly studentData: StudentProfileData | null;
  readonly isSaving: boolean;
  readonly isSaved: boolean;
  readonly embedded: boolean;
  readonly readOnly: boolean;
  readonly canEditIdentity: boolean;
  readonly canEditQuota: boolean;
  readonly canViewQuota: boolean;
  readonly canViewTeacher: boolean;
  readonly isLoading: boolean;
  readonly loadingState: StudentQuotaLoadingState;
  readonly errorMessage: string | null;
  readonly methods: StudentQuotaMethods;
  readonly onSubmit: (data: StudentQuotaFormData) => Promise<void>;
  readonly onCancel: () => void;
}

export function useStudentQuotaViewModel(props: Readonly<UseStudentQuotaViewModelProps>): StudentQuotaViewModel {
  const t = useAppTranslation(Translation.Dashboard.StudentQuota);
  const tc = useAppTranslation(Translation.Common);
  const profileContext = useStudentProfileContext();
  const studentId = props.studentId ?? profileContext?.studentId ?? "";
  const useUnifiedProfile = profileContext != null;
  const { canView, canEdit } = useStudentFieldAccess();
  const canEditQuota = canEdit("student_quota_edit");

  const { data, loading, error, refetch } = useQuery(studentByIdQueryDocument, {
    variables: { studentId },
    skip: !studentId || useUnifiedProfile,
  });

  const { saveQuota, saving, isSaved } = useStudentQuotaSaveMutation({
    useUnifiedProfile,
    canSubmit: canEditQuota,
    profileContext,
    refetchStudentById: refetch,
    successMessage: t.actions.saveSuccess,
    failureMessage: tc.operationFailed,
  });

  const loadingState = resolveQuotaLoadingState({
    useUnifiedProfile,
    unifiedLoading: Boolean(profileContext?.loading),
    unifiedProfilePresent: Boolean(profileContext?.profile),
    standaloneLoading: loading,
    standaloneDataPresent: Boolean(data),
    standaloneError: Boolean(error),
  });

  const studentData = useMemo(
    () =>
      buildStudentQuotaData(
        useUnifiedProfile,
        profileContext?.profile ?? undefined,
        data?.studentById ?? undefined,
        tc.notSet
      ),
    [useUnifiedProfile, profileContext?.profile, data?.studentById, tc.notSet]
  );

  const canEditIdentity = canEdit("student_identity");
  const canEditQuotaFlag = canEdit("student_quota_edit");
  const canViewQuotaFlag = canView("student_quota_edit");
  const canViewTeacherFlag = canView("student_teacher");

  const methods = useStudentQuotaFormMethods(studentData, t.validation);
  const onCancel = useStudentQuotaCancelNavigation(useUnifiedProfile, studentId);

  return {
    t,
    tc,
    studentData,
    isSaving: saving,
    isSaved,
    embedded: useUnifiedProfile,
    readOnly: !canEditQuotaFlag,
    canEditIdentity,
    canEditQuota: canEditQuotaFlag,
    canViewQuota: canViewQuotaFlag,
    canViewTeacher: canViewTeacherFlag,
    isLoading: loadingState === "loading",
    loadingState,
    errorMessage: loadingState === "error" ? tc.loadFailed : null,
    methods,
    onSubmit: formData => saveQuota(studentId, formData),
    onCancel,
  };
}
