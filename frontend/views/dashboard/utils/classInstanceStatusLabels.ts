import { ClassExecutionState, ClassOutcome } from "@/frontend/common/graphql/generated/gql/graphql-types";

type DashboardTranslator = (key: string) => string;

export function buildClassInstanceStatusLabels(
  t: DashboardTranslator
): Record<ClassOutcome | ClassExecutionState, string> {
  return {
    [ClassOutcome.Pending]: t("admin.statusLabels.PENDING"),
    [ClassOutcome.Taken]: t("admin.statusLabels.TAKEN"),
    [ClassOutcome.Absent]: t("admin.statusLabels.ABSENT"),
    [ClassOutcome.Leave]: t("admin.statusLabels.LEAVE"),
    [ClassExecutionState.NotActivated]: t("admin.statusLabels.NOT_ACTIVATED"),
    [ClassExecutionState.Activated]: t("admin.statusLabels.ACTIVATED"),
    [ClassExecutionState.Running]: t("admin.statusLabels.RUNNING"),
    [ClassExecutionState.Completed]: t("admin.statusLabels.COMPLETED"),
  };
}
