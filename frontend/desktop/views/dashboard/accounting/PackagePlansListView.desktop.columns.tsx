"use client";

import { EditOutlined } from "@mui/icons-material";
import { Box, IconButton, Stack, Tooltip } from "@mui/material";
import type { GridColDef } from "@mui/x-data-grid";
import Link from "next/link";
import { StatusBadge } from "@/frontend/common/components/ui";
import { formatAccountingMoney, numericCell } from "@/frontend/common/views/dashboard/accounting/accountingFormatters";
import type { PackagePlansLabels } from "@/shared/locale/types/dashboard/accounting/package-plans";

function buildIdentityColumns(t: Readonly<PackagePlansLabels>): GridColDef[] {
  return [
    {
      field: "codename",
      headerName: t.columns.codename,
      width: 170,
      renderCell: params => (
        <Box
          component="span"
          sx={theme => ({ fontFamily: "monospace", fontSize: theme.typography.labelMd.fontSize, fontWeight: 600 })}
        >
          {params.row.codename}
        </Box>
      ),
    },
    {
      field: "displayName",
      headerName: t.columns.displayName,
      flex: 1.2,
      minWidth: 180,
      renderCell: params => (
        <Box sx={{ lineHeight: 1.35, py: 0.5 }}>
          <Box component="div">{params.row.displayName}</Box>
          {params.row.description ? (
            <Box
              component="div"
              sx={theme => ({
                color: theme.palette.text.secondary,
                fontSize: theme.typography.labelUppercase.fontSize,
                maxWidth: 320,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              })}
            >
              {params.row.description}
            </Box>
          ) : null}
        </Box>
      ),
    },
  ];
}

function buildPricingColumns(t: Readonly<PackagePlansLabels>): GridColDef[] {
  return [
    {
      field: "creditHours",
      headerName: t.columns.creditHours,
      width: 130,
      type: "number",
      valueFormatter: (value: unknown) => t.hoursUnit(numericCell(value ?? 0).toFixed(2)),
    },
    {
      field: "priceAmount",
      headerName: t.columns.price,
      width: 150,
      type: "number",
      align: "right",
      headerAlign: "right",
      renderCell: params => (
        <Stack direction="row" spacing={0.5} sx={{ alignItems: "baseline" }}>
          <Box component="span" sx={{ fontWeight: 600 }}>
            {formatAccountingMoney(params.row.priceAmount)}
          </Box>
          <Box
            component="span"
            sx={theme => ({ color: theme.palette.text.secondary, fontSize: theme.typography.caption.fontSize })}
          >
            {params.row.currency ?? ""}
          </Box>
        </Stack>
      ),
    },
    {
      field: "currency",
      headerName: t.columns.currency,
      width: 100,
    },
  ];
}

function buildStateColumns(t: Readonly<PackagePlansLabels>): GridColDef[] {
  return [
    {
      field: "active",
      headerName: t.columns.active,
      width: 110,
      renderCell: params => (
        <StatusBadge
          category="session"
          status={params.row.active ? "active" : "cancelled"}
          label={params.row.active ? t.columns.active : t.archived}
        />
      ),
    },
    {
      field: "sortOrder",
      headerName: t.columns.sortOrder,
      width: 110,
      type: "number",
    },
  ];
}

function buildActionsColumn(t: Readonly<PackagePlansLabels>): GridColDef {
  return {
    field: "actions",
    headerName: t.columns.actions,
    width: 100,
    sortable: false,
    renderCell: params => (
      <Stack direction="row" spacing={0.5}>
        <Tooltip title={t.editTitle}>
          <Link href={`/accounting/packages/${params.row.id}/edit`} style={{ textDecoration: "none" }}>
            <IconButton size="small" aria-label={t.editTitle}>
              <EditOutlined fontSize="small" />
            </IconButton>
          </Link>
        </Tooltip>
      </Stack>
    ),
  };
}

interface PackagePlansColumnArgs {
  readonly t: PackagePlansLabels;
  readonly canManagePackages: boolean;
}

/** Builds the package plans catalog grid columns from labels and manage permission. */
export function buildPackagePlansListColumns({ t, canManagePackages }: Readonly<PackagePlansColumnArgs>): GridColDef[] {
  return [
    ...buildIdentityColumns(t),
    ...buildPricingColumns(t),
    ...buildStateColumns(t),
    ...(canManagePackages ? [buildActionsColumn(t)] : []),
  ];
}
