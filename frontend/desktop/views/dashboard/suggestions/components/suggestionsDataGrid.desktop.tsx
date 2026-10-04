"use client";

import { Typography } from "@mui/material";
import type { GridColDef } from "@mui/x-data-grid";
import { useMemo } from "react";
import { profileHrefForParent } from "@/frontend/common/utils/profileHref";
import type { AdminSuggestionRow } from "@/frontend/common/views/dashboard/suggestions/types/suggestions.types";
import type { SuggestionsDataGridProps } from "@/frontend/common/views/dashboard/suggestions/types/suggestionsView.types";
import {
  mapStatusForBadge,
  statusLabelKey,
} from "@/frontend/common/views/dashboard/suggestions/utils/suggestionStatusMap";
import { DesktopAppDataGrid, DesktopPersonProfileLinkCell, DesktopStatusBadge } from "@/frontend/desktop/components/ui";
import { suggestionActionButtons } from "@/frontend/desktop/views/dashboard/suggestions/components/suggestionsDataGrid.desktop.parts";

export function SuggestionsDataGridDesktop({
  rows,
  labels,
  canManage,
  canDelete,
  onMarkReviewed,
  onRespond,
  onMarkDuplicate,
  onDelete,
  loading = false,
}: Readonly<SuggestionsDataGridProps>) {
  const columns = useMemo<GridColDef<AdminSuggestionRow>[]>(
    () => [
      {
        field: "parentName",
        headerName: labels.table.parentName,
        flex: 0.9,
        minWidth: 140,
        renderCell: ({ row }) => (
          <DesktopPersonProfileLinkCell
            name={row.parentName}
            href={profileHrefForParent({ userId: row.parentUserId, parentId: row.parentId })}
            avatarSize={32}
            fontWeight={700}
          />
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
          <DesktopStatusBadge
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
          suggestionActionButtons(row, {
            canManage,
            canDelete,
            labels,
            onMarkReviewed,
            onRespond,
            onMarkDuplicate,
            onDelete,
          }),
      },
    ],
    [canManage, canDelete, labels, onMarkReviewed, onRespond, onMarkDuplicate, onDelete]
  );

  return (
    <DesktopAppDataGrid
      rows={rows}
      columns={columns}
      getRowId={row => row.id}
      emptyMessage={labels.table.noEntries}
      loading={loading}
      paginationOptions={{ mode: "client" }}
    />
  );
}
