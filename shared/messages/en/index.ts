import { reports } from "@/shared/messages/en/dashboard/reports";
import { errors } from "@/shared/messages/en/errors";
import type { SessionLabels } from "@/shared/messages/types/session";

export const session: SessionLabels = {
  leaveProcessedDescription: "Leave request processed, rescheduled to session {successorId}.",
  absentWaitingRemark: "Waited through the entire class time.",
  leaveRescheduledRemark: "Leave approved - session rescheduled.",
  resetDescription: "Session reset by admin.",
  absentEventDescription: "Student absence marked after waiting period.",
  autoMissedEventDescription: "Class automatically marked as missed after the activation grace period.",
  manualRescheduleDescription: "Class manually rescheduled to {newStart} by admin.",
  manualRescheduleRemark: "Reschedule: moved from {oldStart} to {newStart}.",
  activateDescription: "Activated",
  forceActivateDescription: "Force activated",
  startDescription: "Start class",
  stopDescription: "Manual stop",
  softDeleteDescription: "Soft delete",
  teacherQuotaExhaustedNote: "[Manager reschedule] Teacher exhausted monthly leave quota ({used}/{max}).",
  classTypes: {
    REGULAR: "Regular Class",
    TRIAL: "Trial Class",
    ADVANCE: "Advance Class",
  },
};

export const enTranslations = {
  errors,
  session,
  dashboard: {
    reports,
  },
};

export default enTranslations;
