"use client";

import { Stack, Typography } from "@mui/material";
import { buildServerPaginationOptions, type ListPaginationOptions } from "@/frontend/common/components/ui";
import type {
  SettingsTimezoneRow,
  SettingsTimezonesLabels,
} from "@/frontend/common/views/dashboard/settings/types/settingsTimezones.types";
import { MobileCardList, MobileCardListItem } from "@/frontend/mobile/components/ui";

export type SettingsTimezonesCardListMobileProps = {
  readonly rows: readonly SettingsTimezoneRow[];
  readonly columnLabels: SettingsTimezonesLabels["columns"];
  readonly emptyMessage: string;
  readonly loading: boolean;
  readonly paginationMode: "client" | "server";
  readonly page: number;
  readonly pageSize: number;
  readonly totalCount: number;
  readonly onPageChange: (page: number) => void;
};

function SettingsTimezonesCard({
  row,
  columnLabels,
}: Readonly<{ readonly row: SettingsTimezoneRow; readonly columnLabels: SettingsTimezonesLabels["columns"] }>) {
  return (
    <MobileCardListItem variant="edge-to-edge">
      <Stack spacing={0.5} sx={{ width: "100%" }}>
        <Stack
          direction="row"
          sx={{ justifyContent: "space-between", alignItems: "baseline", gap: 1, flexWrap: "wrap" }}
        >
          <Typography sx={{ typography: "bodyMd", fontWeight: 700 }}>{row.name}</Typography>
          <Typography sx={theme => ({ typography: "labelMd", color: theme.palette.text.secondary })}>
            {row.offsetLabel}
          </Typography>
        </Stack>
        <Typography sx={theme => ({ typography: "bodyMd", color: theme.palette.text.secondary })}>
          {columnLabels.ianaId}: {row.ianaId}
        </Typography>
        <Typography sx={theme => ({ typography: "bodyMd", color: theme.palette.text.secondary })}>
          {columnLabels.isDstSupported}: {row.isDstSupportedLabel}
        </Typography>
      </Stack>
    </MobileCardListItem>
  );
}

function buildPaginationOptions(
  props: Readonly<
    Pick<SettingsTimezonesCardListMobileProps, "paginationMode" | "page" | "pageSize" | "totalCount" | "onPageChange">
  >
): ListPaginationOptions {
  if (props.paginationMode === "client") {
    return { mode: "client", pageSize: props.pageSize };
  }

  return buildServerPaginationOptions({
    page: props.page,
    pageSize: props.pageSize,
    totalCount: props.totalCount,
    onPageChange: props.onPageChange,
    pageSizeOptions: [props.pageSize],
  });
}

export function SettingsTimezonesCardListMobile({
  rows,
  columnLabels,
  emptyMessage,
  loading,
  paginationMode,
  page,
  pageSize,
  totalCount,
  onPageChange,
}: Readonly<SettingsTimezonesCardListMobileProps>) {
  return (
    <MobileCardList
      rows={rows}
      getKey={row => row.id}
      loading={loading}
      emptyMessage={emptyMessage}
      paginationOptions={buildPaginationOptions({ paginationMode, page, pageSize, totalCount, onPageChange })}
      renderItem={row => <SettingsTimezonesCard row={row} columnLabels={columnLabels} />}
    />
  );
}
