import { StudentStatus } from "@/shared/constants/student-lifecycle.enum";
export { StudentStatus };

/**
 * Allowed lifecycle transitions for a student.
 * Backend-only policy map (no shared equivalent); kept here alongside the
 * re-exported StudentStatus enum it indexes.
 */
export const ALLOWED_STATUS_TRANSITIONS: Record<StudentStatus, readonly StudentStatus[]> = {
  [StudentStatus.ON_TRIAL]: [StudentStatus.REGULAR, StudentStatus.DEACTIVATED],
  [StudentStatus.REGULAR]: [StudentStatus.SUSPENDED, StudentStatus.ON_LEAVE, StudentStatus.DEACTIVATED],
  [StudentStatus.SUSPENDED]: [StudentStatus.REGULAR, StudentStatus.DEACTIVATED],
  [StudentStatus.ON_LEAVE]: [StudentStatus.REGULAR, StudentStatus.DEACTIVATED],
  [StudentStatus.DEACTIVATED]: [StudentStatus.REGULAR],
};
