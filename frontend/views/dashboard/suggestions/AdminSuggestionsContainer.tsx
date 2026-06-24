"use client";

import { useMutation, useQuery } from "@apollo/client/react";
import { Box, CircularProgress, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { RequirePermission } from "@/frontend/components/auth/RequirePermission";
import { AppPermission } from "@/frontend/graphql/generated/gql/graphql-types";
import {
  adminSuggestionsQueryDocument,
  markSuggestionReviewedMutationDocument,
} from "@/frontend/graphql/sharedDocuments/suggestion.documents";
import { useAdminSuggestionsStore } from "@/frontend/stores/adminSuggestionsStore";
import { SuggestionStatus } from "@/shared/lib/enum";
import { AdminSuggestionsView } from "./AdminSuggestionsView";
import type { AdminSuggestionRow, AdminSuggestionsSummary } from "./types/suggestions.types";
import { buildSuggestionsLabels } from "./utils/buildSuggestionsLabels";
import { filterSuggestionsByTab } from "./utils/suggestionFilters";

const StyledErrorTypography = styled(Typography)(({ theme }) => ({
  color: theme.palette.error.main,
}));

export function AdminSuggestionsContainer() {
  const t = useTranslations("dashboard.suggestions");
  const labels = buildSuggestionsLabels(t);

  const searchQuery = useAdminSuggestionsStore(state => state.searchQuery);
  const activeTab = useAdminSuggestionsStore(state => state.activeTab);
  const setSearchQuery = useAdminSuggestionsStore(state => state.setSearchQuery);
  const setActiveTab = useAdminSuggestionsStore(state => state.setActiveTab);

  const { data, loading, error, refetch } = useQuery(adminSuggestionsQueryDocument, {
    variables: {
      filter: {
        search: searchQuery || null,
        status: activeTab,
        limit: 100,
        offset: 0,
      },
    },
  });

  const [markReviewed] = useMutation(markSuggestionReviewedMutationDocument, {
    onCompleted: () => {
      void refetch();
    },
  });

  const summary: AdminSuggestionsSummary = useMemo(() => {
    const metrics = data?.adminSuggestions?.metrics;
    return {
      pending: metrics?.pending ?? 0,
      reviewed: metrics?.reviewed ?? 0,
      avgResponseHours: metrics?.avgResponseTime ?? "0.0 Hours",
    };
  }, [data?.adminSuggestions?.metrics]);

  const rows: readonly AdminSuggestionRow[] = useMemo(() => {
    if (!data?.adminSuggestions?.rows) return [];
    return data.adminSuggestions.rows.map(row => ({
      id: row.id ?? "",
      parentName: row.parentName ?? "",
      suggestionPreview: row.body ?? "",
      status: row.emailSentAt ? SuggestionStatus.REVIEWED : SuggestionStatus.PENDING,
      submittedAt: row.createdAt ?? "",
    }));
  }, [data?.adminSuggestions?.rows]);

  const filteredRows = useMemo(
    () => filterSuggestionsByTab(rows, activeTab, searchQuery),
    [activeTab, rows, searchQuery]
  );

  const handleMarkReviewed = (id: string) => {
    void markReviewed({
      variables: { suggestionId: id },
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
    <RequirePermission permissions={[AppPermission.ComplaintsList]}>
      <AdminSuggestionsView
        labels={labels.admin}
        summary={summary}
        rows={filteredRows}
        searchQuery={searchQuery}
        activeTab={activeTab}
        canManage={true}
        onSearchChange={setSearchQuery}
        onTabChange={setActiveTab}
        onMarkReviewed={handleMarkReviewed}
      />
    </RequirePermission>
  );
}
