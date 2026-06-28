import type { ClassInstanceDetail as GqlClassInstanceDetail } from "@/frontend/graphql/generated/gql/graphql-types";

export type RescheduleSession = Pick<
  GqlClassInstanceDetail,
  "id" | "studentTimezone" | "teacherTimezone"
> & {
  readonly teacherName: string;
  readonly studentName: string;
};
