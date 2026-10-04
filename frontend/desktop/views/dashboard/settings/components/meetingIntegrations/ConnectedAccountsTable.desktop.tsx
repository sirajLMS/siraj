"use client";

import { Box } from "@mui/material";
import { useMemo } from "react";
import { SearchBarField } from "@/frontend/common/components/ui/input/searchBarField";
import {
  isMeetingIntegrationConnectedAccount,
  useConnectedAccountsFilter,
} from "@/frontend/common/views/dashboard/settings/components/meetingIntegrations/connectedAccounts.helpers";
import { StatusFilterSelect } from "@/frontend/common/views/dashboard/settings/components/meetingIntegrations/StatusFilterSelect";
import type { ConnectedAccountsTableProps } from "@/frontend/common/views/dashboard/settings/types/meetingIntegrations.types";
import { DesktopAppDataGrid } from "@/frontend/desktop/components/ui/dataGrid/DesktopAppDataGrid";
import { buildConnectedAccountsTableColumns } from "@/frontend/desktop/views/dashboard/settings/components/meetingIntegrations/connectedAccountsTableColumns.desktop";

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

  // RENDER OPT JUSTIFICATION: DesktopAppDataGrid — memoizing the columns array
  // preserves JSX identity between renders; no data derivation happens here.
  const columns = useMemo(
    () =>
      buildConnectedAccountsTableColumns({
        labels,
        canEdit,
        providerSlug,
        revokingFor,
        onRevokeRequest,
        onMetadataDialogOpen,
      }),
    [labels, canEdit, providerSlug, revokingFor, onMetadataDialogOpen, onRevokeRequest]
  );

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
      <Box sx={{ typography: "labelUppercase", color: theme => theme.palette.text.secondary, mb: 0.5 }}>
        {labels.connectedAccounts} — {providerName}
      </Box>
      <Box sx={{ display: "flex", gap: 1, alignItems: "flex-start", mb: 1 }}>
        <Box sx={{ flexGrow: 1, maxWidth: 420, minWidth: 200 }}>
          <SearchBarField
            value={search}
            placeholder={labels.searchPlaceholder}
            searchingLabel={labels.searching}
            isSearching={search.trim().length > 0}
            onChange={setSearch}
          />
        </Box>
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
