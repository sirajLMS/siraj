"use client";

import { RequirePermission } from "@/frontend/common/components/auth/RequirePermission";
import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { SearchScheduleView } from "@/frontend/common/views/dashboard/search-schedule/SearchScheduleView";

export function SearchScheduleContainer() {
  return (
    <RequirePermission permissions={[AppPermission.ScheduleSearchAvailability]}>
      <SearchScheduleView requiredPermission={AppPermission.ScheduleSearchAvailability} />
    </RequirePermission>
  );
}
