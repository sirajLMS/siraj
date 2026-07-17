"use client";

import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from "@mui/material";
import { SectionPanel } from "@/frontend/common/components/ui";
import type { AdminComplaintsViewModel } from "@/frontend/common/views/dashboard/complaints/useAdminComplaintsViewModel";
import { DesktopPageContainer, DesktopPageHeader } from "@/frontend/desktop/components/ui";
import { ComplaintQueueCardListDesktop } from "@/frontend/desktop/views/dashboard/complaints/components/complaintQueueCardList.desktop";
import { ComplaintsMetricsRowDesktop } from "@/frontend/desktop/views/dashboard/complaints/components/complaintsMetricsRow.desktop";
import { ComplaintsSearchBarDesktop } from "@/frontend/desktop/views/dashboard/complaints/components/complaintsSearchBar.desktop";
import { ComplaintsTabBarDesktop } from "@/frontend/desktop/views/dashboard/complaints/components/complaintsTabBar.desktop";

export function AdminComplaintsDesktopView({
  labels,
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
  isDeletingComplaint,
  onSearchChange,
  onTabChange,
  onDraftChange,
  onAnswer,
  onDelete,
  onPageChange,
  onDeleteDialogClose,
  onDeleteDialogConfirm,
}: Readonly<AdminComplaintsViewModel>) {
  return (
    <DesktopPageContainer>
      <DesktopPageHeader title={labels.pageTitle} subtitle={labels.pageSubtitle} />

      <ComplaintsMetricsRowDesktop summary={summary} labels={labels} />

      <SectionPanel
        actions={
          <ComplaintsSearchBarDesktop
            value={searchQuery}
            placeholder={labels.searchPlaceholder}
            onChange={onSearchChange}
          />
        }
      >
        <ComplaintsTabBarDesktop
          activeTab={activeTab}
          unansweredCount={summary.unanswered}
          answeredCount={summary.answered}
          labels={labels}
          onTabChange={onTabChange}
        />
        <ComplaintQueueCardListDesktop
          rows={rows}
          labels={labels}
          draftResponses={draftResponses}
          canManage={canManage}
          canDelete={canDelete}
          page={page}
          pageSize={pageSize}
          totalCount={totalCount}
          onDraftChange={onDraftChange}
          onAnswer={onAnswer}
          onDelete={onDelete}
          onPageChange={onPageChange}
        />
      </SectionPanel>

      {canDelete ? (
        <Dialog open={deleteDialogOpen} onClose={onDeleteDialogClose} maxWidth="xs" fullWidth>
          <DialogTitle>{labels.queue.deleteConfirmTitle}</DialogTitle>
          <DialogContent>
            <DialogContentText>{labels.queue.deleteConfirmBody}</DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={onDeleteDialogClose}>{labels.queue.deleteConfirmCancel}</Button>
            <Button onClick={onDeleteDialogConfirm} color="error" variant="contained" disabled={isDeletingComplaint}>
              {labels.queue.deleteConfirmConfirm}
            </Button>
          </DialogActions>
        </Dialog>
      ) : null}
    </DesktopPageContainer>
  );
}
