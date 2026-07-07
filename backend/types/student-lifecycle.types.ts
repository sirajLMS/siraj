import type { StudentStatus } from "@/shared/lib/enum";

export { ALLOWED_STATUS_TRANSITIONS } from "@/shared/lib/enum";

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
