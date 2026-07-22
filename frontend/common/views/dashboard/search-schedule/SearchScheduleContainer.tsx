"use client";

import { RequirePermission } from "@/frontend/common/components/auth/RequirePermission";
import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { SearchScheduleView } from "@/frontend/common/views/dashboard/search-schedule/SearchScheduleView";
import type { UseSearchScheduleViewModelProps } from "@/frontend/common/views/dashboard/search-schedule/useSearchScheduleViewModel";
import { useSearchScheduleViewModel } from "@/frontend/common/views/dashboard/search-schedule/useSearchScheduleViewModel";

export function SearchScheduleContainer(props: Readonly<UseSearchScheduleViewModelProps>) {
  const viewModel = useSearchScheduleViewModel(props);
  return (
    <RequirePermission permissions={[AppPermission.ScheduleSearchAvailability]}>
      <SearchScheduleView {...viewModel} />
    </RequirePermission>
  );
}
