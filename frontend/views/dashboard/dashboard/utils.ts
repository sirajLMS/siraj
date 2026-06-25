import { useTranslations } from "next-intl";
import { ClassExecutionState, ClassOutcome } from "@/frontend/graphql/generated/gql/graphql-types";

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

  const statusLabels: Record<ClassOutcome | ClassExecutionState, string> = {
    [ClassOutcome.Pending]: t("admin.statusLabels.PENDING"),
    [ClassOutcome.Taken]: t("admin.statusLabels.TAKEN"),
    [ClassOutcome.Absent]: t("admin.statusLabels.ABSENT"),
    [ClassOutcome.Leave]: t("admin.statusLabels.LEAVE"),
    [ClassExecutionState.NotActivated]: t("admin.statusLabels.NOT_ACTIVATED"),
    [ClassExecutionState.Activated]: t("admin.statusLabels.ACTIVATED"),
    [ClassExecutionState.Running]: t("admin.statusLabels.RUNNING"),
    [ClassExecutionState.Completed]: t("admin.statusLabels.COMPLETED"),
  };

  return { headers, statusLabels };
};
