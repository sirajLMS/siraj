import { ParentStatus } from "@/frontend/common/graphql/generated/gql/graphql-types";
import type { ParentLifecycleStatus } from "@/frontend/common/views/dashboard/types/parent.types";

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
