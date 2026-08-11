"use client";

import { AddOutlined } from "@mui/icons-material";
import { Box, Typography } from "@mui/material";
import type { GridColDef } from "@mui/x-data-grid";
import type { ReactNode } from "react";
import { DesktopPrimaryPageAction } from "@/frontend/desktop/components/ui/button/DesktopActionButtons";
import { DesktopSectionPanel } from "@/frontend/desktop/components/ui/container/DesktopSectionPanel";
import { DesktopAppDataGrid } from "@/frontend/desktop/components/ui/dataGrid/DesktopAppDataGrid";

export interface SettingsTabGridSharedProps<R extends { readonly id: string }> {
  readonly rows: readonly R[];
  readonly loading: boolean;
  readonly canManage: boolean;
  readonly title: string;
  readonly subtitle: string;
  readonly addLabel: string;
  readonly emptyMessage: string;
  readonly onAdd: () => void;
  readonly columns: GridColDef[];
  /** Dialogs rendered when canManage is true. Caller provides form + delete dialogs. */
  readonly dialogs: ReactNode;
}

const ROOT_SX = { display: "flex", flexDirection: "column", gap: 3 } as const;
const HEADER_SX = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 2,
} as const;

export function SettingsTabGridShared<R extends { readonly id: string }>({
  rows,
  loading,
  canManage,
  title,
  subtitle,
  addLabel,
  emptyMessage,
  onAdd,
  columns,
  dialogs,
}: Readonly<SettingsTabGridSharedProps<R>>) {
  return (
    <Box sx={ROOT_SX}>
      <Box sx={HEADER_SX}>
        <Box>
          <Typography sx={{ typography: "titleLg", mb: 1 }}>{title}</Typography>
          <Typography sx={{ typography: "bodyMd", color: theme => theme.palette.text.secondary }}>
            {subtitle}
          </Typography>
        </Box>
        {canManage ? (
          <DesktopPrimaryPageAction onClick={onAdd} startIcon={<AddOutlined />}>
            {addLabel}
          </DesktopPrimaryPageAction>
        ) : null}
      </Box>
      <DesktopSectionPanel contentPadding={false}>
        <DesktopAppDataGrid
          rows={rows}
          columns={columns}
          loading={loading}
          emptyMessage={emptyMessage}
          getRowId={row => row.id}
          autoHeight
          paginationOptions={{ mode: "client" }}
        />
      </DesktopSectionPanel>
      {canManage ? dialogs : null}
    </Box>
  );
}
