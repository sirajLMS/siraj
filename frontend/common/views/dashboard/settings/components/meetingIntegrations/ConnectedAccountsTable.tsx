"use client";

import { Box, Button, CircularProgress, Typography } from "@mui/material";
import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import type {
  MeetingIntegrationConnectedAccount,
  MeetingIntegrationProviderSlug,
  MeetingIntegrationsViewModel,
} from "@/frontend/common/views/dashboard/settings/types/meetingIntegrations.types";
import type { SettingsMeetingIntegrationsLabels } from "@/shared/locale/types/dashboard/settings/meeting-integrations";

export function ConnectedAccountsTable({
  labels,
  accounts,
  loading,
  providerSlug,
  viewModel,
  onRevokeRequest,
}: {
  readonly labels: SettingsMeetingIntegrationsLabels;
  readonly accounts: readonly MeetingIntegrationConnectedAccount[];
  readonly loading: boolean;
  readonly providerSlug: MeetingIntegrationProviderSlug;
  readonly viewModel: MeetingIntegrationsViewModel;
  readonly onRevokeRequest: (
    account: MeetingIntegrationConnectedAccount,
    providerSlug: MeetingIntegrationProviderSlug
  ) => void;
}) {
  if (loading) {
    return (
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, py: 2 }}>
        <CircularProgress size={16} />
        <Typography sx={{ typography: "bodySm", color: "text.secondary" }}>{labels.loading}</Typography>
      </Box>
    );
  }

  if (accounts.length === 0) {
    return (
      <Typography sx={{ typography: "bodySm", color: "text.secondary", py: 1 }}>
        {labels.noConnectedAccounts}
      </Typography>
    );
  }

  const columns: GridColDef[] = [
    { field: "name", headerName: labels.columns.name, flex: 1 },
    { field: "email", headerName: labels.columns.email, flex: 1 },
    {
      field: "connectedAt",
      headerName: labels.columns.connectedAt,
      flex: 0.75,
      valueFormatter: (value: string | null) => (value ? new Date(value).toLocaleDateString() : ""),
    },
    {
      field: "expiresAt",
      headerName: labels.columns.expiresAt,
      flex: 0.75,
      valueFormatter: (value: string | null) => (value ? new Date(value).toLocaleDateString() : ""),
    },
    { field: "status", headerName: labels.columns.status, flex: 0.5 },
    {
      field: "actions",
      headerName: labels.columns.actions,
      flex: 0.5,
      renderCell: params => {
        const account = params.row as MeetingIntegrationConnectedAccount;
        return (
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button size="small" onClick={() => viewModel.onMetadataDialogOpen(account, providerSlug)}>
              {labels.actions.viewMetadata}
            </Button>
            <Button
              size="small"
              color="error"
              disabled={
                viewModel.revokingFor?.userId === account.userId && viewModel.revokingFor?.providerSlug === providerSlug
              }
              onClick={() => onRevokeRequest(account, providerSlug)}
            >
              {labels.actions.revoke}
            </Button>
          </Box>
        );
      },
    },
  ];

  return (
    <Box>
      <Typography sx={{ typography: "labelUppercase", color: "text.secondary", mb: 0.5 }}>
        {labels.connectedAccounts}
      </Typography>
      <DataGrid
        rows={accounts}
        columns={columns}
        getRowId={row => (row as MeetingIntegrationConnectedAccount).id}
        autoHeight
        hideFooter
        disableRowSelectionOnClick
      />
    </Box>
  );
}
