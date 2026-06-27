"use client";

import { Box } from "@mui/material";
import { styled } from "@mui/material/styles";
import { PageContainer, PageHeader } from "@/frontend/components/ui";
import { ComplaintQueueCardList } from "./components/ComplaintQueueCardList";
import { ComplaintsMetricsRow } from "./components/ComplaintsMetricsRow";
import { ComplaintsSearchBar } from "./components/ComplaintsSearchBar";
import { ComplaintsTabBar } from "./components/ComplaintsTabBar";
import type { AdminComplaintsViewProps } from "./types/complaintsViewTypes";

const StyledMobileSearchBox = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(2),
}));

const StyledMobileQueueContainer = styled(Box)(({ theme }) => ({
  paddingTop: theme.spacing(2),
}));

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
  onSearchChange,
  onTabChange,
  onDraftChange,
  onAnswer,
  onDelete,
  onPageChange,
}: Readonly<AdminComplaintsViewProps>) {
  return (
    <PageContainer>
      <PageHeader title={labels.pageTitle} subtitle={labels.pageSubtitle} titleVariant="headlineMd" />

      <ComplaintsMetricsRow summary={summary} labels={labels} compact />

      <StyledMobileSearchBox>
        <ComplaintsSearchBar value={searchQuery} placeholder={labels.searchPlaceholder} onChange={onSearchChange} />
      </StyledMobileSearchBox>

      <ComplaintsTabBar
        activeTab={activeTab}
        unansweredCount={summary.unanswered}
        answeredCount={summary.answered}
        labels={labels}
        onTabChange={onTabChange}
      />

      <StyledMobileQueueContainer>
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
      </StyledMobileQueueContainer>
    </PageContainer>
  );
}
