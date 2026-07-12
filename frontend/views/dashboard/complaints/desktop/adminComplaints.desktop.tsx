"use client";

import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from "@mui/material";
import { PageContainer, PageHeader, SectionPanel } from "@/frontend/components/ui";
import { ComplaintQueueCardList } from "@/frontend/views/dashboard/complaints/components/ComplaintQueueCardList";
import { ComplaintsMetricsRow } from "@/frontend/views/dashboard/complaints/components/ComplaintsMetricsRow";
import { ComplaintsSearchBar } from "@/frontend/views/dashboard/complaints/components/ComplaintsSearchBar";
import { ComplaintsTabBar } from "@/frontend/views/dashboard/complaints/components/ComplaintsTabBar";
import type { AdminComplaintsViewModel } from "@/frontend/views/dashboard/complaints/useAdminComplaintsViewModel";

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
    <PageContainer>
      <PageHeader title={labels.pageTitle} subtitle={labels.pageSubtitle} />

      <ComplaintsMetricsRow summary={summary} labels={labels} />

      <SectionPanel
        actions={
          <ComplaintsSearchBar value={searchQuery} placeholder={labels.searchPlaceholder} onChange={onSearchChange} />
        }
      >
        <ComplaintsTabBar
          activeTab={activeTab}
          unansweredCount={summary.unanswered}
          answeredCount={summary.answered}
          labels={labels}
          onTabChange={onTabChange}
        />
        <ComplaintQueueCardList
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
    </PageContainer>
  );
}
