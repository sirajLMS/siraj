"use client";

import { Button, Typography } from "@mui/material";
import type { GridColDef } from "@mui/x-data-grid";
import { useMemo } from "react";
import { AppDataGrid, StatusBadge } from "@/frontend/components/ui";
import { SuggestionStatus } from "@/frontend/graphql/generated/gql/graphql-types";
import type { AdminSuggestionRow } from "../types/suggestions.types";
import type { SuggestionsDataGridProps } from "../types/suggestionsView.types";
import { mapStatusForBadge, statusLabelKey } from "../utils/suggestionStatusMap";

function actionButtons(
  row: AdminSuggestionRow,
  canManage: boolean,
  canDelete: boolean,
  labels: SuggestionsDataGridProps["labels"],
  onMarkReviewed: (id: string) => void,
  onRespond: (id: string) => void,
  onMarkDuplicate: (id: string) => void,
  onDelete: (id: string) => void
) {
  if (row.status === SuggestionStatus.Reviewed) {
    return null;
  }

  return (
    <Typography component="div" sx={{ display: "flex", gap: 0.5, justifyContent: "flex-end" }}>
      {canManage && row.status === SuggestionStatus.Pending && (
        <>
          <Button
            variant="text"
            size="small"
            onClick={() => {
              onMarkReviewed(row.id);
            }}
            sx={{ fontWeight: 700, textTransform: "uppercase" }}
          >
            {labels.table.markReviewed}
          </Button>
          <Button
            variant="text"
            size="small"
            onClick={() => {
              onRespond(row.id);
            }}
            sx={{ fontWeight: 700, textTransform: "uppercase" }}
          >
            {labels.table.respond}
          </Button>
          <Button
            variant="text"
            size="small"
            onClick={() => {
              onMarkDuplicate(row.id);
            }}
            sx={{ fontWeight: 700, textTransform: "uppercase" }}
          >
            {labels.table.markDuplicate}
          </Button>
        </>
      )}
      {canDelete && (
        <Button
          variant="text"
          color="error"
          size="small"
          onClick={() => {
            onDelete(row.id);
          }}
          sx={{ fontWeight: 700, textTransform: "uppercase" }}
        >
          {labels.table.delete}
        </Button>
      )}
    </Typography>
  );
}

export function SuggestionsDataGrid({
  rows,
  labels,
  canManage,
  canDelete,
  onMarkReviewed,
  onRespond,
  onMarkDuplicate,
  onDelete,
}: Readonly<SuggestionsDataGridProps>) {
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
            label={labels.statusLabels[statusLabelKey(row.status)]}
          />
        ),
      },
      {
        field: "actions",
        headerName: labels.table.actions,
        flex: 1.4,
        minWidth: 280,
        sortable: false,
        align: "right",
        headerAlign: "right",
        renderCell: ({ row }) =>
          actionButtons(row, canManage, canDelete, labels, onMarkReviewed, onRespond, onMarkDuplicate, onDelete),
      },
    ],
    [canManage, canDelete, labels, onMarkReviewed, onRespond, onMarkDuplicate, onDelete]
  );

  return <AppDataGrid rows={rows} columns={columns} getRowId={row => row.id} emptyMessage={labels.table.noEntries} />;
}
