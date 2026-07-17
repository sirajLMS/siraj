"use client";

import { RequirePermission } from "@/frontend/common/components/auth/RequirePermission";
import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { ResourcesView } from "./ResourcesView";

interface ResourcesContainerProps {
  readonly props?: never;
}

export function ResourcesContainer(_props: ResourcesContainerProps) {
  return (
    <RequirePermission permissions={[AppPermission.ResourcesList]} fallback={null}>
      <ResourcesView />
    </RequirePermission>
  );
}
