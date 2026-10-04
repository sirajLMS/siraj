import { AccountStatus, CurrencyCode } from "@/frontend/common/graphql/generated/gql/graphql";
import { teacherAssignedStudentsQueryDocument } from "@/frontend/common/graphql/sharedDocuments/teachers";
import { useUserStore } from "@/frontend/common/stores/userStore";

const mockStudentRows = [
  {
    __typename: "TeacherAssignedStudent" as const,
    id: "stu-001",
    name: "Ahmed Hassan",
    status: "ACTIVE",
    hoursPerWeek: 4,
    classesRemaining: 12,
    classesTotal: 20,
  },
  {
    __typename: "TeacherAssignedStudent" as const,
    id: "stu-002",
    name: "Khalid Omar",
    status: "ACTIVE",
    hoursPerWeek: 2,
    classesRemaining: 0,
    classesTotal: 10,
  },
];

export const defaultMocks = [
  {
    request: { query: teacherAssignedStudentsQueryDocument },
    result: {
      data: {
        teacherAssignedStudents: {
          __typename: "TeacherAssignedStudentsResult" as const,
          id: "teacher-assigned-001",
          totalCount: 2,
          rows: mockStudentRows,
        },
      },
    },
  },
];

export const emptyMocks = [
  {
    request: { query: teacherAssignedStudentsQueryDocument },
    result: {
      data: {
        teacherAssignedStudents: {
          __typename: "TeacherAssignedStudentsResult" as const,
          id: "teacher-assigned-empty",
          totalCount: 0,
          rows: [],
        },
      },
    },
  },
];

export function setTeacherUser() {
  useUserStore.setState({
    role: "TEACHER",
    permissions: [],
    displayCurrency: CurrencyCode.Usd,
    user: {
      id: "teacher-001",
      name: "Ustadh Yusuf",
      role: "TEACHER",
      avatarUrl: null,
      permissions: [],
      notificationCount: 0,
      teacherId: "teacher-001",
      parentId: null,
      createdAt: "2025-01-01T00:00:00.000Z",
      updatedAt: "2025-06-01T00:00:00.000Z",
      emailVerifiedAt: null,
      email: null,
      phone: null,
      status: AccountStatus.Activated,
      displayCurrency: CurrencyCode.Usd,
    },
  });
}
