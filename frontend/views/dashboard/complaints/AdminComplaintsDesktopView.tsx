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
  onSearchChange,
  onTabChange,
  onDraftChange,
  onAnswer,
}: Readonly<AdminComplaintsViewProps>) {
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
          onDraftChange={onDraftChange}
          onAnswer={onAnswer}
        />
      </SectionPanel>
    </PageContainer>
  );
}
