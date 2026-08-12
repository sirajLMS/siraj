import type { ReactNode } from "react";
import { DeleteComplaintDialog } from "@/frontend/common/views/dashboard/complaints/components/deleteComplaintDialog";
import { buildDeleteComplaintDialogLabels } from "@/frontend/common/views/dashboard/complaints/types/complaintsViewTypes";
import type { AdminComplaintsViewModel } from "@/frontend/common/views/dashboard/complaints/useAdminComplaintsViewModel";

export interface AdminComplaintsSharedOptions {
  readonly renderPageContainer: (children: ReactNode) => ReactNode;
  readonly renderPageHeader: (title: string, subtitle: string) => ReactNode;
  readonly renderMetricsRow: (
    summary: AdminComplaintsViewModel["summary"],
    labels: AdminComplaintsViewModel["labels"]
  ) => ReactNode;
  readonly renderSearchBar: (value: string, placeholder: string, onChange: (v: string) => void) => ReactNode;
  readonly renderTabBar: (
    activeTab: AdminComplaintsViewModel["activeTab"],
    unansweredCount: number,
    answeredCount: number,
    labels: AdminComplaintsViewModel["labels"],
    onTabChange: (tab: AdminComplaintsViewModel["activeTab"]) => void
  ) => ReactNode;
  readonly renderCardList: (props: {
    readonly rows: AdminComplaintsViewModel["rows"];
    readonly labels: AdminComplaintsViewModel["labels"];
    readonly draftResponses: AdminComplaintsViewModel["draftResponses"];
    readonly canManage: boolean;
    readonly canDelete: boolean;
    readonly page: number;
    readonly pageSize: number;
    readonly totalCount: number;
    readonly onDraftChange: AdminComplaintsViewModel["onDraftChange"];
    readonly onAnswer: AdminComplaintsViewModel["onAnswer"];
    readonly onDelete: AdminComplaintsViewModel["onDelete"];
    readonly onPageChange: (page: number) => void;
  }) => ReactNode;
  /** Wraps search bar, tab bar, and card list with the tier-specific layout */
  readonly renderContent: (searchBar: ReactNode, tabBar: ReactNode, cardList: ReactNode) => ReactNode;
}

export function AdminComplaintsShared({
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
  options,
}: Readonly<AdminComplaintsViewModel> & { readonly options: AdminComplaintsSharedOptions }): ReactNode {
  const metricsRow = options.renderMetricsRow(summary, labels);
  const searchBar = options.renderSearchBar(searchQuery, labels.searchPlaceholder, onSearchChange);
  const tabBar = options.renderTabBar(activeTab, summary.unanswered, summary.answered, labels, onTabChange);
  const cardList = options.renderCardList({
    rows,
    labels,
    draftResponses,
    canManage,
    canDelete,
    page,
    pageSize,
    totalCount,
    onDraftChange,
    onAnswer,
    onDelete,
    onPageChange,
  });

  return options.renderPageContainer(
    <>
      {options.renderPageHeader(labels.pageTitle, labels.pageSubtitle)}
      {metricsRow}
      {options.renderContent(searchBar, tabBar, cardList)}
      {canDelete ? (
        <DeleteComplaintDialog
          open={deleteDialogOpen}
          onClose={onDeleteDialogClose}
          onConfirm={onDeleteDialogConfirm}
          isDeleting={isDeletingComplaint}
          labels={buildDeleteComplaintDialogLabels(labels.queue)}
        />
      ) : null}
    </>
  );
}
