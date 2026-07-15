"use client";

import { useMutation, useQuery } from "@apollo/client/react";
import { Box, CircularProgress, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import { useMemo } from "react";
import { RequirePermission } from "@/frontend/common/components/auth/RequirePermission";
import { AppPermission, ComplaintStatus } from "@/frontend/common/graphql/generated/gql/graphql-types";
import {
  adminComplaintQueueQueryDocument,
  deleteComplaintMutationDocument,
  respondToComplaintMutationDocument,
} from "@/frontend/common/graphql/sharedDocuments";
import { useAdminComplaintsStore } from "@/frontend/common/stores/adminComplaintsStore";
import { useUserStore } from "@/frontend/common/stores/userStore";
import { logger } from "@/frontend/common/utils/logger";
import { AdminComplaintsView } from "@/frontend/common/views/dashboard/complaints/adminComplaintsView";
import type {
  AdminComplaintRow,
  AdminComplaintsSummary,
} from "@/frontend/common/views/dashboard/complaints/types/complaints.types";
import { buildComplaintsLabels } from "@/frontend/common/views/dashboard/complaints/utils/buildComplaintsLabels";
import { useAppTranslation } from "@/shared/locale/client";

const StyledErrorTypography = styled(Typography)(({ theme }) => ({
  color: theme.palette.error.main,
}));

export function AdminComplaintsContainer() {
  const t = useAppTranslation("dashboard.complaints");
  const tc = useAppTranslation("common");
  const labels = buildComplaintsLabels(t);
  const hasPermission = useUserStore(state => state.hasPermission);

  const searchQuery = useAdminComplaintsStore(state => state.searchQuery);
  const activeTab = useAdminComplaintsStore(state => state.activeTab);
  const draftResponses = useAdminComplaintsStore(state => state.draftResponses);
  const clearDraftResponse = useAdminComplaintsStore(state => state.clearDraftResponse);
  const resetResponding = useAdminComplaintsStore(state => state.resetResponding);
  const page = useAdminComplaintsStore(state => state.page);
  const pageSize = useAdminComplaintsStore(state => state.pageSize);
  const setDeleteDialogOpen = useAdminComplaintsStore(state => state.setDeleteDialogOpen);
  const setDeleteComplaintId = useAdminComplaintsStore(state => state.setDeleteComplaintId);
  const closeDeleteDialog = useAdminComplaintsStore(state => state.closeDeleteDialog);

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
    onCompleted: (_data, options) => {
      const complaintId = options?.variables?.input?.complaintId;
      if (complaintId) {
        clearDraftResponse(complaintId);
      }
      resetResponding();
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
      submitterName: row.parentName ?? "",
      submitterRole: row.studentName ? `Guardian • ${row.studentName}` : "Guardian",
      avatarUrl: row.parentAvatarUrl ?? "",
      priority: row.category?.toLowerCase().includes("urgent") ? "urgent" : "general",
      receivedAt: row.createdAt ?? "",
      complaintText: row.body ?? "",
      status: row.status ?? ComplaintStatus.Unanswered,
      adminResponse: row.responses && row.responses.length > 0 ? (row.responses[0].body ?? "") : undefined,
      answeredAt: row.responses && row.responses.length > 0 ? (row.responses[0].createdAt ?? "") : undefined,
    }));
  }, [data?.adminComplaintQueue?.rows]);

  const canManage = hasPermission(AppPermission.ComplaintsRespond);
  const canDelete = hasPermission(AppPermission.ComplaintsDelete);

  const [deleteComplaint, { loading: isDeletingComplaint }] = useMutation(deleteComplaintMutationDocument, {
    onCompleted: () => {
      closeDeleteDialog();
      void refetch();
    },
    onError: () => {
      closeDeleteDialog();
    },
  });

  const handleAnswer = (id: string, _options: { readonly sendEmail: boolean }) => {
    const draft = draftResponses[id] ?? "";
    void respondToComplaint({
      variables: {
        input: {
          complaintId: id,
          body: draft,
        },
      },
    });
  };

  const handleDeleteRequest = (id: string) => {
    setDeleteComplaintId(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    const deleteComplaintId = useAdminComplaintsStore.getState().deleteComplaintId;
    if (deleteComplaintId) {
      void deleteComplaint({
        variables: {
          complaintId: deleteComplaintId,
        },
      });
    }
  };

  if (loading && !data) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    logger.error("Error loading complaints:", { error });
    return <StyledErrorTypography>{tc.loadFailed}</StyledErrorTypography>;
  }

  return (
    <RequirePermission permissions={[AppPermission.ComplaintsRespond, AppPermission.ComplaintsList]}>
      <AdminComplaintsView
        labels={labels.admin}
        summary={summary}
        rows={rows}
        canManage={canManage}
        canDelete={canDelete}
        totalCount={totalCount}
        isDeletingComplaint={isDeletingComplaint}
        onAnswer={handleAnswer}
        onDeleteRequest={handleDeleteRequest}
        onDeleteConfirm={handleDeleteConfirm}
        onRefetch={() => {
          void refetch();
        }}
      />
    </RequirePermission>
  );
}
