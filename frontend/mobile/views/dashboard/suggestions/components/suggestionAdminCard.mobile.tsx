"use client";

import { Box, Button, Typography } from "@mui/material";
import { SuggestionStatus } from "@/frontend/common/graphql/generated/gql/graphql";
import type { AdminSuggestionRow } from "@/frontend/common/views/dashboard/suggestions/types/suggestions.types";
import type { SuggestionsAdminLabels } from "@/frontend/common/views/dashboard/suggestions/types/suggestionsView.types";
import {
  mapStatusForBadge,
  statusLabelKey,
} from "@/frontend/common/views/dashboard/suggestions/utils/suggestionStatusMap";
import { MobileCardListItem, MobileContentStack } from "@/frontend/mobile/components/ui";
import { MobileStatusBadge } from "@/frontend/mobile/components/ui/badge";

interface SuggestionCardActionsProps {
  readonly row: AdminSuggestionRow;
  readonly showPrimaryActions: boolean;
  readonly canDelete: boolean;
  readonly labels: SuggestionsAdminLabels;
  readonly onMarkReviewed: (id: string) => void;
  readonly onRespond: (id: string) => void;
  readonly onMarkDuplicate: (id: string) => void;
  readonly onDelete: (id: string) => void;
}

function SuggestionCardActions({
  row,
  showPrimaryActions,
  canDelete,
  labels,
  onMarkReviewed,
  onRespond,
  onMarkDuplicate,
  onDelete,
}: SuggestionCardActionsProps) {
  if (!showPrimaryActions && !canDelete) {
    return null;
  }

  const primaryActions = showPrimaryActions
    ? [
        { key: "markReviewed", label: labels.table.markReviewed, onClick: onMarkReviewed },
        { key: "respond", label: labels.table.respond, onClick: onRespond },
        { key: "markDuplicate", label: labels.table.markDuplicate, onClick: onMarkDuplicate },
      ]
    : [];

  return (
    <MobileContentStack gap={1}>
      {primaryActions.map(action => (
        <Button
          key={action.key}
          fullWidth
          variant="outlined"
          onClick={() => action.onClick(row.id)}
          sx={{ textTransform: "uppercase", fontWeight: 700 }}
        >
          {action.label}
        </Button>
      ))}
      {canDelete && (
        <Button
          fullWidth
          variant="outlined"
          color="error"
          onClick={() => onDelete(row.id)}
          sx={{ textTransform: "uppercase", fontWeight: 700 }}
        >
          {labels.table.delete}
        </Button>
      )}
    </MobileContentStack>
  );
}

export interface SuggestionCardItemProps {
  readonly row: AdminSuggestionRow;
  readonly canManage: boolean;
  readonly canDelete: boolean;
  readonly labels: SuggestionsAdminLabels;
  readonly onMarkReviewed: (id: string) => void;
  readonly onRespond: (id: string) => void;
  readonly onMarkDuplicate: (id: string) => void;
  readonly onDelete: (id: string) => void;
}

export function SuggestionCardItem({
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
  const hasAnyAction = showActions || canDelete;

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
      <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.text.secondary, mb: hasAnyAction ? 1.5 : 0 })}>
        {row.suggestionPreview}
      </Typography>
      <SuggestionCardActions
        row={row}
        showPrimaryActions={showActions}
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
