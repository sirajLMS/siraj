import type { GridColDef } from "@mui/x-data-grid";
import type { PendingReviewRow } from "@/frontend/common/views/dashboard/supervisor/lesson-reviews/types/pendingReviewsTypes";
import {
  buildParticipantColumns,
  buildReportMetricColumns,
  buildStatusColumns,
} from "@/frontend/desktop/views/dashboard/supervisor/lesson-reviews/pendingReviewColumnBuilders.desktop";
import type { PendingReviewsLabels } from "@/shared/locale";

export type PendingReviewColumnsParams = Readonly<{
  labels: PendingReviewsLabels;
  locale: string;
  approving: boolean;
  onSelectReport: (report: PendingReviewRow) => void;
  onApprove: (reportId: string) => void;
  onOpenRejectDialog: (report: PendingReviewRow) => void;
}>;

export function buildPendingReviewColumns({
  labels,
  locale,
  approving,
  onSelectReport,
  onApprove,
  onOpenRejectDialog,
}: PendingReviewColumnsParams): GridColDef<PendingReviewRow>[] {
  return [
    ...buildParticipantColumns(labels),
    ...buildReportMetricColumns(labels, locale),
    ...buildStatusColumns(labels, approving, onSelectReport, onApprove, onOpenRejectDialog),
  ];
}
