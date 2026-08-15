"use client";

import { Box, Button, Chip, MenuItem, Select, TextField } from "@mui/material";
import type { GridColDef } from "@mui/x-data-grid";
import { useMemo, useState } from "react";
import {
  MeetingIntegrationConnectedAccountStatus,
  MeetingIntegrationProviderSlug,
} from "@/frontend/common/graphql/generated/gql/graphql-types";
import type {
  ConnectedAccountsTableProps,
  MeetingIntegrationConnectedAccount,
  MeetingIntegrationProviderSlug as ProviderSlugType,
} from "@/frontend/common/views/dashboard/settings/types/meetingIntegrations.types";
import { DesktopAppDataGrid } from "@/frontend/desktop/components/ui/dataGrid/DesktopAppDataGrid";
import type { SettingsMeetingIntegrationsLabels } from "@/shared/locale/types/dashboard/settings/meeting-integrations";

function isMeetingIntegrationConnectedAccount(value: unknown): value is MeetingIntegrationConnectedAccount {
  return typeof value === "object" && value !== null && "userId" in value;
}

function getProviderLabel(slug: MeetingIntegrationProviderSlug, labels: SettingsMeetingIntegrationsLabels): string {
  switch (slug) {
    case MeetingIntegrationProviderSlug.Zoom:
      return labels.provider.zoom;
    case MeetingIntegrationProviderSlug.GoogleMeet:
      return labels.provider.googleMeet;
    case MeetingIntegrationProviderSlug.MicrosoftTeams:
      return labels.provider.microsoftTeams;
    default:
      return String(slug);
  }
}

function getStatusLabel(
  status: MeetingIntegrationConnectedAccountStatus,
  labels: SettingsMeetingIntegrationsLabels
): string {
  switch (status) {
    case MeetingIntegrationConnectedAccountStatus.Connected:
      return labels.status.connected;
    case MeetingIntegrationConnectedAccountStatus.ExpiringSoon:
      return labels.status.expiringSoon;
    case MeetingIntegrationConnectedAccountStatus.ReauthNeeded:
      return labels.status.reauthNeeded;
    case MeetingIntegrationConnectedAccountStatus.Revoked:
      return labels.status.revoked;
    default:
      return String(status);
  }
}

function getStatusColor(status: MeetingIntegrationConnectedAccountStatus): "success" | "warning" | "error" | "default" {
  switch (status) {
    case MeetingIntegrationConnectedAccountStatus.Connected:
      return "success";
    case MeetingIntegrationConnectedAccountStatus.ExpiringSoon:
      return "warning";
    case MeetingIntegrationConnectedAccountStatus.ReauthNeeded:
      return "error";
    case MeetingIntegrationConnectedAccountStatus.Revoked:
      return "default";
    default:
      return "default";
  }
}

function isRevokeDisabled(
  account: MeetingIntegrationConnectedAccount,
  revokingFor: ConnectedAccountsTableProps["revokingFor"],
  providerSlug: ProviderSlugType
): boolean {
  return revokingFor?.userId === account.userId && revokingFor?.providerSlug === providerSlug;
}

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
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<MeetingIntegrationConnectedAccountStatus | "all">("all");

  const providerName = useMemo(() => getProviderLabel(providerSlug, labels), [providerSlug, labels]);

  const filteredRows = useMemo(() => {
    const lowerSearch = search.trim().toLowerCase();
    return accounts.filter(account => {
      if (statusFilter !== "all" && account.status !== statusFilter) {
        return false;
      }
      if (lowerSearch.length === 0) {
        return true;
      }
      const nameMatch = (account.name ?? "").toLowerCase().includes(lowerSearch);
      const emailMatch = (account.email ?? "").toLowerCase().includes(lowerSearch);
      return nameMatch || emailMatch;
    });
  }, [accounts, search, statusFilter]);

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
        <Select
          size="small"
          value={statusFilter}
          onChange={e => {
            const val = e.target.value;
            setStatusFilter(val === "all" ? "all" : val);
          }}
          sx={{ minWidth: 140 }}
        >
          <MenuItem value="all">{labels.columns.status}</MenuItem>
          <MenuItem value={MeetingIntegrationConnectedAccountStatus.Connected}>{labels.status.connected}</MenuItem>
          <MenuItem value={MeetingIntegrationConnectedAccountStatus.ExpiringSoon}>
            {labels.status.expiringSoon}
          </MenuItem>
          <MenuItem value={MeetingIntegrationConnectedAccountStatus.ReauthNeeded}>
            {labels.status.reauthNeeded}
          </MenuItem>
          <MenuItem value={MeetingIntegrationConnectedAccountStatus.Revoked}>{labels.status.revoked}</MenuItem>
        </Select>
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
