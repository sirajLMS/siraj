"use client";

import { RecurringSchedulesListView } from "@/frontend/common/views/dashboard/classes/recurring/RecurringSchedulesListView";
import type { UseRecurringSchedulesListViewModelProps } from "@/frontend/common/views/dashboard/classes/recurring/types/recurringSchedulesListViewModel.types";
import { useRecurringSchedulesListViewModel } from "@/frontend/common/views/dashboard/classes/recurring/useRecurringSchedulesListViewModel";

export function RecurringSchedulesListContainer(props: UseRecurringSchedulesListViewModelProps) {
  const viewModel = useRecurringSchedulesListViewModel(props);

  return <RecurringSchedulesListView {...viewModel} />;
}
