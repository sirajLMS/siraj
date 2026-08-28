"use client";

import { DownloadOutlined } from "@mui/icons-material";
import { Box, Stack } from "@mui/material";
import type { GridColDef } from "@mui/x-data-grid";
import { useMemo } from "react";
import { StatusBadge } from "@/frontend/common/components/ui";
import type { ListPaginationOptions } from "@/frontend/common/components/ui/filter/listPaginationOptions";
import { SearchBarField } from "@/frontend/common/components/ui/input/searchBarField";
import {
  useAdminUserSearch,
  useOptInHistoryExport,
} from "@/frontend/common/views/dashboard/settings/whatsapp/tabs/__shared__/optin";
import { OptInTabContent } from "@/frontend/common/views/dashboard/settings/whatsapp/tabs/shared/OptInTabContent";
import type { OptInTabSharedProps } from "@/frontend/common/views/dashboard/settings/whatsapp/tabs/whatsappTabSharedProps";
import type {
  WhatsappOptInAuditEntry,
  WhatsappOptInUserState,
} from "@/frontend/common/views/dashboard/settings/whatsapp/types/whatsappSettingsTypes";
import { DesktopExportButton } from "@/frontend/desktop/components/ui/button";
import { DesktopAppDataGrid } from "@/frontend/desktop/components/ui/dataGrid";
import { DesktopAppDateRangePicker } from "@/frontend/desktop/components/ui/form/date";
import type { WhatsappLabels } from "@/shared/locale/types/whatsapp";

function buildHistoryColumns(t: WhatsappLabels): GridColDef<WhatsappOptInAuditEntry>[] {
  return [
    {
      field: "date",
      headerName: t.optInHistoryDate,
      flex: 0.5,
      minWidth: 120,
    },
    {
      field: "action",
      headerName: t.optInHistoryAction,
      flex: 0.4,
      minWidth: 100,
      renderCell: ({ value }) => (
        <StatusBadge
          category="syncStatus"
          status={value === "optIn" ? "success" : "cancelled"}
          label={value === "optIn" ? t.optInActionOptedIn : t.optInActionOptedOut}
        />
      ),
    },
    {
      field: "changedBy",
      headerName: t.optInHistoryChangedBy,
      flex: 1,
      minWidth: 150,
    },
  ];
}

function buildAdminColumns(t: WhatsappLabels): GridColDef<WhatsappOptInUserState>[] {
  return [
    {
      field: "userName",
      headerName: t.optInAdminUserName,
      flex: 1,
      minWidth: 150,
    },
    {
      field: "optedIn",
      headerName: t.optInAdminOptedIn,
      flex: 0.4,
      minWidth: 100,
      renderCell: ({ value }) => (
        <StatusBadge
          category="syncStatus"
          status={value ? "success" : "cancelled"}
          label={value ? t.optInAdminYes : t.optInAdminNo}
        />
      ),
    },
    {
      field: "optedInAt",
      headerName: t.optInAdminOptedInAt,
      flex: 0.5,
      minWidth: 140,
      renderCell: ({ value }) => value ?? "—",
    },
  ];
}

/**
 * Desktop wrapper for OptInTab. Renders the shared toggle section plus a
 * desktop-only history section with a date-range filter picker,
 * DesktopAppDataGrid, and CSV export, plus an admin consolidated opt-in
 * view with search and DesktopAppDataGrid.
 *
 * NOTE: The backend `whatsappOptInAudit` resolver and the all-users opt-in
 *       query do not exist yet. Until they ship, `auditEntries` and
 *       `adminUsers` are placeholder/mock data.
 */
export function OptInTabDesktop(props: Readonly<OptInTabSharedProps>) {
  return (
    <Box>
      <OptInTabContent
        {...props}
        historySection={<DesktopHistorySection {...props} />}
        adminSection={<DesktopAdminSection {...props} />}
      />
    </Box>
  );
}

const CLIENT_PAGINATION: ListPaginationOptions = { mode: "client", pageSize: 10 };

function DesktopHistorySection({
  labels,
  auditEntries,
  dateRange,
  onDateRangeChange,
  onExportCsv,
}: Readonly<OptInTabSharedProps>) {
  const t = labels.page;

  const { filteredEntries, handleExport } = useOptInHistoryExport({
    auditEntries,
    dateRange,
    onExportCsv,
    labels: t,
  });

  const columns = useMemo(() => buildHistoryColumns(t), [t]);

  return (
    <Box>
      <Stack direction="row" sx={{ justifyContent: "flex-end", alignItems: "center", gap: 1, mb: 1 }}>
        <Box sx={{ width: 280 }}>
          <DesktopAppDateRangePicker
            label={t.optInHistoryFilter}
            fromLabel={t.optInHistoryFilterFrom}
            toLabel={t.optInHistoryFilterTo}
            fromDate={dateRange.from ?? ""}
            toDate={dateRange.to ?? ""}
            onChange={(from, to) => {
              onDateRangeChange({ from: from || null, to: to || null });
            }}
            size="small"
          />
        </Box>
        <DesktopExportButton
          startIcon={<DownloadOutlined />}
          onClick={handleExport}
          disabled={filteredEntries.length === 0}
          aria-label={t.optInHistoryExport}
        >
          {t.optInHistoryExport}
        </DesktopExportButton>
      </Stack>

      <DesktopAppDataGrid
        rows={filteredEntries}
        columns={columns}
        getRowId={row => row.id}
        emptyMessage={t.optInHistoryEmpty}
        ariaLabel={t.optInHistoryTitle}
        paginationOptions={CLIENT_PAGINATION}
      />
    </Box>
  );
}

function DesktopAdminSection({ labels, adminUsers }: Readonly<OptInTabSharedProps>) {
  const t = labels.page;
  const { search, setSearch, filteredUsers } = useAdminUserSearch({ adminUsers });

  const columns = useMemo(() => buildAdminColumns(t), [t]);

  return (
    <Box>
      <Box sx={{ mb: 1, maxWidth: 360 }}>
        <SearchBarField value={search} placeholder={t.optInAdminSearchPlaceholder} onChange={setSearch} />
      </Box>
      <DesktopAppDataGrid
        rows={filteredUsers}
        columns={columns}
        getRowId={row => row.id}
        emptyMessage={t.optInAdminEmpty}
        ariaLabel={t.optInAdminTitle}
        paginationOptions={CLIENT_PAGINATION}
      />
    </Box>
  );
}
