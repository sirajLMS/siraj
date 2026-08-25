"use client";

import { useQuery } from "@apollo/client/react";
import { createLazyView } from "@/frontend/common/components/ui/container/createLazyView";
import { ResponsiveViewSwitch } from "@/frontend/common/components/ui/container/ResponsiveViewSwitch";
import { myLeaveRequestsQueryDocument } from "@/frontend/common/graphql/sharedDocuments";
import type {
  LeaveRequestRow,
  LeaveRequestsViewModel,
} from "@/frontend/common/views/dashboard/scheduling/leave-requests/useLeaveRequestsViewModel";
import { useAppTranslation } from "@/shared/locale/client/use-app-translation";
import { Translation } from "@/shared/locale/namespaces/translation";

const lazyViews = createLazyView<LeaveRequestsViewModel>(
  () =>
    import("@/frontend/mobile/views/dashboard/scheduling/leaveRequests.mobile").then(m => ({
      default: m.LeaveRequestsMobileView,
    })),
  () =>
    import("@/frontend/desktop/views/dashboard/scheduling/leaveRequests.desktop").then(m => ({
      default: m.LeaveRequestsDesktopView,
    }))
);

export function LeaveRequestsContainer() {
  const labels = useAppTranslation(Translation.Dashboard.SelfServiceReschedule);

  const { data, loading, error } = useQuery(myLeaveRequestsQueryDocument, {
    fetchPolicy: "cache-and-network",
  });

  const requests: readonly LeaveRequestRow[] =
    data?.myLeaveRequests?.map(r => ({
      id: r.id ?? "",
      classInstanceId: r.classInstanceId ?? "",
      requesterType: r.requesterType ?? "",
      requestType: r.requestType ?? null,
      proposedStartAt: r.proposedStartAt ?? null,
      reason: r.reason ?? null,
      status: r.status ?? "",
      createdAt: r.createdAt ?? "",
      processedAt: r.processedAt ?? null,
    })) ?? [];

  const viewModel: LeaveRequestsViewModel = {
    labels,
    requests,
    loading,
    error: Boolean(error) && !data,
  };

  return <ResponsiveViewSwitch mobile={lazyViews.mobile} desktop={lazyViews.desktop} props={viewModel} />;
}
