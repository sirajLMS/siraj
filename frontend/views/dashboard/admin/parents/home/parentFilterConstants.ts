import { ParentStatus } from "@/frontend/graphql/generated/gql/graphql-types";
import type { ParentLifecycleStatus } from "@/frontend/views/dashboard/types/parent.types";

export const LIFECYCLE_STATUS_FILTER_OPTIONS: readonly ParentStatus[] = [
  ParentStatus.Regular,
  ParentStatus.OnLeave,
  ParentStatus.Suspended,
  ParentStatus.OnTrial,
];

export type { ParentLifecycleStatus };
