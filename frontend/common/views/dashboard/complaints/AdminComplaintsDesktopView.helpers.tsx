import { mockActions } from "@/frontend/common/views/dashboard/complaints/AdminComplaintsDesktopView.fixtures";
import type { AdminComplaintsViewModel } from "@/frontend/common/views/dashboard/complaints/useAdminComplaintsViewModel";
import { buildComplaintsLabels } from "@/frontend/common/views/dashboard/complaints/utils/buildComplaintsLabels";
import { AdminComplaintsDesktopView } from "@/frontend/desktop/views/dashboard/complaints/adminComplaints.desktop";
import { Translation, useAppTranslation } from "@/shared/locale";

type AdminComplaintsDesktopStoryProps = Omit<
  AdminComplaintsViewModel,
  | "labels"
  | "onSearchChange"
  | "onTabChange"
  | "onDraftChange"
  | "onAnswer"
  | "onDelete"
  | "onPageChange"
  | "onDeleteDialogClose"
  | "onDeleteDialogConfirm"
>;

export function AdminComplaintsDesktopStoryRenderer({
  summary,
  rows,
  searchQuery,
  activeTab,
  draftResponses,
  canManage,
  canDelete,
  page,
  pageSize,
  totalCount,
  deleteDialogOpen,
  deleteComplaintId,
  isDeletingComplaint,
  loading,
  error,
  onRefetch,
}: Readonly<AdminComplaintsDesktopStoryProps>) {
  const labels = buildComplaintsLabels(useAppTranslation(Translation.Dashboard.Complaints)).admin;

  return (
    <AdminComplaintsDesktopView
      labels={labels}
      summary={summary}
      rows={rows}
      searchQuery={searchQuery}
      activeTab={activeTab}
      draftResponses={draftResponses}
      canManage={canManage}
      canDelete={canDelete}
      page={page}
      pageSize={pageSize}
      totalCount={totalCount}
      deleteDialogOpen={deleteDialogOpen}
      deleteComplaintId={deleteComplaintId}
      isDeletingComplaint={isDeletingComplaint}
      loading={loading}
      error={error}
      onRefetch={onRefetch}
      {...mockActions}
    />
  );
}
