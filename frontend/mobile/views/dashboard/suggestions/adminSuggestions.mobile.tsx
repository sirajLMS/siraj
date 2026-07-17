"use client";

import { Box, Button, Typography } from "@mui/material";
import { SuggestionStatus } from "@/frontend/common/graphql/generated/gql/graphql-types";
import type { AdminSuggestionRow } from "@/frontend/common/views/dashboard/suggestions/types/suggestions.types";
import type { SuggestionsAdminLabels } from "@/frontend/common/views/dashboard/suggestions/types/suggestionsView.types";
import type { AdminSuggestionsViewModel } from "@/frontend/common/views/dashboard/suggestions/useAdminSuggestionsViewModel";
import {
  mapStatusForBadge,
  statusLabelKey,
} from "@/frontend/common/views/dashboard/suggestions/utils/suggestionStatusMap";
import {
  MobileCardList,
  MobileCardListItem,
  MobileContentStack,
  MobileEmptyState,
  MobilePageContainer,
  MobilePageHeader,
} from "@/frontend/mobile/components/ui";
import { MobileStatusBadge } from "@/frontend/mobile/components/ui/badge";
import { SuggestionsMetricsRowMobile } from "@/frontend/mobile/views/dashboard/suggestions/components/suggestionsMetricsRow.mobile";
import { SuggestionsSearchBarMobile } from "@/frontend/mobile/views/dashboard/suggestions/components/suggestionsSearchBar.mobile";
import { SuggestionsTabBarMobile } from "@/frontend/mobile/views/dashboard/suggestions/components/suggestionsTabBar.mobile";

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
        <MobileStatusBadge
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
    <MobilePageContainer>
      <MobilePageHeader title={labels.pageTitle} subtitle={labels.pageSubtitle} edgeToEdge={false} />

      <MobileContentStack gap={2} paddingBottom={4}>
        <SuggestionsMetricsRowMobile summary={summary} labels={labels} />

        <SuggestionsSearchBarMobile
          value={searchQuery}
          placeholder={labels.searchPlaceholder}
          onChange={onSearchChange}
        />

        <SuggestionsTabBarMobile
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
    </MobilePageContainer>
  );
}
