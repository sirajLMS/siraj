"use client";

import { createLazyView } from "@/frontend/common/components/ui/container/createLazyView";
import { ResponsiveViewSwitch } from "@/frontend/common/components/ui/container/ResponsiveViewSwitch";
import type { ClassAuditViewProps } from "@/frontend/views/dashboard/classes/audit/classAuditView.types";

export type {
  ClassAuditLabels,
  ClassAuditViewProps,
} from "@/frontend/views/dashboard/classes/audit/classAuditView.types";

const lazyViews = createLazyView<ClassAuditViewProps>(
  () =>
    import("@/frontend/mobile/views/dashboard/classes/audit/classAuditView.mobile").then(m => ({
      default: m.ClassAuditViewMobile,
    })),
  () =>
    import("@/frontend/views/dashboard/classes/audit/classAuditView.desktop").then(m => ({
      default: m.ClassAuditViewDesktop,
    }))
);

export function ClassAuditView(props: Readonly<ClassAuditViewProps>) {
  return <ResponsiveViewSwitch mobile={lazyViews.mobile} desktop={lazyViews.desktop} props={props} />;
}
