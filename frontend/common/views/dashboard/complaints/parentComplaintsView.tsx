"use client";

import { createLazyView } from "@/frontend/common/components/ui/container/createLazyView";
import { ResponsiveViewSwitch } from "@/frontend/common/components/ui/container/ResponsiveViewSwitch";
import {
  type ParentComplaintsViewModel,
  type UseParentComplaintsViewModelProps,
  useParentComplaintsViewModel,
} from "@/frontend/common/views/dashboard/complaints/useParentComplaintsViewModel";

export type { ParentComplaintsViewModel };

const lazyViews = createLazyView<ParentComplaintsViewModel>(
  () =>
    import("@/frontend/mobile/views/dashboard/complaints/parentComplaints.mobile").then(m => ({
      default: m.ParentComplaintsMobileView,
    })),
  () =>
    import("@/frontend/desktop/views/dashboard/complaints/parentComplaints.desktop").then(m => ({
      default: m.ParentComplaintsDesktopView,
    }))
);

export function ParentComplaintsView(props: Readonly<UseParentComplaintsViewModelProps>) {
  const viewModel = useParentComplaintsViewModel(props);
  return <ResponsiveViewSwitch mobile={lazyViews.mobile} desktop={lazyViews.desktop} props={viewModel} />;
}
