import type { SessionLabels } from "@/shared/locale/types/session";

export const sessionEn: SessionLabels = {
  leaveProcessedDescription: successorId => `Leave request processed, rescheduled to session ${successorId}.`,
  absentWaitingRemark: "Waited through the entire class time.",
  leaveRescheduledRemark: "Leave approved - session rescheduled.",
  resetDescription: "Session reset by admin.",
  absentEventDescription: "Student absence marked after waiting period.",
  autoMissedEventDescription: "Class automatically marked as missed after the activation grace period.",
  manualRescheduleDescription: newStart => `Class manually rescheduled to ${newStart} by admin.`,
  manualRescheduleRemark: (oldStart, newStart) => `Reschedule: moved from ${oldStart} to ${newStart}.`,
  activateDescription: "Activated",
  forceActivateDescription: "Force activated",
  startDescription: "Start class",
  stopDescription: "Manual stop",
  softDeleteDescription: "Soft delete",
  teacherQuotaExhaustedNote: (used, max) =>
    `[Manager reschedule] Teacher exhausted monthly leave quota (${used}/${max}).`,
  classTypes: {
    REGULAR: "Regular Class",
    TRIAL: "Trial Class",
    ADVANCE: "Advance Class",
  },
};
