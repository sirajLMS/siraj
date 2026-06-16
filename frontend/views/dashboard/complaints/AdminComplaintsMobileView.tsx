"use client";

import { Box } from "@mui/material";
import { PageContainer, PageHeader } from "@/frontend/components/ui";
import { ComplaintQueueCardList } from "./components/ComplaintQueueCardList";
import { ComplaintsMetricsRow } from "./components/ComplaintsMetricsRow";
import { ComplaintsSearchBar } from "./components/ComplaintsSearchBar";
import { ComplaintsTabBar } from "./components/ComplaintsTabBar";
import type { AdminComplaintsViewProps } from "./types/complaintsViewTypes";

export function AdminComplaintsMobileView({
  labels,
  summary,
  rows,
  searchQuery,
  activeTab,
  draftResponses,
  canManage,
  onSearchChange,
  onTabChange,
  onDraftChange,
  onAnswer,
}: Readonly<AdminComplaintsViewProps>) {
  return (
    <PageContainer>
      <PageHeader title={labels.pageTitle} subtitle={labels.pageSubtitle} titleVariant="headlineMd" />

      <ComplaintsMetricsRow summary={summary} labels={labels} compact />

      <Box sx={{ mb: 2 }}>
        <ComplaintsSearchBar value={searchQuery} placeholder={labels.searchPlaceholder} onChange={onSearchChange} />
      </Box>

      <ComplaintsTabBar
        activeTab={activeTab}
        unansweredCount={summary.unanswered}
        answeredCount={summary.answered}
        labels={labels}
        onTabChange={onTabChange}
      />

      <Box sx={{ pt: 2 }}>
        <ComplaintQueueCardList
          rows={rows}
          labels={labels}
          draftResponses={draftResponses}
          canManage={canManage}
          onDraftChange={onDraftChange}
          onAnswer={onAnswer}
        />
      </Box>
    </PageContainer>
  );
}
