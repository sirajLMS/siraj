"use client";

import { Box } from "@mui/material";
import { styled } from "@mui/material/styles";
import { PageContainer, PageHeader } from "@/frontend/components/ui";
import { ComplaintQueueCardList } from "./components/ComplaintQueueCardList";
import { ComplaintsMetricsRow } from "./components/ComplaintsMetricsRow";
import { ComplaintsSearchBar } from "./components/ComplaintsSearchBar";
import { ComplaintsTabBar } from "./components/ComplaintsTabBar";
import type { AdminComplaintsViewProps } from "./types/complaintsViewTypes";

/** Mobile search bar wrapper with bottom margin */
const StyledMobileSearchBox = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(2),
}));

/** Mobile queue cards container with top padding */
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
  page,
  pageSize,
  totalCount,
  onSearchChange,
  onTabChange,
  onDraftChange,
  onAnswer,
  onPageChange,
}: Readonly<AdminComplaintsViewProps>) {
  return (
    <PageContainer>
      <PageHeader title={labels.pageTitle} subtitle={labels.pageSubtitle} titleVariant="headlineMd" />

      {/* Summary metrics row with unanswered/answered counts and efficiency banner */}
      <ComplaintsMetricsRow summary={summary} labels={labels} compact />

      {/* Search input for filtering complaints */}
      <StyledMobileSearchBox>
        <ComplaintsSearchBar value={searchQuery} placeholder={labels.searchPlaceholder} onChange={onSearchChange} />
      </StyledMobileSearchBox>

      {/* Tab bar switching between unanswered and answered queues */}
      <ComplaintsTabBar
        activeTab={activeTab}
        unansweredCount={summary.unanswered}
        answeredCount={summary.answered}
        labels={labels}
        onTabChange={onTabChange}
      />

      {/* Filtered list of complaint queue cards */}
      <StyledMobileQueueContainer>
        <ComplaintQueueCardList
          rows={rows}
          labels={labels}
          draftResponses={draftResponses}
          canManage={canManage}
          page={page}
          pageSize={pageSize}
          totalCount={totalCount}
          onDraftChange={onDraftChange}
          onAnswer={onAnswer}
          onPageChange={onPageChange}
        />
      </StyledMobileQueueContainer>
    </PageContainer>
  );
}
