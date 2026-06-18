import { useTranslations } from "next-intl";
import type { ClassStatus } from "../types/dashboard";

export const useAdminDashboardLabels = () => {
  const t = useTranslations("dashboard");

  const headers = {
    classId: t("admin.classId"),
    student: t("admin.student"),
    teacher: t("admin.teacher"),
    time: t("admin.time"),
    yourTime: t("admin.yourTime"),
    teacherTime: t("admin.teacherTime"),
    studentTime: t("admin.studentTime"),
    status: t("admin.status"),
    actions: t("admin.actions"),
  };

  const statusLabels: Record<ClassStatus, string> = {
    scheduled: t("admin.statusLabels.scheduled"),
    in_progress: t("admin.statusLabels.inProgress"),
    pending: t("admin.statusLabels.pending"),
    completed: t("admin.statusLabels.completed"),
    cancelled: t("admin.statusLabels.cancelled"),
    absent: t("admin.statusLabels.absent"),
  };

  return { headers, statusLabels };
};
