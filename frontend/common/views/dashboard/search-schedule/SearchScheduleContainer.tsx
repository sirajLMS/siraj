"use client";

import { SearchScheduleView } from "@/frontend/common/views/dashboard/search-schedule/SearchScheduleView";
import type { UseSearchScheduleViewModelProps } from "@/frontend/common/views/dashboard/search-schedule/useSearchScheduleViewModel";
import { useSearchScheduleViewModel } from "@/frontend/common/views/dashboard/search-schedule/useSearchScheduleViewModel";

function SearchScheduleAuthorizedContent(props: Readonly<UseSearchScheduleViewModelProps>) {
  const viewModel = useSearchScheduleViewModel(props);
  return <SearchScheduleView {...viewModel} />;
}

export function SearchScheduleContainer(props: Readonly<UseSearchScheduleViewModelProps>) {
  return <SearchScheduleAuthorizedContent {...props} />;
}
