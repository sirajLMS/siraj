"use client";

import { Box, Button, Chip, TextField } from "@mui/material";
import type { GridColDef } from "@mui/x-data-grid";
import { useMemo } from "react";
import {
  getStatusColor,
  getStatusLabel,
  isMeetingIntegrationConnectedAccount,
  isRevokeDisabled,
  useConnectedAccountsFilter,
} from "@/frontend/common/views/dashboard/settings/components/meetingIntegrations/connectedAccounts.helpers";
import { StatusFilterSelect } from "@/frontend/common/views/dashboard/settings/components/meetingIntegrations/StatusFilterSelect";
import type { ConnectedAccountsTableProps } from "@/frontend/common/views/dashboard/settings/types/meetingIntegrations.types";
import { DesktopAppDataGrid } from "@/frontend/desktop/components/ui/dataGrid/DesktopAppDataGrid";

export function ConnectedAccountsTableDesktop({
  labels,
  accounts,
  loading,
  providerSlug,
  canEdit,
  revokingFor,
  onRevokeRequest,
  onMetadataDialogOpen,
}: Readonly<ConnectedAccountsTableProps>) {
  const { search, setSearch, statusFilter, setStatusFilter, providerName, filteredRows } = useConnectedAccountsFilter(
    accounts,
    providerSlug,
    labels
  );

  const columns: GridColDef[] = useMemo(() => {
    const cols: GridColDef[] = [
      {
        field: "name",
        headerName: labels.columns.name,
        flex: 1.2,
        minWidth: 140,
        valueGetter: (_value, row) => (isMeetingIntegrationConnectedAccount(row) ? (row.name ?? "") : ""),
      },
      {
        field: "email",
        headerName: labels.columns.email,
        flex: 1.2,
        minWidth: 160,
        valueGetter: (_value, row) => (isMeetingIntegrationConnectedAccount(row) ? (row.email ?? "") : ""),
      },
      {
        field: "connectedAt",
        headerName: labels.columns.connectedAt,
        flex: 0.75,
        minWidth: 130,
        type: "date",
        valueGetter: (_value, row) =>
          isMeetingIntegrationConnectedAccount(row) && row.connectedAt ? row.connectedAt : null,
        valueFormatter: (value: Date | null) => (value ? value.toLocaleDateString() : ""),
      },
      {
        field: "expiresAt",
        headerName: labels.columns.expiresAt,
        flex: 0.75,
        minWidth: 130,
        type: "date",
        valueGetter: (_value, row) =>
          isMeetingIntegrationConnectedAccount(row) && row.expiresAt ? row.expiresAt : null,
        valueFormatter: (value: Date | null) => (value ? value.toLocaleDateString() : ""),
      },
      {
        field: "status",
        headerName: labels.columns.status,
        flex: 0.6,
        minWidth: 120,
        sortable: true,
        renderCell: params => {
          if (!isMeetingIntegrationConnectedAccount(params.row)) {
            return null;
          }
          // Placeholder: Replace with OAuthConnectionStatusBadge component in Phase 4
          return (
            <Chip
              size="small"
              label={getStatusLabel(params.row.status, labels)}
              color={getStatusColor(params.row.status)}
              variant="outlined"
            />
          );
        },
      },
    ];

    if (canEdit) {
      cols.push({
        field: "actions",
        headerName: labels.columns.actions,
        width: 200,
        sortable: false,
        renderCell: params => {
          const account = params.row;
          if (!isMeetingIntegrationConnectedAccount(account)) {
            return null;
          }
          return (
            <Box sx={{ display: "flex", gap: 1 }}>
              <Button size="small" onClick={() => onMetadataDialogOpen(account, providerSlug)}>
                {labels.actions.viewMetadata}
              </Button>
              <Button
                size="small"
                color="error"
                disabled={isRevokeDisabled(account, revokingFor, providerSlug)}
                onClick={() => onRevokeRequest(account, providerSlug)}
              >
                {labels.actions.revoke}
              </Button>
            </Box>
          );
        },
      });
    }

    return cols;
  }, [labels, canEdit, providerSlug, revokingFor, onMetadataDialogOpen, onRevokeRequest]);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
      <Box sx={{ typography: "labelUppercase", color: theme => theme.palette.text.secondary, mb: 0.5 }}>
        {labels.connectedAccounts} — {providerName}
      </Box>
      <Box sx={{ display: "flex", gap: 1, alignItems: "center", mb: 1 }}>
        <TextField size="small" value={search} onChange={e => setSearch(e.target.value)} sx={{ minWidth: 200 }} />
        <StatusFilterSelect value={statusFilter} onChange={setStatusFilter} labels={labels} minWidth={140} />
      </Box>
      <Box sx={{ height: 300 }}>
        <DesktopAppDataGrid
          rows={filteredRows}
          columns={columns}
          loading={loading}
          getRowId={row => (isMeetingIntegrationConnectedAccount(row) ? row.id : String(row))}
          emptyMessage={labels.noConnectedAccounts}
          initialState={{
            sorting: {
              sortModel: [{ field: "connectedAt", sort: "desc" }],
            },
          }}
          paginationOptions={{ mode: "client", pageSize: 10 }}
        />
      </Box>
    </Box>
  );
}
