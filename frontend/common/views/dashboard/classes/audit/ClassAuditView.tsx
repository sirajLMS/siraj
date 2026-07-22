"use client";

import { createLazyView } from "@/frontend/common/components/ui/container/createLazyView";
import { ResponsiveViewSwitch } from "@/frontend/common/components/ui/container/ResponsiveViewSwitch";
import type { ClassAuditViewModel } from "@/frontend/common/views/dashboard/classes/audit/useClassAuditViewModel";

const lazyViews = createLazyView<ClassAuditViewModel>(
  () =>
    import("@/frontend/mobile/views/dashboard/classes/audit/classAuditView.mobile").then(m => ({
      default: m.ClassAuditViewMobile,
    })),
  () =>
    import("@/frontend/desktop/views/dashboard/classes/audit/classAuditView.desktop").then(m => ({
      default: m.ClassAuditViewDesktop,
    }))
);

export function ClassAuditView(props: Readonly<ClassAuditViewModel>) {
  return <ResponsiveViewSwitch mobile={lazyViews.mobile} desktop={lazyViews.desktop} props={props} />;
}
