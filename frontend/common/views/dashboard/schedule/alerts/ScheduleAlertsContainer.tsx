"use client";

import { RequirePermission } from "@/frontend/common/components/auth/RequirePermission";
import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { ScheduleAlertsView } from "@/frontend/common/views/dashboard/schedule/alerts/ScheduleAlertsView";
import type { UseScheduleAlertsViewModelProps } from "@/frontend/common/views/dashboard/schedule/alerts/useScheduleAlertsViewModel";

export function ScheduleAlertsContainer(props: Readonly<UseScheduleAlertsViewModelProps>) {
  return (
    <RequirePermission permissions={[AppPermission.ScheduleViewList]}>
      <ScheduleAlertsView {...props} />
    </RequirePermission>
  );
}

export type { UseScheduleAlertsViewModelProps };
