"use client";

import {
  CheckCircleOutlined,
  ConfirmationNumberOutlined,
  DeleteOutlined,
  EditOutlined,
  ScheduleOutlined,
  SearchOutlined,
  VisibilityOutlined,
} from "@mui/icons-material";
import {
  Box,
  Fade,
  FormControl,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  type SelectChangeEvent,
  Stack,
  TextField,
  Tooltip,
} from "@mui/material";
import type { GridColDef } from "@mui/x-data-grid";
import Link from "next/link";
import { useMemo } from "react";
import { AppDataGrid } from "@/frontend/common/components/ui/dataGrid/AppDataGrid";
import { ErrorState } from "@/frontend/common/components/ui/state/ErrorState";
import { QuotaKind, QuotaStatus } from "@/frontend/common/graphql/generated/gql/graphql-types";
import type { MetricItem } from "@/frontend/common/types/shared.types";
import type { QuotaItem } from "@/frontend/common/views/dashboard/billing/quota/types/quota.types";
import type { QuotaListViewModel } from "@/frontend/common/views/dashboard/billing/quota/useQuotaViewModel";
import { buildQuotaColumns } from "@/frontend/common/views/dashboard/billing/quota/utils/buildQuotaColumns";
import { DesktopMetricCardGrid } from "@/frontend/desktop/components/ui/card/MetricCardGrid";
import { DesktopSectionPanel } from "@/frontend/desktop/components/ui/container/DesktopSectionPanel";
import { DesktopPageContainer, DesktopPageHeader } from "@/frontend/desktop/components/ui/container/page";
import { QuotaListDesktopActions } from "@/frontend/desktop/views/dashboard/billing/quota/components/QuotaListDesktopActions";
import type { QuotaLabels } from "@/shared/locale/types/dashboard/billing/quota";

interface FilterControlsProps {
  readonly t: QuotaLabels;
  readonly searchQuery: string;
  readonly filterStatus: QuotaStatus | null;
  readonly filterKind: QuotaKind | null;
  readonly setSearchQuery: (query: string) => void;
  readonly setFilterStatus: (status: QuotaStatus | null) => void;
  readonly setFilterKind: (kind: QuotaKind | null) => void;
}

function FilterControls({
  t,
  searchQuery,
  filterStatus,
  filterKind,
  setSearchQuery,
  setFilterStatus,
  setFilterKind,
}: Readonly<FilterControlsProps>) {
  return (
    <Stack direction="row" spacing={2} sx={{ flex: 1, flexWrap: "wrap" }}>
      <TextField
        size="small"
        placeholder={t.listTitle}
        value={searchQuery}
        onChange={e => setSearchQuery(e.target.value)}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchOutlined fontSize="small" />
              </InputAdornment>
            ),
          },
        }}
        sx={{ maxWidth: 300 }}
      />

      <FormControl size="small" sx={{ minWidth: 140 }}>
        <InputLabel>{t.fields.status}</InputLabel>
        <Select<QuotaStatus | "">
          value={filterStatus ?? ""}
          label={t.fields.status}
          onChange={(e: SelectChangeEvent<QuotaStatus | "">) => {
            const val = e.target.value;
            setFilterStatus(val === "" ? null : val);
          }}
        >
          <MenuItem value="">{t.fields.all}</MenuItem>
          <MenuItem value={QuotaStatus.Active}>{t.statuses.ACTIVE}</MenuItem>
          <MenuItem value={QuotaStatus.Expired}>{t.statuses.EXPIRED}</MenuItem>
          <MenuItem value={QuotaStatus.Archived}>{t.statuses.ARCHIVED}</MenuItem>
        </Select>
      </FormControl>

      <FormControl size="small" sx={{ minWidth: 140 }}>
        <InputLabel>{t.fields.kind}</InputLabel>
        <Select<QuotaKind | "">
          value={filterKind ?? ""}
          label={t.fields.kind}
          onChange={(e: SelectChangeEvent<QuotaKind | "">) => {
            const val = e.target.value;
            setFilterKind(val === "" ? null : val);
          }}
        >
          <MenuItem value="">{t.fields.all}</MenuItem>
          <MenuItem value={QuotaKind.Package}>{t.kinds.PACKAGE}</MenuItem>
          <MenuItem value={QuotaKind.Periodic}>{t.kinds.PERIODIC}</MenuItem>
        </Select>
      </FormControl>
    </Stack>
  );
}

interface QuotaDesktopGridProps {
  readonly quotas: readonly QuotaItem[];
  readonly columns: GridColDef<QuotaItem>[];
  readonly loading: boolean;
  readonly page: number;
  readonly pageSize: number;
  readonly totalCount: number;
  readonly setPage: (page: number) => void;
  readonly setPageSize: (pageSize: number) => void;
  readonly t: QuotaLabels;
}

