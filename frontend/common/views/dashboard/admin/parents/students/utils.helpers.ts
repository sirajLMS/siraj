import { type StudentDirectoryQuery, StudentStatus } from "@/frontend/common/graphql/generated/gql/graphql";
import {
  StudentEnrollmentStatus as EnrollmentEnum,
  type StudentEnrollmentStatus,
} from "@/frontend/common/views/dashboard/admin/parents/students/types";

const STUDENT_STATUS_VALUES: readonly string[] = Object.values(StudentStatus);

export type RawStudentRow = NonNullable<NonNullable<StudentDirectoryQuery["studentDirectory"]>["rows"]>[number];

export function isStudentStatus(value: string): value is StudentStatus {
  return STUDENT_STATUS_VALUES.includes(value);
}

export function getEnrollmentStatus(status: string | null | undefined): StudentEnrollmentStatus {
  if (!status) return EnrollmentEnum.REGULAR;
  const upper = status.toUpperCase();
  if (!isStudentStatus(upper)) return EnrollmentEnum.REGULAR;
  if (upper === StudentStatus.Deactivated) return EnrollmentEnum.WITHDRAWN;
  if (upper === StudentStatus.OnTrial) return EnrollmentEnum.PROSPECT;
  return EnrollmentEnum.REGULAR;
}
