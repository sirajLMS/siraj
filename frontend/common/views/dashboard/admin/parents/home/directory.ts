import { ParentStatus } from "@/frontend/common/graphql/generated/gql/graphql-types";
import type {
  ParentAccountStatusKey,
  ParentCardListLabels,
  ParentDirectoryRow,
  ParentsDataGridLabels,
} from "@/frontend/common/views/dashboard/admin/parents/home/ParentsViewTypes";
import type { ParentLifecycleStatus } from "@/frontend/common/views/dashboard/types/parent.types";

export type {
  ParentAccountStatusKey,
  ParentCardListLabels,
  ParentDirectoryRow,
  ParentLifecycleStatus,
  ParentsDataGridLabels,
};

const VALID_PARENT_LIFECYCLE_STATUSES = new Set(Object.values(ParentStatus).map(v => v.toLowerCase()));

function isParentLifecycleStatus(value: string): value is ParentLifecycleStatus {
  return VALID_PARENT_LIFECYCLE_STATUSES.has(value);
}

export function toParentLifecycleStatus(status: ParentStatus): ParentLifecycleStatus {
  const lowered = status.toLowerCase();
  if (isParentLifecycleStatus(lowered)) {
    return lowered;
  }
  throw new Error(`Unknown ParentStatus: ${status}`);
}

export { toParentAccountStatusKey } from "@/frontend/common/views/dashboard/admin/parents/home/ParentsViewTypes";
