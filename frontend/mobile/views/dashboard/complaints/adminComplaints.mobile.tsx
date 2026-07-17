"use client";

import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from "@mui/material";
import type { AdminComplaintsViewModel } from "@/frontend/common/views/dashboard/complaints/useAdminComplaintsViewModel";
import { MobileContentStack, MobilePageContainer, MobilePageHeader } from "@/frontend/mobile/components/ui";
import { ComplaintQueueCardListMobile } from "@/frontend/mobile/views/dashboard/complaints/components/complaintQueueCardList.mobile";
import { ComplaintsMetricsRowMobile } from "@/frontend/mobile/views/dashboard/complaints/components/complaintsMetricsRow.mobile";
import { ComplaintsSearchBarMobile } from "@/frontend/mobile/views/dashboard/complaints/components/complaintsSearchBar.mobile";
import { ComplaintsTabBarMobile } from "@/frontend/mobile/views/dashboard/complaints/components/complaintsTabBar.mobile";

export function AdminComplaintsMobileView({
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
    <MobilePageContainer>
      <MobilePageHeader title={labels.pageTitle} subtitle={labels.pageSubtitle} edgeToEdge={false} />

      <MobileContentStack gap={3} paddingBottom={4}>
        <ComplaintsMetricsRowMobile summary={summary} labels={labels} compact />

        <ComplaintsSearchBarMobile
          value={searchQuery}
          placeholder={labels.searchPlaceholder}
          onChange={onSearchChange}
        />

        <ComplaintsTabBarMobile
          activeTab={activeTab}
          unansweredCount={summary.unanswered}
          answeredCount={summary.answered}
          labels={labels}
          onTabChange={onTabChange}
        />

        <ComplaintQueueCardListMobile
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
      </MobileContentStack>

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
    </MobilePageContainer>
  );
}
