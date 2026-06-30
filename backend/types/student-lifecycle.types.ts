import { StudentStatus } from "@/shared/lib/enum";

export interface LeaveProcessingResult {
  readonly processedCount: number;
  readonly successorIds: string[];
}

export interface ReassignStudentTeacherResult {
  readonly id: string;
  readonly primaryTeacherId: string | null;
  readonly version: number;
}

export interface ChangeStudentStatusResult {
  readonly id: string;
  readonly status: StudentStatus;
  readonly version: number;
}

export const ALLOWED_STATUS_TRANSITIONS: Record<StudentStatus, readonly StudentStatus[]> = {
  [StudentStatus.ON_TRIAL]: [StudentStatus.REGULAR, StudentStatus.DEACTIVATED],
  [StudentStatus.REGULAR]: [StudentStatus.SUSPENDED, StudentStatus.ON_LEAVE, StudentStatus.DEACTIVATED],
  [StudentStatus.SUSPENDED]: [StudentStatus.REGULAR, StudentStatus.DEACTIVATED],
  [StudentStatus.ON_LEAVE]: [StudentStatus.REGULAR, StudentStatus.DEACTIVATED],
  [StudentStatus.DEACTIVATED]: [StudentStatus.REGULAR],
};
