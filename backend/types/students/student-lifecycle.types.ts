import type { StudentStatus } from "@/backend/enum";

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
