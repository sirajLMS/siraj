"use client";

import { Box, Button, Chip, Stack, Typography } from "@mui/material";
import type { ReactNode } from "react";
import {
  formatConnectedAccountDate,
  getStatusColor,
  getStatusLabel,
  useConnectedAccountsFilter,
} from "@/frontend/common/views/dashboard/settings/components/meetingIntegrations/connectedAccounts.helpers";
import { StatusFilterSelect } from "@/frontend/common/views/dashboard/settings/components/meetingIntegrations/StatusFilterSelect";
import type {
  ConnectedAccountsTableProps,
  MeetingIntegrationConnectedAccount,
} from "@/frontend/common/views/dashboard/settings/types/meetingIntegrations.types";
import { MobileCardList, MobileCardListItem } from "@/frontend/mobile/components/ui";
import type { SettingsMeetingIntegrationsLabels } from "@/shared/locale/types/dashboard/settings/meeting-integrations";

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
            {labels.columns.connectedAt}: {formatConnectedAccountDate(account.connectedAt)}
          </Typography>
          <Typography sx={{ typography: "bodySm", color: theme => theme.palette.text.secondary }}>
            {labels.columns.expiresAt}: {formatConnectedAccountDate(account.expiresAt)}
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
  const { search, setSearch, statusFilter, setStatusFilter, providerName, filteredRows } = useConnectedAccountsFilter(
    accounts,
    providerSlug,
    labels
  );

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
        <StatusFilterSelect value={statusFilter} onChange={setStatusFilter} labels={labels} minWidth={120} />
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
