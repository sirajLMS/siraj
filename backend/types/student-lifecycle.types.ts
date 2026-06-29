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
  readonly status: string;
  readonly version: number;
}

export const ALLOWED_STATUS_TRANSITIONS: Record<string, readonly string[]> = {
  ON_TRIAL: ["REGULAR", "DEACTIVATED"],
  REGULAR: ["SUSPENDED", "ON_LEAVE", "DEACTIVATED"],
  SUSPENDED: ["REGULAR", "DEACTIVATED"],
  ON_LEAVE: ["REGULAR", "DEACTIVATED"],
  DEACTIVATED: ["REGULAR"],
};
