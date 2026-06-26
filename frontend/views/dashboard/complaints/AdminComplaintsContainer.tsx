"use client";

import { useMutation, useQuery } from "@apollo/client/react";
import { Box, CircularProgress, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { RequirePermission } from "@/frontend/components/auth/RequirePermission";
import { AppPermission, ComplaintStatus } from "@/frontend/graphql/generated/gql/graphql-types";
import {
  adminComplaintQueueQueryDocument,
  respondToComplaintMutationDocument,
} from "@/frontend/graphql/sharedDocuments/complaint.documents";
import { useAdminComplaintsStore } from "@/frontend/stores/adminComplaintsStore";
import { useUserStore } from "@/frontend/stores/userStore";
import { AdminComplaintsView } from "./AdminComplaintsView";
import type { AdminComplaintRow, AdminComplaintsSummary } from "./types/complaints.types";
import { buildComplaintsLabels } from "./utils/buildComplaintsLabels";
import { filterComplaintsByTab } from "./utils/complaintFilters";

const StyledErrorTypography = styled(Typography)(({ theme }) => ({
  color: theme.palette.error.main,
}));

export function AdminComplaintsContainer() {
  const t = useTranslations("dashboard.complaints");
  const labels = buildComplaintsLabels(t);
  const hasPermission = useUserStore(state => state.hasPermission);

  const searchQuery = useAdminComplaintsStore(state => state.searchQuery);
  const activeTab = useAdminComplaintsStore(state => state.activeTab);
  const draftResponses = useAdminComplaintsStore(state => state.draftResponses);
  const setSearchQuery = useAdminComplaintsStore(state => state.setSearchQuery);
  const setActiveTab = useAdminComplaintsStore(state => state.setActiveTab);
  const setDraftResponse = useAdminComplaintsStore(state => state.setDraftResponse);
  const page = useAdminComplaintsStore(state => state.page);
  const pageSize = useAdminComplaintsStore(state => state.pageSize);
  const setPage = useAdminComplaintsStore(state => state.setPage);

  const { data, loading, error, refetch } = useQuery(adminComplaintQueueQueryDocument, {
    variables: {
      filter: {
        search: searchQuery || null,
        status: activeTab,
      },
      paginationArgs: {
        first: pageSize,
        page: page + 1,
        skip: null,
        after: null,
        before: null,
        last: null,
        maxCount: null,
      },
    },
    fetchPolicy: "cache-and-network",
  });

  const [respondToComplaint] = useMutation(respondToComplaintMutationDocument, {
    onCompleted: () => {
      void refetch();
    },
  });

  const totalCount = data?.adminComplaintQueue?.totalCount ?? 0;

  const summary: AdminComplaintsSummary = useMemo(() => {
    const metrics = data?.adminComplaintQueue?.metrics;
    return {
      unanswered: metrics?.unanswered ?? 0,
      answered: metrics?.answered ?? 0,
      avgResolutionHours: metrics?.avgResolutionTime ?? "0.0 Hours",
    };
  }, [data?.adminComplaintQueue?.metrics]);

  const rows: readonly AdminComplaintRow[] = useMemo(() => {
    if (!data?.adminComplaintQueue?.rows) return [];
    return data.adminComplaintQueue.rows.map(row => ({
      id: row.id ?? "",
      submitterName: row.parentName ?? row.submitterEmail ?? "",
      submitterRole: row.studentName ? `Guardian • ${row.studentName}` : "Guardian",
      avatarUrl: "",
      priority: row.category?.toLowerCase().includes("urgent") ? "urgent" : "general",
      receivedAt: row.createdAt ?? "",
      complaintText: row.body ?? "",
      status: row.status ?? ComplaintStatus.Unanswered,
      adminResponse: undefined,
      answeredAt: undefined,
    }));
  }, [data?.adminComplaintQueue?.rows]);

  const canManage = hasPermission(AppPermission.ComplaintsRespond);

  const filteredRows = useMemo(
    () => filterComplaintsByTab(rows, activeTab, searchQuery),
    [activeTab, rows, searchQuery]
  );

  const handleAnswer = (id: string, options: { readonly sendEmail: boolean }) => {
    const draft = draftResponses[id] ?? "";
    void respondToComplaint({
      variables: {
        input: {
          complaintId: id,
          body: draft,
          emailSent: options.sendEmail,
        },
      },
    });
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <StyledErrorTypography>{error.message}</StyledErrorTypography>;
  }

  return (
    <RequirePermission permissions={[AppPermission.ComplaintsRespond, AppPermission.ComplaintsList]}>
      <AdminComplaintsView
        labels={labels.admin}
        summary={summary}
        rows={filteredRows}
        searchQuery={searchQuery}
        activeTab={activeTab}
        draftResponses={draftResponses}
        canManage={canManage}
        page={page}
        pageSize={pageSize}
        totalCount={totalCount}
        onSearchChange={setSearchQuery}
        onTabChange={setActiveTab}
        onDraftChange={setDraftResponse}
        onAnswer={handleAnswer}
        onPageChange={setPage}
      />
    </RequirePermission>
  );
}
