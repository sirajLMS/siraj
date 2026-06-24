"use client";

import { Box, Button, Paper, Typography } from "@mui/material";
import { StatusBadge } from "@/frontend/components/ui";
import type { SuggestionsAdminLabels } from "@/shared/messages/types/dashboard/suggestions/main";
import type { AdminSuggestionRow, SuggestionStatus } from "../types/suggestions.types";

interface SuggestionsCardListProps {
  readonly rows: readonly AdminSuggestionRow[];
  readonly labels: SuggestionsAdminLabels;
  readonly canManage: boolean;
  readonly onMarkReviewed: (id: string) => void;
}

function mapStatusForBadge(status: SuggestionStatus): string {
  if (status === "REVIEWED") {
    return "paid";
  }

  return "pending";
}

export function SuggestionsCardList({ rows, labels, canManage, onMarkReviewed }: Readonly<SuggestionsCardListProps>) {
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
        const showAction = canManage && row.status === "PENDING";
        const labelKey = row.status === "REVIEWED" ? "reviewed" : "pending";

        return (
          <Paper
            key={row.id}
            elevation={0}
            sx={theme => ({
              p: 2,
              borderRadius: theme.layout.radius.card,
              border: `1px solid ${theme.palette.outlineVariant}`,
              bgcolor: theme.palette.surfaceContainerLowest,
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
                label={labels.statusLabels[labelKey]}
              />
            </Box>
            <Typography
              variant="bodyMd"
              sx={theme => ({ color: theme.palette.text.secondary, mb: showAction ? 1.5 : 0 })}
            >
              {row.suggestionPreview}
            </Typography>
            {showAction && (
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
            )}
          </Paper>
        );
      })}
    </Box>
  );
}
