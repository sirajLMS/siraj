import { type StudentByIdQuery, StudentStatus } from "@/frontend/common/graphql/generated/gql/graphql";
import { STUDENT_STATUS_TO_ACCOUNT_STATUS } from "@/frontend/common/views/dashboard/admin/parents/students/types";
import type { ReassignmentStudentData } from "@/frontend/common/views/dashboard/teachers/reassignment/types";

type StudentQueryData = StudentByIdQuery;

// Sentinel used while the GraphQL fetch is in flight: the Container invokes the
// ViewModel unconditionally (Rules of Hooks), and the loading/error early
// returns short-circuit rendering before the view ever sees it.
export const EMPTY_STUDENT: ReassignmentStudentData = {
  id: "",
  name: "",
  avatarUrl: null,
  accountStatus: "deactivated",
  status: StudentStatus.Regular,
  primaryTeacherId: null,
  teacherName: null,
  version: null,
  updatedAt: null,
};

export function mapStudentData(studentData: StudentQueryData | undefined): ReassignmentStudentData | null {
  const s = studentData?.studentById;
  if (!s?.id || !s.name || !s.status) return null;
  const status = s.status;
  return {
    id: s.id,
    name: s.name,
    avatarUrl: null,
    accountStatus: STUDENT_STATUS_TO_ACCOUNT_STATUS[status],
    status,
    primaryTeacherId: s.primaryTeacherId ?? null,
    teacherName: s.teacherName ?? null,
    version: s.version ?? null,
    updatedAt: s.updatedAt ?? null,
  };
}
