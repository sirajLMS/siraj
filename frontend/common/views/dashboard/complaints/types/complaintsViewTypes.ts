import type { ComplaintFormData } from "@/frontend/common/views/dashboard/complaints/schemas/complaintFormSchema";
import type {
  AdminComplaintRow,
  AdminComplaintsSummary,
  ComplaintTab,
  ParentComplaintRecord,
  ParentStudentOption,
} from "@/frontend/common/views/dashboard/complaints/types/complaints.types";
import type { ComplaintsLabels } from "@/shared/locale/types/dashboard/complaints";

export type { ComplaintsLabels };

export interface ParentComplaintsViewProps {
  readonly labels: ComplaintsLabels["parent"];
  readonly studentOptions: readonly ParentStudentOption[];
  readonly records: readonly ParentComplaintRecord[];
  readonly hasOlderRecords: boolean;
  readonly isSubmitting: boolean;
  readonly showSuccess: boolean;
  readonly canSubmit: boolean;
  readonly onSubmit: (data: ComplaintFormData) => void;
  readonly onDismissSuccess: () => void;
  readonly onLoadOlderRecords: () => void;
  readonly page?: number;
  readonly pageSize?: number;
  readonly totalCount?: number;
  readonly onPageChange?: (page: number) => void;
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
