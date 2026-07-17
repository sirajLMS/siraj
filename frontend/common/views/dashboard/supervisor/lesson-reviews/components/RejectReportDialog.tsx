"use client";

import { createLazyView } from "@/frontend/common/components/ui/container/createLazyView";
import { ResponsiveViewSwitch } from "@/frontend/common/components/ui/container/ResponsiveViewSwitch";
import type { PendingReviewsLabels } from "@/shared/locale";

export interface RejectReportDialogProps {
  readonly open: boolean;
  readonly reason: string;
  readonly loading: boolean;
  readonly labels: PendingReviewsLabels;
  readonly onReasonChange: (value: string) => void;
  readonly onClose: () => void;
  readonly onConfirm: () => void;
}

const lazyViews = createLazyView<RejectReportDialogProps>(
  () =>
    import("@/frontend/mobile/views/dashboard/supervisor/lesson-reviews/components/rejectReportDialog.mobile").then(
      m => ({ default: m.RejectReportDialogMobile })
    ),
  () =>
    import("@/frontend/desktop/views/dashboard/supervisor/lesson-reviews/components/rejectReportDialog.desktop").then(
      m => ({ default: m.RejectReportDialogDesktop })
    )
);

export function RejectReportDialog(props: Readonly<RejectReportDialogProps>) {
  return <ResponsiveViewSwitch mobile={lazyViews.mobile} desktop={lazyViews.desktop} props={props} />;
}
