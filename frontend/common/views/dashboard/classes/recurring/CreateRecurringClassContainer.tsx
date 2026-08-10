"use client";

import { CreateRecurringClassView } from "@/frontend/common/views/dashboard/classes/recurring/CreateRecurringClassView";
import {
  type UseCreateRecurringClassViewModelProps,
  useCreateRecurringClassViewModel,
} from "@/frontend/common/views/dashboard/classes/recurring/useCreateRecurringClassViewModel";

export function CreateRecurringClassContainer(props: UseCreateRecurringClassViewModelProps) {
  const viewModel = useCreateRecurringClassViewModel(props);

  return <CreateRecurringClassView {...viewModel} />;
}