function QuotaDesktopGrid({
  quotas,
  columns,
  loading,
  page,
  pageSize,
  totalCount,
  setPage,
  setPageSize,
  t,
}: Readonly<QuotaDesktopGridProps>) {
  return (
    <Box sx={{ width: "100%", height: 600 }}>
      <AppDataGrid<QuotaItem>
        rows={quotas}
        columns={columns}
        loading={loading}
        ariaLabel={t.listTitle}
        emptyMessage={t.noQuotas}
        paginationOptions={{
          mode: "server",
          page: page + 1,
          pageSize,
          totalCount,
          onPageChange: (newPage: number) => setPage(newPage - 1),
          onPageSizeChange: (newPageSize: number) => setPageSize(newPageSize),
        }}
      />
    </Box>
  );
}

function buildMetrics(t: QuotaLabels, totalCount: number, quotas: readonly QuotaItem[]): MetricItem[] {
  const activeCount = quotas.filter(q => q.status === QuotaStatus.Active).length;
  const expiredCount = quotas.filter(q => q.status === QuotaStatus.Expired).length;
  return [
    {
      key: "total-quotas",
      count: totalCount,
      label: t.listTitle,
      labelKey: "billing.quota.totalQuotas",
      icon: ConfirmationNumberOutlined,
    },
    {
      key: "active-quotas",
      count: activeCount,
      label: t.statuses.ACTIVE,
      labelKey: "billing.quota.activeQuotas",
      icon: CheckCircleOutlined,
    },
    {
      key: "expired-quotas",
      count: expiredCount,
      label: t.statuses.EXPIRED,
      labelKey: "billing.quota.expiredQuotas",
      icon: ScheduleOutlined,
    },
  ];
}

export function QuotaListDesktop(props: Readonly<QuotaListViewModel>) {
  const {
    t,
    quotas,
    totalCount,
    loading,
    page,
    pageSize,
    setPage,
    setPageSize,
    filterStatus,
    filterKind,
    searchQuery,
    setFilterStatus,
    setFilterKind,
    setSearchQuery,
    handleDelete,
  } = props;

  const columns = useMemo<GridColDef<QuotaItem>[]>(() => {
    const baseCols = buildQuotaColumns(t);
    baseCols.push({
      field: "actions",
      headerName: "",
      width: 130,
      sortable: false,
      renderCell: params => (
        <Stack direction="row" spacing={0.5}>
          <Tooltip title={t.actions.viewLedger}>
            <IconButton size="small" aria-label={t.actions.view} component={Link} href={`/quotas/${params.row.id}`}>
              <VisibilityOutlined fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title={t.actions.edit}>
            <IconButton
              size="small"
              aria-label={t.actions.edit}
              component={Link}
              href={`/quotas/${params.row.id}/edit`}
            >
              <EditOutlined fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title={t.actions.delete}>
            <IconButton
              size="small"
              aria-label={t.actions.delete}
              color="error"
              onClick={() => handleDelete(params.row.id ?? "")}
            >
              <DeleteOutlined fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      ),
    });
    return baseCols;
  }, [t, handleDelete]);

  const metrics = useMemo(() => buildMetrics(t, totalCount, quotas), [t, totalCount, quotas]);

  const hasError =
    !loading &&
    quotas.length === 0 &&
    totalCount === 0 &&
    (searchQuery.trim() !== "" || filterStatus !== null || filterKind !== null);

  return (
    <Fade in timeout={300}>
      <div>
        <DesktopPageContainer>
          <DesktopPageHeader
            title={t.title}
            breadcrumbs={[{ label: t.title, current: true }]}
            actions={<QuotaListDesktopActions t={t} />}
          />

          <DesktopMetricCardGrid metrics={metrics} size={{ md: 4, lg: 4 }} />

          <DesktopSectionPanel
            contentPadding={false}
            title={t.listTitle}
            actions={
              <FilterControls
                t={t}
                searchQuery={searchQuery}
                filterStatus={filterStatus}
                filterKind={filterKind}
                setSearchQuery={setSearchQuery}
                setFilterStatus={setFilterStatus}
                setFilterKind={setFilterKind}
              />
            }
          >
            {hasError ? (
              <ErrorState message={t.emptyListMessage} embedded />
            ) : (
              <QuotaDesktopGrid
                quotas={quotas}
                columns={columns}
                loading={loading}
                page={page}
                pageSize={pageSize}
                totalCount={totalCount}
                setPage={setPage}
                setPageSize={setPageSize}
                t={t}
              />
            )}
          </DesktopSectionPanel>
        </DesktopPageContainer>
      </div>
    </Fade>
  );
}
