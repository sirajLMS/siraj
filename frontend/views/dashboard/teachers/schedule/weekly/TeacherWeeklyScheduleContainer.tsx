"use client";

import { useMutation, useQuery } from "@apollo/client/react";
import { RequirePermission } from "@/frontend/components/auth/RequirePermission";
import { AppPermission } from "@/frontend/graphql/generated/gql/graphql-types";
import {
  clearWeeklyScheduleMutationDocument,
  deleteRecurringClassMutationDocument,
} from "@/frontend/graphql/sharedDocuments/schedule-deletion.documents";
import { teacherDirectoryQueryDocument } from "@/frontend/graphql/sharedDocuments/staff-directory.documents";
import {
  teacherWeeklyScheduleGridQueryDocument,
  teacherWorkloadMetricsQueryDocument,
} from "@/frontend/graphql/sharedDocuments/weekly-schedule.documents";
import { useCreateRecurringClassStore } from "@/frontend/stores/createRecurringClassStore";
import { useUserStore } from "@/frontend/stores/userStore";
import { useWeeklyScheduleStore } from "@/frontend/stores/weeklyScheduleStore";
import { logger } from "@/frontend/utils/logger";
import { CreateRecurringClassDialog } from "./components/CreateRecurringClassDialog";
import TeacherWeeklyScheduleView from "./TeacherWeeklyScheduleView";

interface TeacherWeeklyScheduleContainerProps {
  readonly teacherId: string;
}

export default function TeacherWeeklyScheduleContainer({ teacherId }: Readonly<TeacherWeeklyScheduleContainerProps>) {
  const { selectedWeekDate } = useWeeklyScheduleStore();
  const { openDialog } = useCreateRecurringClassStore();
  const { name: loggedInUserName, hasPermission } = useUserStore();

  const {
    data: scheduleData,
    loading: scheduleLoading,
    refetch: refetchSchedule,
  } = useQuery(teacherWeeklyScheduleGridQueryDocument, {
    variables: { teacherId, weekDate: selectedWeekDate },
  });

  const { data: workloadData, refetch: refetchWorkload } = useQuery(teacherWorkloadMetricsQueryDocument, {
    variables: { teacherId, weekDate: selectedWeekDate },
  });

  const isAdmin = hasPermission(AppPermission.StaffViewDirectory);

  const { data: directoryData } = useQuery(teacherDirectoryQueryDocument, {
    variables: { search: null, paginationArgs: null },
    skip: !isAdmin,
  });

  const [deleteRecurringClass] = useMutation(deleteRecurringClassMutationDocument);
  const [clearWeeklySchedule] = useMutation(clearWeeklyScheduleMutationDocument);

  const schedule = scheduleData?.teacherWeeklyScheduleGrid;
  const workload = workloadData?.teacherWorkloadMetrics;

  const teacherName =
    directoryData?.teacherDirectory?.rows?.find(r => r?.id === teacherId)?.name || loggedInUserName || "";

  const handleRemoveClass = async (classInstanceId: string) => {
    try {
      await deleteRecurringClass({
        variables: { classInstanceId },
      });
      await refetchSchedule();
      await refetchWorkload();
    } catch (error) {
      logger.error("Failed to delete class instance", { error });
    }
  };

  const handleClearSchedule = async () => {
    try {
      await clearWeeklySchedule({
        variables: { teacherId },
      });
      await refetchSchedule();
      await refetchWorkload();
    } catch (error) {
      logger.error("Failed to clear weekly schedule", { error });
    }
  };

  const handleRefetch = async () => {
    await refetchSchedule();
    await refetchWorkload();
  };

  if (scheduleLoading || !schedule) {
    return null;
  }

  return (
    <RequirePermission permissions={[AppPermission.ScheduleViewWeekly]}>
      <TeacherWeeklyScheduleView
        schedule={{
          teacherId: schedule.teacherId || "",
          teacherName,
          weeklyHoursWorked: workload?.weeklyHoursWorked ?? "0:00",
          classes: (schedule.classes || []).map(c => ({
            id: c.id || "",
            studentName: c.studentName || "",
            studentId: c.studentId || "",
            duration: c.duration || 0,
            startTime: c.startTime || "",
            day: c.day || "",
            executionState: c.executionState,
            outcome: c.outcome,
          })),
          lastUpdated: new Date().toLocaleTimeString(),
        }}
        onRemoveClass={handleRemoveClass}
        onClearSchedule={handleClearSchedule}
        onAddClass={openDialog}
      />
      <CreateRecurringClassDialog teacherId={teacherId} onRefetch={handleRefetch} />
    </RequirePermission>
  );
}
