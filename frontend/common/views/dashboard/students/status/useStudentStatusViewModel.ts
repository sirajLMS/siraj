"use client";

import { useParams } from "next/navigation";
import type { UseFormReturn } from "react-hook-form";
import type { StudentStatus } from "@/frontend/common/graphql/generated/gql/graphql";
import { useStudentProfileContext } from "@/frontend/common/views/dashboard/students/profile/useStudentProfileContext";
import type { StatusUpdateFormData } from "@/frontend/common/views/dashboard/students/status/schemas/statusUpdateSchema";
import type { StudentStatusPageData } from "@/frontend/common/views/dashboard/students/status/types";
import { useStudentStatusLayout } from "@/frontend/common/views/dashboard/students/status/useStudentStatusViewModel.helpers";
import {
  useStudentStatusData,
  useStudentStatusDerived,
  useStudentStatusPermissions,
} from "@/frontend/common/views/dashboard/students/status/useStudentStatusViewModel.hooks";
import {
  useChangeStudentStatusMutation,
  useStudentStatusFormState,
  useUpdateStatusHandler,
} from "@/frontend/common/views/dashboard/students/status/useStudentStatusViewModel.mutation";
import { type CommonLabels, type StudentStatusLabels, Translation, useAppTranslation } from "@/shared/locale";

export interface UseStudentStatusViewModelProps {
  readonly studentId?: string;
}

export interface StudentStatusViewModel {
  readonly t: StudentStatusLabels;
  readonly tc: CommonLabels;
  readonly student: StudentStatusPageData | null;
  readonly embedded: boolean;
  readonly isUpdating: boolean;
  readonly canEditStatus: boolean;
  readonly canViewSchedule: boolean;
  readonly hasTabAccess: boolean;
  readonly loading: boolean;
  readonly error: string | null;
  readonly handleUpdateStatus: (status: StudentStatus, reason: string) => Promise<void>;
  readonly hasLeftColumn: boolean;
  readonly hasRightColumn: boolean;
  readonly hasContent: boolean;
  readonly selectedStatus: StudentStatus;
  readonly methods: UseFormReturn<StatusUpdateFormData>;
  readonly handleSubmit: (data: StatusUpdateFormData) => Promise<void>;
}

export function useStudentStatusViewModel(props: Readonly<UseStudentStatusViewModelProps>): StudentStatusViewModel {
  const t = useAppTranslation(Translation.Dashboard.StudentStatus);
  const tc = useAppTranslation(Translation.Common);
  const params = useParams();
  const profileContext = useStudentProfileContext();
  const studentId = props.studentId ?? profileContext?.studentId ?? (typeof params?.id === "string" ? params.id : "");
  const useUnifiedProfile = profileContext != null;

  const { canEditStatus, canViewStatus, canViewSchedule, hasTabAccess } = useStudentStatusPermissions();

  const { student, versionRef, queries } = useStudentStatusData({
    studentId,
    useUnifiedProfile,
    profileContext,
  });

  const { changeStatus, isUpdating } = useChangeStudentStatusMutation({
    studentId,
    useUnifiedProfile,
    refetchUpcoming: queries.refetchUpcoming,
    profileContext,
    t,
    tc,
  });

  const { methods, selectedStatus, handleSubmit } = useStudentStatusFormState({
    student,
    studentId,
    t,
    changeStatus,
    versionRef,
  });

  const handleUpdateStatus = useUpdateStatusHandler({ studentId, changeStatus, versionRef });

  const { loading, error } = useStudentStatusDerived({
    studentId,
    useUnifiedProfile,
    profileContext,
    queries,
    tc,
  });

  const { hasLeftColumn, hasRightColumn, hasContent } = useStudentStatusLayout(
    canEditStatus,
    canViewStatus,
    canViewSchedule
  );

  return {
    t,
    tc,
    student,
    embedded: useUnifiedProfile,
    isUpdating,
    canEditStatus,
    canViewSchedule,
    hasTabAccess,
    loading,
    error,
    handleUpdateStatus,
    hasLeftColumn,
    hasRightColumn,
    hasContent,
    selectedStatus,
    methods,
    handleSubmit,
  };
}
