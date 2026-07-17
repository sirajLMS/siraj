"use client";

import { RequirePermission } from "@/frontend/common/components/auth/RequirePermission";
import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { ParentsView } from "./ParentsView";

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

export type { ParentsViewModel, UseParentsViewModelProps } from "./ParentsViewTypes";
export { ParentsView };
