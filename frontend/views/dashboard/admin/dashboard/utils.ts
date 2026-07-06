import { useTranslations } from "next-intl";
import { buildClassInstanceStatusLabels } from "@/frontend/views/dashboard/utils/classInstanceStatusLabels";

export const useAdminDashboardLabels = () => {
  const t = useTranslations("dashboard");

  const headers = {
    student: t("admin.student"),
    teacher: t("admin.teacher"),
    time: t("admin.time"),
    yourTime: t("admin.yourTime"),
    teacherTime: t("admin.teacherTime"),
    studentTime: t("admin.studentTime"),
    duration: t("admin.duration"),
    status: t("admin.status"),
    actions: t("admin.actions"),
    history: t("admin.history"),
  };

  const statusLabels = buildClassInstanceStatusLabels(t);

  return { headers, statusLabels };
};
