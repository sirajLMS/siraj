"use client";

import { Box, Button, Stack, Typography } from "@mui/material";
import type { ReactNode } from "react";
import { SearchBarField } from "@/frontend/common/components/ui/input/searchBarField";
import { MeetingIntegrationConnectedAccountStatus } from "@/frontend/common/graphql/generated/gql/graphql";
import {
  formatConnectedAccountDate,
  getStatusLabel,
  useConnectedAccountsFilter,
} from "@/frontend/common/views/dashboard/settings/components/meetingIntegrations/connectedAccounts.helpers";
import { StatusFilterSelect } from "@/frontend/common/views/dashboard/settings/components/meetingIntegrations/StatusFilterSelect";
import type {
  ConnectedAccountsTableProps,
  MeetingIntegrationConnectedAccount,
} from "@/frontend/common/views/dashboard/settings/types/meetingIntegrations.types";
import {
  MobileCardList,
  MobileCardListItem,
  MobileContentInset,
  MobileStatusBadge,
} from "@/frontend/mobile/components/ui";
import type { SettingsMeetingIntegrationsLabels } from "@/shared/locale/types/dashboard/settings/meeting-integrations";

const OAUTH_STATUS_TO_SYNC: Record<MeetingIntegrationConnectedAccountStatus, string> = {
  [MeetingIntegrationConnectedAccountStatus.Connected]: "success",
  [MeetingIntegrationConnectedAccountStatus.ExpiringSoon]: "partial",
  [MeetingIntegrationConnectedAccountStatus.ReauthNeeded]: "failed",
  [MeetingIntegrationConnectedAccountStatus.Revoked]: "unknown",
};

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
          <Typography sx={{ typography: "titleLg" }}>{account.name ?? "—"}</Typography>
          <MobileStatusBadge
            category="syncStatus"
            status={OAUTH_STATUS_TO_SYNC[account.status]}
            label={getStatusLabel(account.status, labels)}
          />
        </Stack>

        <Stack spacing={0.5}>
          <Typography sx={{ typography: "bodyMd", color: theme => theme.palette.text.secondary }}>
            {labels.columns.email}: {account.email ?? "—"}
          </Typography>
          <Typography sx={{ typography: "bodyMd", color: theme => theme.palette.text.secondary }}>
            {labels.columns.connectedAt}: {formatConnectedAccountDate(account.connectedAt)}
          </Typography>
          <Typography sx={{ typography: "bodyMd", color: theme => theme.palette.text.secondary }}>
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

      <MobileContentInset sx={{ mb: 1 }}>
        <Stack direction="row" spacing={1} sx={{ alignItems: "flex-start" }}>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <SearchBarField
              value={search}
              placeholder={labels.searchPlaceholder}
              searchingLabel={labels.searching}
              isSearching={search.trim().length > 0}
              onChange={setSearch}
            />
          </Box>
          <StatusFilterSelect value={statusFilter} onChange={setStatusFilter} labels={labels} minWidth={120} />
        </Stack>
      </MobileContentInset>

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
