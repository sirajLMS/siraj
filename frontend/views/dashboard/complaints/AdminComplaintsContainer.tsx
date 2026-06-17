"use client";

import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { AppPermission } from "@/frontend/graphql/generated/gql/graphql-types";
import { useAdminComplaintsStore } from "@/frontend/stores/mockAdminComplaintsStore";
import { useUserStore } from "@/frontend/stores/mockUserStore";
import { AdminComplaintsView } from "./AdminComplaintsView";
import { buildComplaintsLabels } from "./utils/buildComplaintsLabels";
import { filterComplaintsByTab } from "./utils/complaintFilters";

export function AdminComplaintsContainer() {
  const t = useTranslations("dashboard.complaints");
  const permissions = useUserStore(state => state.permissions);

  const summary = useAdminComplaintsStore(state => state.summary);
  const rows = useAdminComplaintsStore(state => state.rows);
  const searchQuery = useAdminComplaintsStore(state => state.searchQuery);
  const activeTab = useAdminComplaintsStore(state => state.activeTab);
  const draftResponses = useAdminComplaintsStore(state => state.draftResponses);
  const setSearchQuery = useAdminComplaintsStore(state => state.setSearchQuery);
  const setActiveTab = useAdminComplaintsStore(state => state.setActiveTab);
  const setDraftResponse = useAdminComplaintsStore(state => state.setDraftResponse);
  const answerComplaint = useAdminComplaintsStore(state => state.answerComplaint);

  const canView =
    permissions.includes(AppPermission.ComplaintsRespond) || permissions.includes(AppPermission.ComplaintsList);
  const canManage = permissions.includes(AppPermission.ComplaintsRespond);

  const filteredRows = useMemo(
    () => filterComplaintsByTab(rows, activeTab, searchQuery),
    [activeTab, rows, searchQuery]
  );

  if (!canView) {
    return null;
  }

  const labels = buildComplaintsLabels(t);

  return (
    <AdminComplaintsView
      labels={labels.admin}
      summary={summary}
      rows={filteredRows}
      searchQuery={searchQuery}
      activeTab={activeTab}
      draftResponses={draftResponses}
      canManage={canManage}
      onSearchChange={setSearchQuery}
      onTabChange={setActiveTab}
      onDraftChange={setDraftResponse}
      onAnswer={answerComplaint}
    />
  );
}
