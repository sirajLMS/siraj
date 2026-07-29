"use client";

import { RequirePermission } from "@/frontend/common/components/auth/RequirePermission";
import { PAGE_PERMISSIONS } from "@/frontend/common/types/page-permissions.types";
import { ParentsView } from "@/frontend/common/views/dashboard/admin/parents/home/ParentsView";

interface ParentsContainerProps {
  readonly parentId?: string;
}

export function ParentsContainer(_props: ParentsContainerProps) {
  return (
    <RequirePermission permissions={PAGE_PERMISSIONS.parents} fallback={null}>
      <ParentsView />
    </RequirePermission>
  );
}

export type {
  ParentsViewModel,
  UseParentsViewModelProps,
} from "@/frontend/common/views/dashboard/admin/parents/home/ParentsViewTypes";
export { ParentsView };
