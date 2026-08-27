"use client";

import {
  ArchiveOutlined,
  CheckCircleOutlined,
  EditOutlined,
  InventoryOutlined,
  StarOutlined,
  TrendingUpOutlined,
} from "@mui/icons-material";
import { Box, Chip, IconButton, Stack, Tooltip } from "@mui/material";
import type { GridColDef } from "@mui/x-data-grid";
import Link from "next/link";
import { useMemo } from "react";
import { AppDataGrid } from "@/frontend/common/components/ui/dataGrid/AppDataGrid";
import type { MetricItem } from "@/frontend/common/types/shared.types";
import {
  formatAccountingMoney,
  numericCell,
  planActiveTone,
} from "@/frontend/common/views/dashboard/accounting/accountingFormatters";
import { DesktopListStateGate } from "@/frontend/common/views/dashboard/accounting/components/DesktopListStateGate";
import type { PackagePlansListViewModel } from "@/frontend/common/views/dashboard/accounting/usePackagePlansListViewModel";
import { DesktopPrimaryPageAction } from "@/frontend/desktop/components/ui/button";
import { DesktopMetricCardGrid } from "@/frontend/desktop/components/ui/card/MetricCardGrid";
import { DesktopSectionPanel } from "@/frontend/desktop/components/ui/container/DesktopSectionPanel";
import { DesktopPageContainer, DesktopPageHeader } from "@/frontend/desktop/components/ui/container/page";

export function PackagePlansListDesktop(props: Readonly<PackagePlansListViewModel>) {
  const { t, rows, loading, error, activeCount, archivedCount } = props;

  const priceLeader = useMemo(() => {
    const active = rows.filter(row => row.active);
    if (active.length === 0) return null;
    return active.reduce((top, row) => (Number(row.priceAmount) > Number(top.priceAmount) ? row : top), active[0]);
  }, [rows]);

  const columns = useMemo<GridColDef[]>(() => {
    const cols: GridColDef[] = [
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
          <Box>
            <Box component="div">{params.row.displayName}</Box>
            {params.row.description ? (
              <Box
                component="div"
                sx={theme => ({
                  color: theme.palette.text.secondary,
                  fontSize: 11,
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
            <Box component="span" sx={theme => ({ color: theme.palette.text.secondary, fontSize: 12 })}>
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
      {
        field: "active",
        headerName: t.columns.active,
        width: 110,
        renderCell: params => (
          <Chip
            size="small"
            color={planActiveTone(Boolean(params.row.active))}
            variant={params.row.active ? "filled" : "outlined"}
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
      {
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
      },
    ];
    return cols;
  }, [t]);

  const metricItems = useMemo<MetricItem[]>(
    () => [
      {
        key: "plans-total",
        count: rows.length,
        label: t.pageTitle,
        labelKey: "dashboard.accounting.package-plans.pageTitle",
        icon: InventoryOutlined,
      },
      {
        key: "plans-active",
        count: activeCount,
        label: t.columns.active,
        labelKey: "dashboard.accounting.package-plans.columns.active",
        icon: CheckCircleOutlined,
      },
      {
        key: "plans-archived",
        count: archivedCount,
        label: t.archived,
        labelKey: "dashboard.accounting.package-plans.archived",
        icon: ArchiveOutlined,
      },
      {
        key: "plans-price-leader",
        count: priceLeader ? `${formatAccountingMoney(priceLeader.priceAmount)} ${priceLeader.currency ?? ""}` : "—",
        label: priceLeader?.displayName ?? t.columns.price,
        labelKey: "dashboard.accounting.package-plans.columns.price",
        icon: TrendingUpOutlined,
        variant: "highlight",
      },
    ],
    [t, rows, activeCount, archivedCount, priceLeader]
  );

  return (
    <DesktopPageContainer>
      <DesktopPageHeader
        title={t.pageTitle}
        subtitle={t.pageSubtitle}
        actions={
          <Link href="/accounting/packages/new" style={{ textDecoration: "none" }}>
            <DesktopPrimaryPageAction startIcon={<StarOutlined />}>{t.createPlan}</DesktopPrimaryPageAction>
          </Link>
        }
      />

      <DesktopMetricCardGrid metrics={metricItems} size={{ md: 3, lg: 3 }} />

      <DesktopSectionPanel contentPadding={false} title={t.pageTitle} sx={{ mt: 3 }}>
        <DesktopListStateGate
          error={Boolean(error)}
          loading={loading}
          hasRows={rows.length > 0}
          errorMessage={t.loadError}
        >
          <Box sx={{ width: "100%", height: 540, p: 2 }}>
            <AppDataGrid
              rows={rows}
              columns={columns}
              loading={loading}
              ariaLabel={t.pageTitle}
              emptyMessage={t.empty}
              autoHeight
              disableColumnMenu
              paginationOptions={{ mode: "client" }}
            />
          </Box>
        </DesktopListStateGate>
      </DesktopSectionPanel>
    </DesktopPageContainer>
  );
}
