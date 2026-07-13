"use client";

import { Box, Button, Typography } from "@mui/material";
import {
  MobileCardList,
  MobileCardListItem,
  MobileContentStack,
  MobileEmptyState,
  MobilePageHeader,
  PageContainer,
  StatusBadge,
} from "@/frontend/common/components/ui";
import { SuggestionStatus } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { SuggestionsMetricsRow } from "@/frontend/views/dashboard/suggestions/components/SuggestionsMetricsRow";
import { SuggestionsSearchBar } from "@/frontend/views/dashboard/suggestions/components/SuggestionsSearchBar";
import { SuggestionsTabBar } from "@/frontend/views/dashboard/suggestions/components/SuggestionsTabBar";
import type { AdminSuggestionRow } from "@/frontend/views/dashboard/suggestions/types/suggestions.types";
import type { SuggestionsAdminLabels } from "@/frontend/views/dashboard/suggestions/types/suggestionsView.types";
import type { AdminSuggestionsViewModel } from "@/frontend/views/dashboard/suggestions/useAdminSuggestionsViewModel";
import { mapStatusForBadge, statusLabelKey } from "@/frontend/views/dashboard/suggestions/utils/suggestionStatusMap";

interface SuggestionCardActionsProps {
  readonly row: AdminSuggestionRow;
  readonly canManage: boolean;
  readonly canDelete: boolean;
  readonly labels: SuggestionsAdminLabels;
  readonly onMarkReviewed: (id: string) => void;
  readonly onRespond: (id: string) => void;
  readonly onMarkDuplicate: (id: string) => void;
  readonly onDelete: (id: string) => void;
}

function SuggestionCardActions({
  row,
  canManage,
  canDelete,
  labels,
  onMarkReviewed,
  onRespond,
  onMarkDuplicate,
  onDelete,
}: SuggestionCardActionsProps) {
  const showActions = canManage && row.status === SuggestionStatus.Pending;

  if (showActions) {
    return (
      <MobileContentStack gap={1}>
        <Button
          fullWidth
          variant="outlined"
          onClick={() => {
            void onMarkReviewed(row.id);
          }}
          sx={{ textTransform: "uppercase", fontWeight: 700 }}
        >
          {labels.table.markReviewed}
        </Button>
        <Button
          fullWidth
          variant="outlined"
          onClick={() => {
            void onRespond(row.id);
          }}
          sx={{ textTransform: "uppercase", fontWeight: 700 }}
        >
          {labels.table.respond}
        </Button>
        <Button
          fullWidth
          variant="outlined"
          onClick={() => {
            void onMarkDuplicate(row.id);
          }}
          sx={{ textTransform: "uppercase", fontWeight: 700 }}
        >
          {labels.table.markDuplicate}
        </Button>
        {canDelete && (
          <Button
            fullWidth
            variant="outlined"
            color="error"
            onClick={() => {
              void onDelete(row.id);
            }}
            sx={{ textTransform: "uppercase", fontWeight: 700 }}
          >
            {labels.table.delete}
          </Button>
        )}
      </MobileContentStack>
    );
  }

  if (canDelete) {
    return (
      <Button
        fullWidth
        variant="outlined"
        color="error"
        onClick={() => {
          void onDelete(row.id);
        }}
        sx={{ textTransform: "uppercase", fontWeight: 700 }}
      >
        {labels.table.delete}
      </Button>
    );
  }

  return null;
}

interface SuggestionCardItemProps {
  readonly row: AdminSuggestionRow;
  readonly canManage: boolean;
  readonly canDelete: boolean;
  readonly labels: SuggestionsAdminLabels;
  readonly onMarkReviewed: (id: string) => void;
  readonly onRespond: (id: string) => void;
  readonly onMarkDuplicate: (id: string) => void;
  readonly onDelete: (id: string) => void;
}

