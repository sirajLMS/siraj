"use client";

import { Box, Button, Chip, MenuItem, Select, Stack, Typography } from "@mui/material";
import { type ReactNode, useMemo, useState } from "react";
import {
  MeetingIntegrationConnectedAccountStatus,
  MeetingIntegrationProviderSlug,
} from "@/frontend/common/graphql/generated/gql/graphql-types";
import type {
  ConnectedAccountsTableProps,
  MeetingIntegrationConnectedAccount,
} from "@/frontend/common/views/dashboard/settings/types/meetingIntegrations.types";
import { MobileCardList, MobileCardListItem } from "@/frontend/mobile/components/ui";
import type { SettingsMeetingIntegrationsLabels } from "@/shared/locale/types/dashboard/settings/meeting-integrations";

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

function formatDate(date: Date | null): string {
  return date ? date.toLocaleDateString() : "—";
}

interface AccountCardProps {
  readonly account: MeetingIntegrationConnectedAccount;
  readonly labels: SettingsMeetingIntegrationsLabels;
  readonly canEdit: boolean;
  readonly isRevoking: boolean;
  readonly onRevoke: () => void;
  readonly onMetadata: () => void;
}

function AccountCard({ account, labels, canEdit, isRevoking, onRevoke, onMetadata }: AccountCardProps) {
  return (
    <MobileCardListItem variant="edge-to-edge">
      <Stack spacing={1.5} sx={{ py: 2, width: "100%" }}>
        <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between", gap: 1 }}>
          <Typography sx={{ typography: "titleMd" }}>{account.name ?? "—"}</Typography>
          {/* Placeholder: Replace with OAuthConnectionStatusBadge component in Phase 4 */}
          <Chip
            size="small"
            label={getStatusLabel(account.status, labels)}
            color={getStatusColor(account.status)}
            variant="outlined"
          />
        </Stack>

        <Stack spacing={0.5}>
          <Typography sx={{ typography: "bodySm", color: theme => theme.palette.text.secondary }}>
            {labels.columns.email}: {account.email ?? "—"}
          </Typography>
          <Typography sx={{ typography: "bodySm", color: theme => theme.palette.text.secondary }}>
            {labels.columns.connectedAt}: {formatDate(account.connectedAt)}
          </Typography>
          <Typography sx={{ typography: "bodySm", color: theme => theme.palette.text.secondary }}>
            {labels.columns.expiresAt}: {formatDate(account.expiresAt)}
          </Typography>
        </Stack>

        {canEdit ? (
          <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
            <Button variant="outlined" size="small" onClick={onMetadata} sx={{ minHeight: 48 }}>
              {labels.actions.viewMetadata}
            </Button>
            <Button
              variant="outlined"
              size="small"
              color="error"
              disabled={isRevoking}
              onClick={onRevoke}
              sx={{ minHeight: 48 }}
            >
              {labels.actions.revoke}
            </Button>
          </Stack>
        ) : null}
      </Stack>
    </MobileCardListItem>
  );
}

export function ConnectedAccountsTableMobile({
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

  const renderItem = (account: MeetingIntegrationConnectedAccount): ReactNode => (
    <AccountCard
      account={account}
      labels={labels}
      canEdit={canEdit}
      isRevoking={revokingFor?.userId === account.userId && revokingFor?.providerSlug === providerSlug}
      onRevoke={() => onRevokeRequest(account, providerSlug)}
      onMetadata={() => onMetadataDialogOpen(account, providerSlug)}
    />
  );

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
      <Typography sx={{ typography: "labelUppercase", color: theme => theme.palette.text.secondary, mb: 0.5 }}>
        {labels.connectedAccounts} — {providerName}
      </Typography>

      <Stack direction="row" spacing={1} sx={{ px: 2, mb: 1 }}>
        <Box
          component="input"
          value={search}
          onChange={e => setSearch(e.target.value)}
          sx={{
            flex: 1,
            minWidth: 0,
            border: theme => `1px solid ${theme.palette.outlineVariant}`,
            borderRadius: 1,
            py: 0.75,
            px: 1.5,
            typography: "bodyMd",
            backgroundColor: theme => theme.palette.background.paper,
            color: theme => theme.palette.text.primary,
            outline: "none",
          }}
        />
        <Select
          size="small"
          value={statusFilter}
          onChange={e => {
            const val = e.target.value;
            setStatusFilter(val === "all" ? "all" : val);
          }}
          sx={{ minWidth: 120 }}
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
      </Stack>

      <MobileCardList
        rows={filteredRows}
        loading={loading}
        emptyMessage={labels.noConnectedAccounts}
        gap={1.5}
        layout="edge-to-edge"
        getKey={account => account.id}
        renderItem={renderItem}
        paginationOptions={{ mode: "client", pageSize: 10 }}
      />
    </Box>
  );
}
