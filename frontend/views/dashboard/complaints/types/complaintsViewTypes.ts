import type { ComplaintsLabels } from "@/frontend/messages/types/dashboard/complaints/main";
import type { AdminComplaintRow, AdminComplaintsSummary, ComplaintTab } from "@/frontend/stores/adminComplaintsStore";
import type { ParentComplaintRecord, ParentStudentOption } from "@/frontend/stores/parentComplaintsStore";
import type { ComplaintFormData } from "../schemas/complaintFormSchema";

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
}

export interface AdminComplaintsViewProps {
  readonly labels: ComplaintsLabels["admin"];
  readonly summary: AdminComplaintsSummary;
  readonly rows: readonly AdminComplaintRow[];
  readonly searchQuery: string;
  readonly activeTab: ComplaintTab;
  readonly draftResponses: Readonly<Record<string, string>>;
  readonly canManage: boolean;
  readonly onSearchChange: (query: string) => void;
  readonly onTabChange: (tab: ComplaintTab) => void;
  readonly onDraftChange: (id: string, text: string) => void;
  readonly onAnswer: (id: string, options: { readonly sendEmail: boolean }) => void;
}
