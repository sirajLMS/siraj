"use client";

import { AddOutlined } from "@mui/icons-material";
import { Box } from "@mui/material";
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
      <DesktopSectionPanel
        title={title}
        subTitle={subtitle}
        contentPadding={false}
        actions={
          canManage ? (
            <DesktopPrimaryPageAction onClick={onAdd} startIcon={<AddOutlined />}>
              {addLabel}
            </DesktopPrimaryPageAction>
          ) : null
        }
      >
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
