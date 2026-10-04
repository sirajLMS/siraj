import type { AdminDashboardLabelsBySection } from "@/frontend/common/views/dashboard/admin/home/types/adminDashboard.types";
import { buildClassInstanceStatusLabels } from "@/frontend/common/views/dashboard/utils/classInstanceStatusLabels";
import type { AdminDashboardLabels } from "@/shared/locale";

/** Groups flat admin dashboard copy into the sectioned shape consumed by the tier views and columns. */
export function buildAdminDashboardLabelsBySection(labels: AdminDashboardLabels): AdminDashboardLabelsBySection {
  return {
    shell: {
      todayClasses: labels.todayClasses,
      scheduleOverview: labels.scheduleOverview,
      searchPlaceholder: labels.searchPlaceholder,
      noClasses: labels.noClasses,
      details: labels.details,
      loading: labels.loading,
    },
    filters: {
      listOfClassesOn: labels.listOfClassesOn,
      today: labels.today,
      previousDay: labels.previousDay,
      nextDay: labels.nextDay,
      selectTeacher: labels.selectTeacher,
      submit: labels.submit,
    },
    columns: {
      className: labels.className,
      student: labels.student,
      teacher: labels.teacher,
      time: labels.time,
      yourTime: labels.yourTime,
      teacherTime: labels.teacherTime,
      studentTime: labels.studentTime,
      duration: labels.duration,
      status: labels.status,
      actions: labels.actions,
      history: labels.history,
      joinVideo: labels.joinVideo,
    },
    status: buildClassInstanceStatusLabels(labels.statusLabels),
    metrics: labels.metrics,
  };
}
