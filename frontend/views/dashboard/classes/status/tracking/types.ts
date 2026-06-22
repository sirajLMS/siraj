import { type StatusTrackingScheduleRow, StudentStatus } from "@/frontend/graphql/generated/gql/graphql-types";

export type SessionStatus = "regular" | "suspended_pending" | "on_leave" | "pending_verification";

export type StatusTrackingRow = StatusTrackingScheduleRow;

export function computeSessionStatus(
  studentStatus: string | null,
  isFrozen: boolean | null,
  executionState: string | null
): SessionStatus {
  if (isFrozen === true || studentStatus === StudentStatus.Suspended) {
    return "suspended_pending";
  }
  if (studentStatus === StudentStatus.OnLeave) {
    return "on_leave";
  }
  if (executionState === "NOT_ACTIVATED") {
    return "pending_verification";
  }
  return "regular";
}

export function formatScheduleRange(start: string | null, end: string | null): string {
  const fmt = (d: string | null) => {
    if (!d) return "";
    return new Date(d).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  };
  return `${fmt(start)} - ${fmt(end)}`;
}
