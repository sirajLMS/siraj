import { StudentStatus } from "@/frontend/common/graphql/generated/gql/graphql";

export const STATUS_BADGE_KEY: Record<StudentStatus, string> = {
  [StudentStatus.Regular]: "regular",
  [StudentStatus.Suspended]: "suspended",
  [StudentStatus.OnLeave]: "on_leave",
  [StudentStatus.OnTrial]: "on_trial",
  [StudentStatus.Deactivated]: "deactivated",
};
