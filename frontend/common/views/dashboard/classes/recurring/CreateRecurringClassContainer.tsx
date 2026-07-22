"use client";

import { RequirePermission } from "@/frontend/common/components/auth/RequirePermission";
import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { CreateRecurringClassView } from "@/frontend/common/views/dashboard/classes/recurring/CreateRecurringClassView";
import {
  type UseCreateRecurringClassViewModelProps,
  useCreateRecurringClassViewModel,
} from "@/frontend/common/views/dashboard/classes/recurring/useCreateRecurringClassViewModel";

export function CreateRecurringClassContainer(props: UseCreateRecurringClassViewModelProps) {
  const viewModel = useCreateRecurringClassViewModel(props);

  return (
    <RequirePermission permissions={[AppPermission.ScheduleManageRecurring]} fallback={null}>
      <CreateRecurringClassView {...viewModel} />
    </RequirePermission>
  );
}
