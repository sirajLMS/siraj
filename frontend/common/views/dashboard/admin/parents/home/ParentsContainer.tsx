"use client";

import { RequirePermission } from "@/frontend/common/components/auth/RequirePermission";
import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { ParentsView } from "@/frontend/common/views/dashboard/admin/parents/home/ParentsView";

interface ParentsContainerProps {
  readonly parentId?: string;
}

export function ParentsContainer(_props: ParentsContainerProps) {
  return (
    <RequirePermission permissions={[AppPermission.ParentsList]} fallback={null}>
      <ParentsView />
    </RequirePermission>
  );
}

export type {
  ParentsViewModel,
  UseParentsViewModelProps,
} from "@/frontend/common/views/dashboard/admin/parents/home/ParentsViewTypes";
export { ParentsView };
