import type { AdminComplaintRow, ComplaintTab } from "../types/complaints.types";

export function filterComplaintsByTab(
  rows: readonly AdminComplaintRow[],
  activeTab: ComplaintTab,
  searchQuery: string
): AdminComplaintRow[] {
  const normalizedQuery = searchQuery.trim().toLowerCase();

  return rows.filter(row => {
    if (row.status !== activeTab) {
      return false;
    }

    if (normalizedQuery.length === 0) {
      return true;
    }

    return (
      row.submitterName.toLowerCase().includes(normalizedQuery) ||
      row.submitterRole.toLowerCase().includes(normalizedQuery) ||
      row.complaintText.toLowerCase().includes(normalizedQuery)
    );
  });
}
