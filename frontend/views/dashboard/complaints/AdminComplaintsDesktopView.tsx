"use client";

import { PageContainer, PageHeader, SectionPanel } from "@/frontend/components/ui";
import { ComplaintQueueCardList } from "./components/ComplaintQueueCardList";
import { ComplaintsMetricsRow } from "./components/ComplaintsMetricsRow";
import { ComplaintsSearchBar } from "./components/ComplaintsSearchBar";
import { ComplaintsTabBar } from "./components/ComplaintsTabBar";
import type { AdminComplaintsViewProps } from "./types/complaintsViewTypes";

export function AdminComplaintsDesktopView({
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
      <PageHeader title={labels.pageTitle} subtitle={labels.pageSubtitle} />

      {/* Summary metrics row with unanswered/answered counts and efficiency banner */}
      <ComplaintsMetricsRow summary={summary} labels={labels} />

      {/* Main section panel with search bar action slot */}
      <SectionPanel
        actions={
          /* Search input for filtering complaints in the queue */
          <ComplaintsSearchBar value={searchQuery} placeholder={labels.searchPlaceholder} onChange={onSearchChange} />
        }
      >
        {/* Tab bar switching between unanswered and answered complaint queues */}
        <ComplaintsTabBar
          activeTab={activeTab}
          unansweredCount={summary.unanswered}
          answeredCount={summary.answered}
          labels={labels}
          onTabChange={onTabChange}
        />
        {/* Filtered list of complaint queue cards with draft response support */}
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
      </SectionPanel>
    </PageContainer>
  );
}
