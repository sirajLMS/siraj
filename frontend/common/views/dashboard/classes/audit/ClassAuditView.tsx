"use client";

import { createLazyView } from "@/frontend/common/components/ui/container/createLazyView";
import { ResponsiveViewSwitch } from "@/frontend/common/components/ui/container/ResponsiveViewSwitch";
import type { ClassAuditViewProps } from "@/frontend/common/views/dashboard/classes/audit/classAuditView.types";
import type { ClassAuditViewModel } from "@/frontend/common/views/dashboard/classes/audit/useClassAuditViewModel";

const lazyViews = createLazyView<ClassAuditViewProps>(
  () =>
    import("@/frontend/mobile/views/dashboard/classes/audit/classAuditView.mobile").then(m => ({
      default: m.ClassAuditViewMobile,
    })),
  () =>
    import("@/frontend/desktop/views/dashboard/classes/audit/classAuditView.desktop").then(m => ({
      default: m.ClassAuditViewDesktop,
    }))
);

function hasClassAuditLabels(labels: object): labels is NonNullable<ClassAuditViewProps["labels"]> {
  return "pageTitle" in labels && "breadcrumbs" in labels;
}

export function ClassAuditView(props: Readonly<ClassAuditViewModel>) {
  if (props.status !== "ready" || !props.audit || !hasClassAuditLabels(props.labels)) {
    return null;
  }

  const viewProps: ClassAuditViewProps = {
    audit: props.audit,
    labels: props.labels,
    onGenerateReport: props.onGenerateReport,
    onEditClass: props.onEditClass,
    onExportStudents: props.onExportStudents,
    onViewStudent: props.onViewStudent,
    onResendNotifications: props.onResendNotifications,
    onUpdateAdminNote: props.onUpdateAdminNote,
    onEditAdminNote: props.onEditAdminNote,
    isResending: props.isResending,
  };

  return <ResponsiveViewSwitch mobile={lazyViews.mobile} desktop={lazyViews.desktop} props={viewProps} />;
}
