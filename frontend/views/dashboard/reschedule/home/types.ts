import type {
  ClassInstanceDetail,
  ClassInstanceStudentInfo,
  ClassInstanceTeacherInfo,
} from "@/frontend/graphql/generated/gql/graphql-types";

export interface RescheduleSession {
  readonly sessionId: NonNullable<ClassInstanceDetail["id"]>;
  readonly teacherName: NonNullable<NonNullable<ClassInstanceTeacherInfo>["name"]>;
  readonly studentName: NonNullable<NonNullable<ClassInstanceStudentInfo>["name"]>;
  readonly teacherTimezone: NonNullable<ClassInstanceDetail["teacherTimezone"]>;
}
