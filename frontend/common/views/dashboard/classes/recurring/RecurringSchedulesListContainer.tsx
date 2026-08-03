"use client";

import { RequirePermission } from "@/frontend/common/components/auth/RequirePermission";
import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { RecurringSchedulesListView } from "@/frontend/common/views/dashboard/classes/recurring/RecurringSchedulesListView";
import {
  type UseRecurringSchedulesListViewModelProps,
  useRecurringSchedulesListViewModel,
} from "@/frontend/common/views/dashboard/classes/recurring/useRecurringSchedulesListViewModel";

export function RecurringSchedulesListContainer(props: UseRecurringSchedulesListViewModelProps) {
  const viewModel = useRecurringSchedulesListViewModel(props);

  return (
    <RequirePermission permissions={[AppPermission.ScheduleViewList]} fallback={null}>
      <RecurringSchedulesListView {...viewModel} />
    </RequirePermission>
  );
}
