"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { type UseFormReturn, useForm, useWatch } from "react-hook-form";
import { StudentStatus } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { canViewStudentProfileTab } from "@/frontend/common/views/dashboard/students/profile/studentProfileTabs";
import { useStudentFieldAccess } from "@/frontend/common/views/dashboard/students/profile/useStudentFieldAccess";
import {
  createStatusUpdateSchema,
  type StatusUpdateFormData,
} from "@/frontend/common/views/dashboard/students/status/schemas/statusUpdateSchema";
import type { StudentStatusPageData } from "@/frontend/common/views/dashboard/students/status/types";
import { type StudentStatusLabels, useAppTranslation } from "@/shared/locale";

export interface UseStudentStatusViewModelProps {
  readonly student: StudentStatusPageData;
  readonly isUpdating: boolean;
  readonly embedded?: boolean;
  readonly onUpdateStatus: (status: StudentStatus, reason: string) => Promise<void>;
}

export interface StudentStatusViewModel {
  readonly t: StudentStatusLabels;
  readonly student: StudentStatusPageData;
  readonly embedded: boolean;
  readonly isUpdating: boolean;
  readonly canEditStatus: boolean;
  readonly canViewSchedule: boolean;
  readonly hasTabAccess: boolean;
  readonly hasLeftColumn: boolean;
  readonly hasRightColumn: boolean;
  readonly hasContent: boolean;
  readonly selectedStatus: StudentStatus;
  readonly methods: UseFormReturn<StatusUpdateFormData>;
  readonly handleSubmit: (data: StatusUpdateFormData) => Promise<void>;
}

export function useStudentStatusViewModel(props: Readonly<UseStudentStatusViewModelProps>): StudentStatusViewModel {
  const t = useAppTranslation().dashboardTranslations.studentStatus;
  const { canView, canEdit } = useStudentFieldAccess();

  const { student, isUpdating, embedded = false, onUpdateStatus } = props;

  const canEditStatus = canEdit("student_academic");
  const canViewStatus = canView("student_academic");
  const canViewSchedule = canView("student_schedule");
  const hasTabAccess = canViewStudentProfileTab("status", canView);

  const schema = createStatusUpdateSchema(t.validation);

  const methods = useForm<StatusUpdateFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      status: StudentStatus.Regular,
      reason: "",
    },
  });

  const selectedStatus = useWatch({
    control: methods.control,
    name: "status",
    defaultValue: StudentStatus.Regular,
  });

  useEffect(() => {
    methods.reset({
      status: student.status,
      reason: "",
    });
  }, [student, methods]);

  const handleSubmit = async (data: StatusUpdateFormData) => {
    await onUpdateStatus(data.status, data.reason);
    methods.reset({ status: data.status, reason: "" });
  };

  const hasLeftColumn = canEditStatus || (canViewStatus && !canEditStatus);
  const hasRightColumn = canViewSchedule;
  const hasContent = hasLeftColumn || hasRightColumn;

  return {
    t,
    student,
    embedded,
    isUpdating,
    canEditStatus,
    canViewSchedule,
    hasTabAccess,
    hasLeftColumn,
    hasRightColumn,
    hasContent,
    selectedStatus,
    methods,
    handleSubmit,
  };
}
