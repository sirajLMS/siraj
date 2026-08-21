import type { PageHeaderBreadcrumb } from "@/frontend/common/components/ui/container/page";
import type { ClassSubjectByIdQuery } from "@/frontend/common/graphql/generated/gql/graphql";

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
  readonly onDownloadResource: (resource: SubjectResourceItem) => void;
}

export interface SubjectDetailContainerProps {
  readonly subjectId: string;
}