function SuggestionCardItem({
  row,
  canManage,
  canDelete,
  labels,
  onMarkReviewed,
  onRespond,
  onMarkDuplicate,
  onDelete,
}: SuggestionCardItemProps) {
  const showActions = canManage && row.status === SuggestionStatus.Pending;

  return (
    <MobileCardListItem variant="rounded">
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1.5, gap: 1 }}>
        <Box>
          <Typography variant="titleLg" sx={{ fontWeight: 700 }}>
            {row.parentName}
          </Typography>
          <Typography variant="labelMd" sx={theme => ({ color: theme.palette.text.secondary })}>
            {row.submittedAt}
          </Typography>
        </Box>
        <StatusBadge
          category="invoice"
          status={mapStatusForBadge(row.status)}
          label={labels.statusLabels[statusLabelKey(row.status)]}
        />
      </Box>
      <Typography
        variant="bodyMd"
        sx={theme => ({ color: theme.palette.text.secondary, mb: showActions || canDelete ? 1.5 : 0 })}
      >
        {row.suggestionPreview}
      </Typography>
      <SuggestionCardActions
        row={row}
        canManage={canManage}
        canDelete={canDelete}
        labels={labels}
        onMarkReviewed={onMarkReviewed}
        onRespond={onRespond}
        onMarkDuplicate={onMarkDuplicate}
        onDelete={onDelete}
      />
    </MobileCardListItem>
  );
}

interface SuggestionCardListSectionProps {
  readonly rows: readonly AdminSuggestionRow[];
  readonly canManage: boolean;
  readonly canDelete: boolean;
  readonly labels: SuggestionsAdminLabels;
  readonly onMarkReviewed: (id: string) => void;
  readonly onRespond: (id: string) => void;
  readonly onMarkDuplicate: (id: string) => void;
  readonly onDelete: (id: string) => void;
}

function SuggestionCardListSection({
  rows,
  canManage,
  canDelete,
  labels,
  onMarkReviewed,
  onRespond,
  onMarkDuplicate,
  onDelete,
}: SuggestionCardListSectionProps) {
  if (rows.length === 0) {
    return <MobileEmptyState title={labels.table.noEntries} />;
  }

  return (
    <MobileCardList
      rows={rows}
      getKey={row => row.id}
      gap={1.5}
      layout="rounded"
      renderItem={row => (
        <SuggestionCardItem
          row={row}
          canManage={canManage}
          canDelete={canDelete}
          labels={labels}
          onMarkReviewed={onMarkReviewed}
          onRespond={onRespond}
          onMarkDuplicate={onMarkDuplicate}
          onDelete={onDelete}
        />
      )}
    />
  );
}

export function AdminSuggestionsMobileView({
  labels,
  summary,
  rows,
  searchQuery,
  activeTab,
  canManage,
  canDelete,
  onSearchChange,
  onTabChange,
  onMarkReviewed,
  onRespond,
  onMarkDuplicate,
  onDelete,
}: Readonly<AdminSuggestionsViewModel>) {
  return (
    <PageContainer>
      <MobilePageHeader title={labels.pageTitle} subtitle={labels.pageSubtitle} edgeToEdge={false} />

      <MobileContentStack gap={2} paddingBottom={4}>
        <SuggestionsMetricsRow summary={summary} labels={labels} compact />

        <SuggestionsSearchBar value={searchQuery} placeholder={labels.searchPlaceholder} onChange={onSearchChange} />

        <SuggestionsTabBar
          activeTab={activeTab}
          pendingCount={summary.pending}
          reviewedCount={summary.reviewed}
          duplicateCount={summary.duplicateCount}
          labels={labels}
          onTabChange={onTabChange}
        />

        <SuggestionCardListSection
          rows={rows}
          canManage={canManage}
          canDelete={canDelete}
          labels={labels}
          onMarkReviewed={onMarkReviewed}
          onRespond={onRespond}
          onMarkDuplicate={onMarkDuplicate}
          onDelete={onDelete}
        />
      </MobileContentStack>
    </PageContainer>
  );
}
