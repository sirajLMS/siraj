"use client";

import { DownloadOutlined } from "@mui/icons-material";
import { Box, Stack, Typography } from "@mui/material";
import { useCallback } from "react";
import type { ListPaginationOptions } from "@/frontend/common/components/ui/filter/listPaginationOptions";
import { SearchBarField } from "@/frontend/common/components/ui/input/searchBarField";
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
import { MobileContentInset, MobileStatusBadge } from "@/frontend/mobile/components/ui";
import { MobileExportButton } from "@/frontend/mobile/components/ui/button";
import { MobileCardListItem } from "@/frontend/mobile/components/ui/card";
import { MobileCardList } from "@/frontend/mobile/components/ui/container";
import { MobileAppDatePicker } from "@/frontend/mobile/components/ui/form/date";
import { MobileEmptyState } from "@/frontend/mobile/components/ui/state";

/**
 * Mobile wrapper for OptInTab. Renders the shared toggle section plus a
 * mobile-only opt-in history section (inline date filter, MobileCardList,
 * CSV export) and an admin consolidated opt-in view with search.
 *
 * NOTE: The backend `whatsappOptInAuditQuery` resolver and the all-users
 *       opt-in query do not exist yet. Until they ship, `auditEntries` and
 *       `adminUsers` are placeholder/mock data.
 */
export function OptInTabMobile(props: Readonly<OptInTabSharedProps>) {
  return (
    <OptInTabContent
      {...props}
      historySection={<MobileHistorySection {...props} />}
      adminSection={<MobileAdminSection {...props} />}
    />
  );
}

function MobileHistorySection({
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

  const renderItem = useCallback(
    (entry: WhatsappOptInAuditEntry) => (
      <MobileCardListItem
        variant="rounded"
        accentBorder={
          entry.action === "optIn"
            ? { color: "primary", side: "inline-start" }
            : { color: "warning", side: "inline-start" }
        }
      >
        <Stack spacing={0.5} sx={{ py: 1 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Typography variant="labelMd">{entry.date}</Typography>
            <MobileStatusBadge
              category="syncStatus"
              status={entry.action === "optIn" ? "success" : "cancelled"}
              label={entry.action === "optIn" ? t.optInActionOptedIn : t.optInActionOptedOut}
            />
          </Box>
          <Typography variant="bodyMd" sx={{ color: theme => theme.palette.text.secondary }}>
            {t.optInHistoryChangedBy}: {entry.changedBy}
          </Typography>
        </Stack>
      </MobileCardListItem>
    ),
    [t]
  );

  const paginationOptions: ListPaginationOptions = { mode: "client", pageSize: 10 };

  return (
    <Stack spacing={2}>
      {/* Inline date filter */}
      <MobileContentInset>
        <Stack direction="row" spacing={1} sx={{ width: "100%" }}>
          <MobileAppDatePicker
            label={t.optInHistoryFilterFrom}
            value={parseDateInput(dateRange.from)}
            onChange={(date: Date | null) => onDateRangeChange({ ...dateRange, from: formatDateInput(date) })}
            sx={{ flex: 1 }}
          />
          <MobileAppDatePicker
            label={t.optInHistoryFilterTo}
            value={parseDateInput(dateRange.to)}
            onChange={(date: Date | null) => onDateRangeChange({ ...dateRange, to: formatDateInput(date) })}
            sx={{ flex: 1 }}
          />
        </Stack>
      </MobileContentInset>

      {/* Export button */}
      <MobileContentInset>
        <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
          <MobileExportButton
            startIcon={<DownloadOutlined />}
            onClick={handleExport}
            disabled={filteredEntries.length === 0}
            aria-label={t.optInHistoryExport}
          >
            {t.optInHistoryExport}
          </MobileExportButton>
        </Box>
      </MobileContentInset>

      {/* History list */}
      {filteredEntries.length === 0 ? (
        <MobileEmptyState title={t.optInHistoryEmpty} />
      ) : (
        <MobileCardList
          rows={filteredEntries}
          renderItem={renderItem}
          getKey={entry => entry.id}
          paginationOptions={paginationOptions}
          gap={1.5}
          layout="rounded"
        />
      )}
    </Stack>
  );
}

function MobileAdminSection({ labels, adminUsers }: Readonly<OptInTabSharedProps>) {
  const t = labels.page;
  const { search, setSearch, filteredUsers } = useAdminUserSearch({ adminUsers });

  const renderItem = useCallback(
    (user: WhatsappOptInUserState) => (
      <MobileCardListItem
        variant="rounded"
        accentBorder={user.optedIn ? { color: "primary", side: "inline-start" } : undefined}
      >
        <Stack spacing={0.5} sx={{ py: 1 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Typography variant="labelMd">{user.userName}</Typography>
            <MobileStatusBadge
              category="syncStatus"
              status={user.optedIn ? "success" : "cancelled"}
              label={user.optedIn ? t.optInAdminYes : t.optInAdminNo}
            />
          </Box>
          {user.optedInAt && (
            <Typography variant="bodyMd" sx={{ color: theme => theme.palette.text.secondary }}>
              {t.optInAdminOptedInAt}: {user.optedInAt}
            </Typography>
          )}
        </Stack>
      </MobileCardListItem>
    ),
    [t]
  );

  const paginationOptions: ListPaginationOptions = { mode: "client", pageSize: 10 };

  return (
    <Stack spacing={2}>
      {/* Search input */}
      <MobileContentInset>
        <SearchBarField value={search} onChange={setSearch} placeholder={t.optInAdminSearchPlaceholder} />
      </MobileContentInset>

      {/* User list */}
      {filteredUsers.length === 0 ? (
        <MobileEmptyState title={t.optInAdminEmpty} />
      ) : (
        <MobileCardList
          rows={filteredUsers}
          renderItem={renderItem}
          getKey={user => user.id}
          paginationOptions={paginationOptions}
          gap={1.5}
          layout="rounded"
        />
      )}
    </Stack>
  );
}
