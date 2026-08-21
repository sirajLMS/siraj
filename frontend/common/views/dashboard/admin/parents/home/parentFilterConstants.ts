import { ParentStatus } from "@/frontend/common/graphql/generated/gql/graphql";

export const LIFECYCLE_STATUS_FILTER_OPTIONS: readonly ParentStatus[] = [
  ParentStatus.Regular,
  ParentStatus.OnLeave,
  ParentStatus.Suspended,
  ParentStatus.OnTrial,
];
