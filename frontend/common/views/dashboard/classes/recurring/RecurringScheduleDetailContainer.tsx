"use client";

import { RecurringScheduleDetailView } from "@/frontend/common/views/dashboard/classes/recurring/RecurringScheduleDetailView";
import {
  type UseRecurringScheduleDetailViewModelProps,
  useRecurringScheduleDetailViewModel,
} from "@/frontend/common/views/dashboard/classes/recurring/useRecurringScheduleDetailViewModel";

export function RecurringScheduleDetailContainer(props: UseRecurringScheduleDetailViewModelProps) {
  const viewModel = useRecurringScheduleDetailViewModel(props);

  return <RecurringScheduleDetailView {...viewModel} />;
}
