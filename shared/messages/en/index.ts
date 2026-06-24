import type { SessionLabels } from "../types/session";
import { errors } from "./errors";

export const session: SessionLabels = {
  leaveProcessedDescription: "Leave request processed, rescheduled to session {successorId}.",
  absentWaitingRemark: "Waited through the entire class time.",
  leaveRescheduledRemark: "Leave approved - session rescheduled.",
  resetDescription: "Session reset by admin.",
  absentEventDescription: "Student absence marked after waiting period.",
  manualRescheduleDescription: "Class manually rescheduled to {newStart} by admin.",
  manualRescheduleRemark: "Reschedule: moved from {oldStart} to {newStart}.",
  activateDescription: "Activated",
  forceActivateDescription: "Force activated",
  startDescription: "Start class",
  stopDescription: "Manual stop",
  softDeleteDescription: "Soft delete",
  teacherQuotaExhaustedNote: "[Manager reschedule] Teacher exhausted monthly leave quota ({used}/{max}).",
};

export const enTranslations = {
  errors,
  session,
};

export default enTranslations;
