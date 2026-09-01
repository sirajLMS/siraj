"use client";

import { Typography } from "@mui/material";
import type { GridColDef } from "@mui/x-data-grid";
import { DesktopPersonProfileLinkCell } from "@/frontend/desktop/components/ui";

/**
 * Shared column builders for directory DataGrids.
 * Both parent and student directory grids share identical index, name, and email column patterns.
 */

export function buildDirectoryIndexColumn<R extends { index: number | string }>(
  label: string,
  format?: (index: number | string) => string
): GridColDef<R> {
  return {
    field: "index",
    headerName: label,
    width: 72,
    sortable: false,
    renderCell: ({ row }) => (
      <Typography variant="labelMd" sx={theme => ({ color: theme.palette.text.secondary })}>
        {format ? format(row.index) : row.index}
      </Typography>
    ),
  };
}

export function buildDirectoryNameColumn<R extends { name: string | null; avatarUrl?: string | null }>(
  label: string,
  hrefBuilder: (row: R) => string | undefined,
  flex = 1.2,
  minWidth = 200
): GridColDef<R> {
  return {
    field: "name",
    headerName: label,
    flex,
    minWidth,
    renderCell: ({ row }) => (
      <DesktopPersonProfileLinkCell
        href={hrefBuilder(row)}
        name={row.name ?? ""}
        avatarUrl={row.avatarUrl}
        avatarSize={40}
        typographyVariant="bodyLg"
        fontWeight={600}
      />
    ),
  };
}

export function buildDirectoryEmailColumn<R extends { email: string | null }>(
  label: string,
  flex = 1.2,
  minWidth = 180
): GridColDef<R> {
  return {
    field: "email",
    headerName: label,
    flex,
    minWidth,
    renderCell: ({ row }) => (
      <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.text.secondary })}>
        {row.email}
      </Typography>
    ),
  };
}
