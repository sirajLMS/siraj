import { ComplaintCategory, ComplaintStatus } from "@/frontend/common/graphql/generated/gql/graphql-types";
import type { AdminComplaintQueueQuery_adminComplaintQueue_ComplaintQueueResult_rows_Complaint } from "@/frontend/common/graphql/generated/gql/operations";
import type {
  AdminComplaintRow,
  ComplaintPriority,
} from "@/frontend/common/views/dashboard/complaints/types/complaints.types";
import type { ComplaintsAdminLabels } from "@/shared/locale";

type ComplaintQueueRow = AdminComplaintQueueQuery_adminComplaintQueue_ComplaintQueueResult_rows_Complaint;

const DEFAULT_PRIORITY: ComplaintPriority = "general";

function buildSubmitterRole(
  category: ComplaintCategory | null,
  studentName: string | null,
  labels: ComplaintsAdminLabels
): string {
  const categoryKey = category ?? ComplaintCategory.Other;
  const categoryLabel = labels.categoryLabels[categoryKey] ?? "";
  if (!studentName) {
    return categoryLabel;
  }
  return `${categoryLabel} • ${studentName}`;
}

export function mapAdminComplaintRow(row: ComplaintQueueRow, labels: ComplaintsAdminLabels): AdminComplaintRow {
  const responses = row.responses ?? [];
  const latestResponse = responses.at(-1);

  return {
    id: row.id ?? "",
    submitterName: row.parentName ?? "",
    submitterRole: buildSubmitterRole(row.category, row.studentName, labels),
    avatarUrl: row.parentAvatarUrl ?? undefined,
    priority: DEFAULT_PRIORITY,
    receivedAt: row.createdAt ?? "",
    complaintText: row.body ?? "",
    status: row.status ?? ComplaintStatus.Unanswered,
    adminResponse: latestResponse?.body ?? undefined,
    answeredAt: latestResponse?.createdAt ?? undefined,
  };
}

export function mapAdminComplaintRows(
  rows: readonly ComplaintQueueRow[] | null | undefined,
  labels: ComplaintsAdminLabels
): readonly AdminComplaintRow[] {
  if (!rows) {
    return [];
  }
  return rows.map(row => mapAdminComplaintRow(row, labels));
}
