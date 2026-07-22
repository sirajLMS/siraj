"use client";

import { RequirePermission } from "@/frontend/common/components/auth/RequirePermission";
import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { ParentSocialView } from "@/frontend/common/views/dashboard/parent/social/ParentSocialView";
import {
  type UseParentSocialViewModelProps,
  useParentSocialViewModel,
} from "@/frontend/common/views/dashboard/parent/social/useParentSocialViewModel";

export function ParentSocialContainer(_props: Readonly<UseParentSocialViewModelProps>) {
  const viewModel = useParentSocialViewModel({});

  return (
    <RequirePermission permissions={[AppPermission.ScheduleViewFamily]} fallback={null}>
      <ParentSocialView {...viewModel} />
    </RequirePermission>
  );
}
