"use client";

import { DownloadOutlined, FilterListOutlined } from "@mui/icons-material";
import { Box, Popover, Stack, TextField } from "@mui/material";
import type { GridColDef } from "@mui/x-data-grid";
import { useMemo, useState } from "react";
import { StatusBadge } from "@/frontend/common/components/ui";
import { AppDataGrid } from "@/frontend/common/components/ui/dataGrid";
import type { ListPaginationOptions } from "@/frontend/common/components/ui/filter/listPaginationOptions";
import {
  formatDateInput,
  parseDateInput,
  useAdminUserSearch,
  useOptInHistoryExport,
} from "@/frontend/common/views/dashboard/settings/whatsapp/tabs/__shared__/optin";
import { OptInTabContent } from "@/frontend/common/views/dashboard/settings/whatsapp/tabs/shared/OptInTabContent";
import type { OptInTabSharedProps } from "@/frontend/common/views/dashboard/settings/whatsapp/tabs/whatsappTabSharedProps";
import type {
  WhatsappOptInAuditEntry,
  WhatsappOptInUserState,
} from "@/frontend/common/views/dashboard/settings/whatsapp/types/whatsappSettingsTypes";
import { DesktopExportButton, DesktopFilterButton } from "@/frontend/desktop/components/ui/button";
import { DesktopAppDatePicker } from "@/frontend/desktop/components/ui/form/date";
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
 * desktop-only history section with filter popover, AppDataGrid, and CSV
 * export (Task 12), and an admin consolidated opt-in view with search and
 * AppDataGrid (Task 13).
 *
 * Task 12 — non-admin opt-in history table.
 * NOTE: Backend `whatsappOptInAuditQuery` resolver does not exist yet (Task 3).
 *       Until it ships, `auditEntries` is placeholder/mock data.
 *
 * Task 13 — admin consolidated opt-in view.
 * NOTE: Backend resolver for all-users opt-in query does not exist yet.
 *       Until it ships, `adminUsers` is placeholder/mock data.
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

  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [draftFrom, setDraftFrom] = useState(parseDateInput(dateRange.from));
  const [draftTo, setDraftTo] = useState(parseDateInput(dateRange.to));

  const open = Boolean(anchorEl);
  const id = open ? "optin-history-filter-popover" : undefined;

  const handleOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
    setDraftFrom(parseDateInput(dateRange.from));
    setDraftTo(parseDateInput(dateRange.to));
  };

  const handleClose = () => setAnchorEl(null);

  const handleApply = () => {
    onDateRangeChange({
      from: draftFrom ? formatDateInput(draftFrom) : null,
      to: draftTo ? formatDateInput(draftTo) : null,
    });
    handleClose();
  };

  const handleClear = () => {
    setDraftFrom(null);
    setDraftTo(null);
    onDateRangeChange({ from: null, to: null });
    handleClose();
  };

  const { filteredEntries, handleExport } = useOptInHistoryExport({
    auditEntries,
    dateRange,
    onExportCsv,
    labels: t,
  });

  const columns = useMemo(() => buildHistoryColumns(t), [t]);

  return (
    <Box>
      <Stack direction="row" sx={{ justifyContent: "flex-end", gap: 1, mb: 1 }}>
        <DesktopFilterButton
          startIcon={<FilterListOutlined />}
          onClick={handleOpen}
          aria-label={t.optInHistoryFilter}
          aria-describedby={id ?? undefined}
        >
          {t.optInHistoryFilter}
        </DesktopFilterButton>
        <DesktopExportButton
          startIcon={<DownloadOutlined />}
          onClick={handleExport}
          disabled={filteredEntries.length === 0}
          aria-label={t.optInHistoryExport}
        >
          {t.optInHistoryExport}
        </DesktopExportButton>
      </Stack>

      <HistoryFilterPopover
        id={id}
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        onApply={handleApply}
        onClear={handleClear}
        draftFrom={draftFrom}
        draftTo={draftTo}
        setDraftFrom={setDraftFrom}
        setDraftTo={setDraftTo}
        labels={t}
      />

      <AppDataGrid
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

interface HistoryFilterPopoverProps {
  readonly id: string | undefined;
  readonly open: boolean;
  readonly anchorEl: HTMLElement | null;
  readonly onClose: () => void;
  readonly onApply: () => void;
  readonly onClear: () => void;
  readonly draftFrom: Date | null;
  readonly draftTo: Date | null;
  readonly setDraftFrom: (date: Date | null) => void;
  readonly setDraftTo: (date: Date | null) => void;
  readonly labels: WhatsappLabels;
}

function HistoryFilterPopover({
  id,
  open,
  anchorEl,
  onClose,
  onApply,
  onClear,
  draftFrom,
  draftTo,
  setDraftFrom,
  setDraftTo,
  labels: t,
}: Readonly<HistoryFilterPopoverProps>) {
  return (
    <Popover
      id={id}
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      transformOrigin={{ vertical: "top", horizontal: "right" }}
      slotProps={{ paper: { sx: { p: 2, width: 280 } } }}
    >
      <Stack spacing={2}>
        <DesktopAppDatePicker
          label={t.optInHistoryFilterFrom}
          value={draftFrom}
          onChange={(date: Date | null) => setDraftFrom(date)}
          slotProps={{
            textField: {
              size: "small",
              fullWidth: true,
              slotProps: { htmlInput: { autoComplete: "off" } },
            },
          }}
        />
        <DesktopAppDatePicker
          label={t.optInHistoryFilterTo}
          value={draftTo}
          onChange={(date: Date | null) => setDraftTo(date)}
          slotProps={{
            textField: {
              size: "small",
              fullWidth: true,
              slotProps: { htmlInput: { autoComplete: "off" } },
            },
          }}
        />
        <Stack direction="row" sx={{ justifyContent: "flex-end", gap: 1 }}>
          <DesktopFilterButton onClick={onClear} size="small">
            {t.optInHistoryFilterClear}
          </DesktopFilterButton>
          <DesktopExportButton onClick={onApply} size="small">
            {t.optInHistoryFilterApply}
          </DesktopExportButton>
        </Stack>
      </Stack>
    </Popover>
  );
}

function DesktopAdminSection({ labels, adminUsers }: Readonly<OptInTabSharedProps>) {
  const t = labels.page;
  const { search, setSearch, filteredUsers } = useAdminUserSearch({ adminUsers });

  const columns = useMemo(() => buildAdminColumns(t), [t]);

  return (
    <Box>
      <TextField
        size="small"
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder={t.optInAdminSearchPlaceholder}
        sx={{ mb: 1, minWidth: 240 }}
        slotProps={{ htmlInput: { autoComplete: "off" } }}
      />
      <AppDataGrid
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
