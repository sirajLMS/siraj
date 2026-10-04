"use client";

import { Box, Button } from "@mui/material";
import { SuggestionStatus } from "@/frontend/common/graphql/generated/gql/graphql";
import type { AdminSuggestionRow } from "@/frontend/common/views/dashboard/suggestions/types/suggestions.types";
import type { SuggestionsDataGridProps } from "@/frontend/common/views/dashboard/suggestions/types/suggestionsView.types";

export type SuggestionActionHandlers = {
  canManage: boolean;
  canDelete: boolean;
  labels: SuggestionsDataGridProps["labels"];
  onMarkReviewed: (id: string) => void;
  onRespond: (id: string) => void;
  onMarkDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
};

const ACTION_BUTTON_SX = { fontWeight: 700, textTransform: "uppercase" } as const;

function reviewActions(row: AdminSuggestionRow, handlers: SuggestionActionHandlers) {
  const { labels, onMarkReviewed, onRespond, onMarkDuplicate } = handlers;
  return (
    <>
      <Button
        variant="text"
        size="small"
        onClick={() => {
          onMarkReviewed(row.id);
        }}
        sx={ACTION_BUTTON_SX}
      >
        {labels.table.markReviewed}
      </Button>
      <Button
        variant="text"
        size="small"
        onClick={() => {
          onRespond(row.id);
        }}
        sx={ACTION_BUTTON_SX}
      >
        {labels.table.respond}
      </Button>
      <Button
        variant="text"
        size="small"
        onClick={() => {
          onMarkDuplicate(row.id);
        }}
        sx={ACTION_BUTTON_SX}
      >
        {labels.table.markDuplicate}
      </Button>
    </>
  );
}

export function suggestionActionButtons(row: AdminSuggestionRow, handlers: SuggestionActionHandlers) {
  const { canManage, canDelete, labels, onDelete } = handlers;

  if (row.status === SuggestionStatus.Reviewed) {
    return null;
  }

  return (
    <Box sx={{ display: "flex", gap: 0.5, justifyContent: "flex-end" }}>
      {canManage && row.status === SuggestionStatus.Pending && reviewActions(row, handlers)}
      {canDelete && (
        <Button
          variant="text"
          color="error"
          size="small"
          onClick={() => {
            onDelete(row.id);
          }}
          sx={ACTION_BUTTON_SX}
        >
          {labels.table.delete}
        </Button>
      )}
    </Box>
  );
}
