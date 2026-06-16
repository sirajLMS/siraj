"use client";

import { Button, Typography } from "@mui/material";
import type { GridColDef } from "@mui/x-data-grid";
import { useMemo } from "react";
import { AppDataGrid, StatusBadge } from "@/frontend/components/ui";
import type { SuggestionsAdminLabels } from "@/frontend/messages/types/dashboard/suggestions/main";
import type { AdminSuggestionRow, SuggestionStatus } from "@/frontend/stores/adminSuggestionsStore";

interface SuggestionsDataGridProps {
  readonly rows: readonly AdminSuggestionRow[];
  readonly labels: SuggestionsAdminLabels;
  readonly canManage: boolean;
  readonly onMarkReviewed: (id: string) => void;
}

function mapStatusForBadge(status: SuggestionStatus): string {
  if (status === "reviewed") {
    return "paid";
  }

  return "pending";
}

export function SuggestionsDataGrid({ rows, labels, canManage, onMarkReviewed }: Readonly<SuggestionsDataGridProps>) {
  const columns = useMemo<GridColDef<AdminSuggestionRow>[]>(
    () => [
      {
        field: "parentName",
        headerName: labels.table.parentName,
        flex: 0.9,
        minWidth: 140,
        renderCell: ({ row }) => (
          <Typography variant="bodyMd" sx={{ fontWeight: 700 }}>
            {row.parentName}
          </Typography>
        ),
      },
      {
        field: "suggestionPreview",
        headerName: labels.table.suggestion,
        flex: 1.6,
        minWidth: 260,
        renderCell: ({ row }) => (
          <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.text.secondary })}>
            {row.suggestionPreview}
          </Typography>
        ),
      },
      {
        field: "submittedAt",
        headerName: labels.table.submittedAt,
        flex: 0.8,
        minWidth: 120,
        renderCell: ({ row }) => (
          <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.text.secondary })}>
            {row.submittedAt}
          </Typography>
        ),
      },
      {
        field: "status",
        headerName: labels.table.status,
        flex: 0.7,
        minWidth: 110,
        renderCell: ({ row }) => (
          <StatusBadge
            category="invoice"
            status={mapStatusForBadge(row.status)}
            label={labels.statusLabels[row.status]}
          />
        ),
      },
      {
        field: "actions",
        headerName: labels.table.actions,
        flex: 0.8,
        minWidth: 140,
        sortable: false,
        align: "right",
        headerAlign: "right",
        renderCell: ({ row }) => {
          if (!canManage || row.status === "reviewed") {
            return null;
          }

          return (
            <Button
              variant="text"
              onClick={() => {
                onMarkReviewed(row.id);
              }}
              sx={{ fontWeight: 700, textTransform: "uppercase" }}
            >
              {labels.table.markReviewed}
            </Button>
          );
        },
      },
    ],
    [canManage, labels, onMarkReviewed]
  );

  return <AppDataGrid rows={rows} columns={columns} getRowId={row => row.id} emptyMessage={labels.table.noEntries} />;
}
