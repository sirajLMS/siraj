import type { ClassSubjectByIdQuery } from "@/frontend/common/graphql/generated/gql/graphql";

export type SubjectDetailData = NonNullable<ClassSubjectByIdQuery["classSubject"]>;

export type SubjectResourceItem = NonNullable<ClassSubjectByIdQuery["classSubject"]>["resources"] extends Array<
  infer R
> | null
  ? NonNullable<R>
  : never;
