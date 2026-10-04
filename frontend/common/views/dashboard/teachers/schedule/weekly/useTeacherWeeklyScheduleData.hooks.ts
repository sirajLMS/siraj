"use client";

import { useMutation, useQuery } from "@apollo/client/react";
import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql";
import {
  clearWeeklyScheduleMutationDocument,
  deleteRecurringClassMutationDocument,
  teacherDirectoryQueryDocument,
  teacherWeeklyScheduleGridQueryDocument,
  teacherWorkloadMetricsQueryDocument,
} from "@/frontend/common/graphql/sharedDocuments";
import { createRecurringClassMutationDocument } from "@/frontend/common/graphql/sharedDocuments/scheduling/recurring-class.documents";

export type SchedulePermissions = {
  readonly hasScheduleManageTeacher: boolean;
  readonly hasScheduleCreateClass: boolean;
  readonly hasScheduleClearWeekly: boolean;
  readonly hasScheduleViewWorkload: boolean;
  readonly hasScheduleDeleteClass: boolean;
};

export function useSchedulePermissions(hasPermission: (perm: AppPermission) => boolean): SchedulePermissions {
  // Per-button permission booleans: tier views gate on these instead of
  // rendering inline `<RequirePermission>` wrappers for each schedule action.
  return {
    hasScheduleManageTeacher: hasPermission(AppPermission.TeachersManageSchedule),
    hasScheduleCreateClass: hasPermission(AppPermission.ScheduleCreateClass),
    hasScheduleClearWeekly: hasPermission(AppPermission.ScheduleClearWeekly),
    hasScheduleViewWorkload: hasPermission(AppPermission.ScheduleViewWorkload),
    hasScheduleDeleteClass: hasPermission(AppPermission.ScheduleDeleteClass),
  };
}

export function useScheduleQueries(teacherId: string, weekDate: string, hasScheduleManageTeacher: boolean) {
  const {
    data: scheduleData,
    loading: scheduleLoading,
    refetch: refetchSchedule,
  } = useQuery(teacherWeeklyScheduleGridQueryDocument, {
    variables: { teacherId, weekDate },
  });

  const { data: workloadData, refetch: refetchWorkload } = useQuery(teacherWorkloadMetricsQueryDocument, {
    variables: { teacherId, weekDate },
  });

  const { data: directoryData } = useQuery(teacherDirectoryQueryDocument, {
    variables: { search: null, paginationArgs: null },
    skip: !hasScheduleManageTeacher,
  });

  return { scheduleData, scheduleLoading, refetchSchedule, workloadData, refetchWorkload, directoryData };
}

export function useScheduleMutations() {
  const [deleteRecurringClass] = useMutation(deleteRecurringClassMutationDocument);
  const [clearWeeklySchedule] = useMutation(clearWeeklyScheduleMutationDocument);
  const [createClassMutation, { loading: mutationLoading }] = useMutation(createRecurringClassMutationDocument);
  return { deleteRecurringClass, clearWeeklySchedule, createClassMutation, mutationLoading };
}
