"use client";

import { RequirePermission } from "@/frontend/common/components/auth/RequirePermission";
import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { ParentRulesView } from "@/frontend/common/views/dashboard/parent/rules/ParentRulesView";
import {
  type ParentRulesViewModel,
  type UseParentRulesViewModelProps,
  useParentRulesViewModel,
} from "@/frontend/common/views/dashboard/parent/rules/useParentRulesViewModel";

export function ParentRulesContainer(_props: Readonly<UseParentRulesViewModelProps>) {
  const viewModel = useParentRulesViewModel({});

  return (
    <RequirePermission permissions={[AppPermission.ScheduleViewFamily]} fallback={null}>
      <ParentRulesView {...viewModel} />
    </RequirePermission>
  );
}

export type { ParentRulesViewModel, UseParentRulesViewModelProps };
