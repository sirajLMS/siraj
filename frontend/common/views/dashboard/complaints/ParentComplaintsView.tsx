"use client";
import { createLazyView } from "@/frontend/common/components/ui/container/createLazyView";
import { ResponsiveViewSwitch } from "@/frontend/common/components/ui/container/ResponsiveViewSwitch";
import type { ParentComplaintsViewModel } from "@/frontend/common/views/dashboard/complaints/useParentComplaintsViewModel";

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

export function ParentComplaintsView(props: Readonly<ParentComplaintsViewModel>) {
  return <ResponsiveViewSwitch mobile={lazyViews.mobile} desktop={lazyViews.desktop} props={props} />;
}
export type { ParentComplaintsViewModel };
