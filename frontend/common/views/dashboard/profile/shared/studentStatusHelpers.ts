import { AccountStatus, StudentStatus } from "@/frontend/common/graphql/generated/gql/graphql";
import type { StudentStatusLabels } from "@/shared/locale/types/dashboard/students/status";

export const STUDENT_STATUS_OPTIONS = [
  StudentStatus.Regular,
  StudentStatus.Suspended,
  StudentStatus.OnLeave,
  StudentStatus.OnTrial,
  StudentStatus.Deactivated,
] as const;

export function getStudentStatusLabel(status: string | null, tStatus: StudentStatusLabels): string {
  const statusLabels: Record<string, string> = {
    [StudentStatus.Regular]: tStatus.statusOptions.REGULAR,
    [StudentStatus.OnLeave]: tStatus.statusOptions.ON_LEAVE,
    [StudentStatus.Suspended]: tStatus.statusOptions.SUSPENDED,
    [StudentStatus.OnTrial]: tStatus.statusOptions.ON_TRIAL,
    [StudentStatus.Deactivated]: tStatus.statusOptions.DEACTIVATED,
  };
  return status ? statusLabels[status] : "";
}

export function getStudentStatusColor(
  status: string | null
): "activated" | "deactivated" | "suspended" | "on_leave" | "on_trial" {
  switch (status) {
    case StudentStatus.Regular:
      return "activated";
    case StudentStatus.Deactivated:
      return "deactivated";
    case StudentStatus.Suspended:
      return "suspended";
    case StudentStatus.OnLeave:
      return "on_leave";
    case StudentStatus.OnTrial:
      return "on_trial";
    default:
      return "activated";
  }
}

/**
 * Maps a raw DB status string to the account-status value the shared admin
 * section select expects: only a deactivated account edits as deactivated,
 * every other lifecycle state (or an unset value) edits as activated.
 */
const ACCOUNT_STATUS_EDIT_DEFAULT_BY_STATUS: Record<string, AccountStatus> = {
  [StudentStatus.Deactivated]: AccountStatus.Deactivated,
};

export function toAccountStatusDefaultValue(status: string | null): AccountStatus {
  if (status != null && status in ACCOUNT_STATUS_EDIT_DEFAULT_BY_STATUS) {
    return ACCOUNT_STATUS_EDIT_DEFAULT_BY_STATUS[status];
  }
  return AccountStatus.Activated;
}
