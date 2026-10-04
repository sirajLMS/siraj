import { ClassExecutionState, StudentStatus } from "@/frontend/common/graphql/generated/gql/graphql";
import { getLatnLocaleTag } from "@/shared/lib/locale-tag";

export enum SessionStatus {
  REGULAR = "regular",
  SUSPENDED_PENDING = "suspended_pending",
  ON_LEAVE = "on_leave",
  PENDING_VERIFICATION = "pending_verification",
}

export function computeSessionStatus(
  studentStatus: string | null,
  isFrozen: boolean | null,
  executionState: string | null
): SessionStatus {
  if (isFrozen === true || studentStatus === StudentStatus.Suspended) {
    return SessionStatus.SUSPENDED_PENDING;
  }
  if (studentStatus === StudentStatus.OnLeave) {
    return SessionStatus.ON_LEAVE;
  }
  if (executionState === ClassExecutionState.NotActivated) {
    return SessionStatus.PENDING_VERIFICATION;
  }
  return SessionStatus.REGULAR;
}

export function formatScheduleRange(start: string | null, end: string | null, locale: string): string {
  const fmt = (d: string | null) => {
    if (!d) return "";
    return new Date(d).toLocaleTimeString(getLatnLocaleTag(locale), { hour: "2-digit", minute: "2-digit" });
  };
  return `${fmt(start)} - ${fmt(end)}`;
}
