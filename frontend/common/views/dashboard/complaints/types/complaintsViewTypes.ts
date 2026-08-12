import type {
  AdminComplaintRow,
  AdminComplaintsSummary,
  ComplaintTab,
} from "@/frontend/common/views/dashboard/complaints/types/complaints.types";
import type { ComplaintsLabels } from "@/shared/locale/types/dashboard/complaints";

export interface DeleteComplaintDialogLabels {
  readonly deleteConfirmTitle: string;
  readonly deleteConfirmBody: string;
  readonly deleteConfirmCancel: string;
  readonly deleteConfirmConfirm: string;
}

export interface DeleteComplaintDialogProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly onConfirm: () => void;
  readonly isDeleting: boolean;
  readonly labels: DeleteComplaintDialogLabels;
}

export function buildDeleteComplaintDialogLabels(
  queueLabels: ComplaintsLabels["admin"]["queue"]
): DeleteComplaintDialogLabels {
  return {
    deleteConfirmTitle: queueLabels.deleteConfirmTitle,
    deleteConfirmBody: queueLabels.deleteConfirmBody,
    deleteConfirmCancel: queueLabels.deleteConfirmCancel,
    deleteConfirmConfirm: queueLabels.deleteConfirmConfirm,
  };
}

export interface AdminComplaintsViewProps {
  readonly labels: ComplaintsLabels["admin"];
  readonly summary: AdminComplaintsSummary;
  readonly rows: readonly AdminComplaintRow[];
  readonly searchQuery: string;
  readonly activeTab: ComplaintTab;
  readonly draftResponses: Readonly<Record<string, string>>;
  readonly canManage: boolean;
  readonly canDelete: boolean;
  readonly page: number;
  readonly pageSize: number;
  readonly totalCount: number;
  readonly onSearchChange: (query: string) => void;
  readonly onTabChange: (tab: ComplaintTab) => void;
  readonly onDraftChange: (id: string, text: string) => void;
  readonly onAnswer: (id: string, options: { readonly sendEmail: boolean }) => void;
  readonly onDelete: (id: string) => void;
  readonly onPageChange: (page: number) => void;
}
