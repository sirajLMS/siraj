"use client";

import { Box, Button } from "@mui/material";
import type { GridColDef } from "@mui/x-data-grid";
import { StatusBadge } from "@/frontend/common/components/ui";
import { MeetingIntegrationConnectedAccountStatus } from "@/frontend/common/graphql/generated/gql/graphql";
import {
  getStatusLabel,
  isMeetingIntegrationConnectedAccount,
  isRevokeDisabled,
} from "@/frontend/common/views/dashboard/settings/components/meetingIntegrations/connectedAccounts.helpers";
import type { ConnectedAccountsTableProps } from "@/frontend/common/views/dashboard/settings/types/meetingIntegrations.types";
import type { SettingsMeetingIntegrationsLabels } from "@/shared/locale/types/dashboard/settings/meeting-integrations";

const OAUTH_STATUS_TO_SYNC: Record<MeetingIntegrationConnectedAccountStatus, string> = {
  [MeetingIntegrationConnectedAccountStatus.Connected]: "success",
  [MeetingIntegrationConnectedAccountStatus.ExpiringSoon]: "partial",
  [MeetingIntegrationConnectedAccountStatus.ReauthNeeded]: "failed",
  [MeetingIntegrationConnectedAccountStatus.Revoked]: "unknown",
};

interface BuildConnectedAccountsTableColumnsParams {
  readonly labels: SettingsMeetingIntegrationsLabels;
  readonly canEdit: boolean;
  readonly providerSlug: ConnectedAccountsTableProps["providerSlug"];
  readonly revokingFor: ConnectedAccountsTableProps["revokingFor"];
  readonly onRevokeRequest: ConnectedAccountsTableProps["onRevokeRequest"];
  readonly onMetadataDialogOpen: ConnectedAccountsTableProps["onMetadataDialogOpen"];
}

export function buildConnectedAccountsTableColumns({
  labels,
  canEdit,
  providerSlug,
  revokingFor,
  onRevokeRequest,
  onMetadataDialogOpen,
}: Readonly<BuildConnectedAccountsTableColumnsParams>): GridColDef[] {
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
      valueGetter: (_value, row) => (isMeetingIntegrationConnectedAccount(row) && row.expiresAt ? row.expiresAt : null),
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
        return (
          <StatusBadge
            category="syncStatus"
            status={OAUTH_STATUS_TO_SYNC[params.row.status]}
            label={getStatusLabel(params.row.status, labels)}
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
}
