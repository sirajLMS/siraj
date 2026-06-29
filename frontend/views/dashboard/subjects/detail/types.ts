import type { PageHeaderBreadcrumb } from "@/frontend/components/ui";
import type { ClassSubjectByIdQuery } from "@/frontend/graphql/generated/gql/operations";

export type SubjectDetailData = NonNullable<ClassSubjectByIdQuery["classSubject"]>;

export type SubjectResourceItem = NonNullable<ClassSubjectByIdQuery["classSubject"]>["resources"] extends Array<
  infer R
> | null
  ? NonNullable<R>
  : never;

export interface SubjectDetailViewProps {
  readonly subject: SubjectDetailData;
  readonly resources: readonly SubjectResourceItem[];
  readonly breadcrumbs: readonly PageHeaderBreadcrumb[];
}

export interface SubjectDetailContainerProps {
  readonly subjectId: string;
}
