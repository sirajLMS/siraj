import { ComputerOutlined, LocationOnOutlined, MeetingRoomOutlined } from "@mui/icons-material";
import type { AcademicClassRow, ClassSessionStatus } from "@/frontend/common/views/dashboard/schedule/alerts/types";
import type { AcademicScheduleCardListMobileLabels } from "@/frontend/mobile/views/dashboard/schedule/alerts/components/academicScheduleCardList.mobile";
import { isJoinableClassInstance } from "@/shared/lib/meeting/isJoinableByExecutionState";

export function shouldShowScheduleAlertJoin(row: AcademicClassRow): boolean {
  if (row.sessionStatus !== "upcoming" && row.sessionStatus !== "active") {
    return false;
  }
  return isJoinableClassInstance(row.executionState, row.outcome, { isFrozen: row.isFrozen ?? false });
}

export function getRoomIcon(room: string) {
  if (room.toLowerCase().includes("lab")) {
    return ComputerOutlined;
  }
  if (room.toLowerCase().includes("room")) {
    return MeetingRoomOutlined;
  }
  return LocationOnOutlined;
}

export function buildClassSessionStatusLabels(
  labels: Readonly<Pick<AcademicScheduleCardListMobileLabels, "active" | "upcoming" | "missed" | "hold">>
): Record<ClassSessionStatus, string> {
  return {
    active: labels.active,
    upcoming: labels.upcoming,
    missed: labels.missed,
    hold: labels.hold,
  };
}
