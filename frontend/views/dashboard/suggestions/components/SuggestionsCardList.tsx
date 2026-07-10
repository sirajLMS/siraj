"use client";

import { Box, Button, Paper, Typography } from "@mui/material";
import { StatusBadge } from "@/frontend/components/ui";
import { SuggestionStatus } from "@/frontend/graphql/generated/gql/graphql-types";
import type { SuggestionsCardListProps } from "@/frontend/views/dashboard/suggestions/types/suggestionsView.types";
import { mapStatusForBadge, statusLabelKey } from "@/frontend/views/dashboard/suggestions/utils/suggestionStatusMap";

export function SuggestionsCardList({
  rows,
  labels,
  canManage,
  canDelete,
  onMarkReviewed,
  onRespond,
  onMarkDuplicate,
  onDelete,
}: Readonly<SuggestionsCardListProps>) {
  if (rows.length === 0) {
    return (
      <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.text.secondary, py: 4, textAlign: "center" })}>
        {labels.table.noEntries}
      </Typography>
    );
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
      {rows.map(row => {
        const showActions = canManage && row.status === SuggestionStatus.Pending;

        return (
          <Paper
            key={row.id}
            elevation={0}
            sx={theme => ({
              p: 2,
              borderRadius: theme.layout.radius.card,
              border: `1px solid ${theme.palette.outlineVariant}`,
              backgroundColor: theme.palette.surfaceContainerLowest,
            })}
          >
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
            {showActions && (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={() => {
                    onMarkReviewed(row.id);
                  }}
                  sx={{ textTransform: "uppercase", fontWeight: 700 }}
                >
                  {labels.table.markReviewed}
                </Button>
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={() => {
                    onRespond(row.id);
                  }}
                  sx={{ textTransform: "uppercase", fontWeight: 700 }}
                >
                  {labels.table.respond}
                </Button>
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={() => {
                    onMarkDuplicate(row.id);
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
                      onDelete(row.id);
                    }}
                    sx={{ textTransform: "uppercase", fontWeight: 700 }}
                  >
                    {labels.table.delete}
                  </Button>
                )}
              </Box>
            )}
            {!showActions && canDelete && (
              <Button
                fullWidth
                variant="outlined"
                color="error"
                onClick={() => {
                  onDelete(row.id);
                }}
                sx={{ textTransform: "uppercase", fontWeight: 700 }}
              >
                {labels.table.delete}
              </Button>
            )}
          </Paper>
        );
      })}
    </Box>
  );
}
