"use client";

import { Stack, Typography } from "@mui/material";
import { buildServerPaginationOptions } from "@/frontend/common/components/ui";
import type {
  SettingsAuditColumnLabels,
  SettingsAuditRow,
} from "@/frontend/common/views/dashboard/settings/types/settingsAudit.types";
import { MobileCardList, MobileCardListItem } from "@/frontend/mobile/components/ui";

export type SettingsAuditCardListMobileProps = {
  readonly rows: readonly SettingsAuditRow[];
  readonly columnLabels: SettingsAuditColumnLabels;
  readonly emptyMessage: string;
  readonly loading: boolean;
  readonly page: number;
  readonly pageSize: number;
  readonly totalCount: number;
  readonly onPageChange: (page: number) => void;
};

function SettingsAuditCardField({ label, value }: Readonly<{ readonly label: string; readonly value: string }>) {
  return (
    <Typography sx={theme => ({ typography: "bodyMd", color: theme.palette.text.secondary })}>
      {label}: {value}
    </Typography>
  );
}

function SettingsAuditCard({
  row,
  columnLabels,
}: Readonly<{ readonly row: SettingsAuditRow; readonly columnLabels: SettingsAuditColumnLabels }>) {
  return (
    <MobileCardListItem variant="edge-to-edge">
      <Stack spacing={0.5} sx={{ width: "100%" }}>
        <Stack
          direction="row"
          sx={{ justifyContent: "space-between", alignItems: "baseline", gap: 1, flexWrap: "wrap" }}
        >
          <Typography sx={{ typography: "bodyMd", fontWeight: 700 }}>{row.entityType}</Typography>
          <Typography sx={theme => ({ typography: "labelMd", color: theme.palette.text.secondary })}>
            {row.createdAt}
          </Typography>
        </Stack>
        <SettingsAuditCardField label={columnLabels.action} value={row.action} />
        <SettingsAuditCardField label={columnLabels.description} value={row.description} />
        <SettingsAuditCardField label={columnLabels.actor} value={row.actorUserId} />
        <SettingsAuditCardField label={columnLabels.entityId} value={row.entityId} />
      </Stack>
    </MobileCardListItem>
  );
}

export function SettingsAuditCardListMobile({
  rows,
  columnLabels,
  emptyMessage,
  loading,
  page,
  pageSize,
  totalCount,
  onPageChange,
}: Readonly<SettingsAuditCardListMobileProps>) {
  return (
    <MobileCardList
      rows={rows}
      getKey={row => row.id}
      loading={loading}
      emptyMessage={emptyMessage}
      paginationOptions={buildServerPaginationOptions({
        page,
        pageSize,
        totalCount,
        onPageChange,
        pageSizeOptions: [pageSize],
      })}
      renderItem={row => <SettingsAuditCard row={row} columnLabels={columnLabels} />}
    />
  );
}
