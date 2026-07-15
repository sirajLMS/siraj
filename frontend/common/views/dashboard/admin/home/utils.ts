"use client";

import { buildClassInstanceStatusLabels } from "@/frontend/common/views/dashboard/utils/classInstanceStatusLabels";
import { useAppTranslation } from "@/shared/locale/client";

export const useAdminDashboardLabels = () => {
  const t = useAppTranslation("dashboard.admin");

  const headers = {
    student: t.student,
    teacher: t.teacher,
    time: t.time,
    yourTime: t.yourTime,
    teacherTime: t.teacherTime,
    studentTime: t.studentTime,
    duration: t.duration,
    status: t.status,
    actions: t.actions,
    history: t.history,
    joinVideo: t.joinVideo,
  };

  const statusLabels = buildClassInstanceStatusLabels(t.statusLabels);

  return { headers, statusLabels };
};
