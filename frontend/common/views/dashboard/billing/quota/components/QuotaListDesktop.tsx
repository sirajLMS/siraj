"use client";

import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import InsightsOutlinedIcon from "@mui/icons-material/InsightsOutlined";
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import {
  Box,
  Button,
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
import { QuotaKind, QuotaStatus } from "@/frontend/common/graphql/generated/gql/graphql-types";
import type { QuotaItem } from "@/frontend/common/views/dashboard/billing/quota/types/quota.types";
import type { useQuotaViewModel } from "@/frontend/common/views/dashboard/billing/quota/useQuotaViewModel";
import { buildQuotaColumns } from "@/frontend/common/views/dashboard/billing/quota/utils/buildQuotaColumns";

type QuotaViewModelReturn = ReturnType<typeof useQuotaViewModel>;

interface FilterControlsProps {
  readonly t: QuotaViewModelReturn["t"];
  readonly searchQuery: string;
  readonly filterStatus: QuotaStatus | null;
  readonly filterKind: QuotaKind | null;
  readonly setSearchQuery: (query: string) => void;
  readonly setFilterStatus: (status: QuotaStatus | null) => void;
  readonly setFilterKind: (kind: QuotaKind | null) => void;
}

function FilterControls(props: Readonly<FilterControlsProps>) {
  const { t, searchQuery, filterStatus, filterKind, setSearchQuery, setFilterStatus, setFilterKind } = props;

  return (
    <Stack direction="row" spacing={2} sx={{ flex: 1 }}>
      <TextField
        size="small"
        placeholder={t.listTitle}
        value={searchQuery}
        onChange={e => setSearchQuery(e.target.value)}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchOutlinedIcon fontSize="small" />
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

interface ActionButtonsProps {
  readonly t: QuotaViewModelReturn["t"];
}

function ActionButtons(props: ActionButtonsProps) {
  const { t } = props;

  return (
    <Stack direction="row" spacing={1.5}>
      <Button variant="outlined" startIcon={<InsightsOutlinedIcon />} component={Link} href="/quotas/insights">
        {t.insights}
      </Button>
      <Button variant="contained" startIcon={<AddOutlinedIcon />} component={Link} href="/quotas/new">
        {t.newQuota}
      </Button>
    </Stack>
  );
}

interface QuotaGridProps {
  readonly quotas: readonly QuotaItem[];
  readonly columns: GridColDef<QuotaItem>[];
  readonly loading: boolean;
  readonly page: number;
  readonly pageSize: number;
  readonly totalCount: number;
  readonly setPage: (page: number) => void;
  readonly setPageSize: (pageSize: number) => void;
}

function QuotaGrid(props: Readonly<QuotaGridProps>) {
  const { quotas, columns, loading, page, pageSize, totalCount, setPage, setPageSize } = props;

  return (
    <Box sx={{ width: "100%", height: 600 }}>
      <AppDataGrid<QuotaItem>
        rows={quotas}
        columns={columns}
        loading={loading}
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

export function QuotaListDesktop(props: Readonly<QuotaViewModelReturn>) {
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
            <IconButton size="small" component={Link} href={`/quotas/${params.row.id}`}>
              <VisibilityOutlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title={t.actions.edit}>
            <IconButton size="small" component={Link} href={`/quotas/${params.row.id}/edit`}>
              <EditOutlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title={t.actions.delete}>
            <IconButton size="small" color="error" onClick={() => handleDelete(params.row.id ?? "")}>
              <DeleteOutlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      ),
    });
    return baseCols;
  }, [t, handleDelete]);

  return (
    <Stack spacing={3}>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={2}
        sx={{ justifyContent: "space-between", alignItems: { sm: "center" } }}
      >
        <FilterControls
          t={t}
          searchQuery={searchQuery}
          filterStatus={filterStatus}
          filterKind={filterKind}
          setSearchQuery={setSearchQuery}
          setFilterStatus={setFilterStatus}
          setFilterKind={setFilterKind}
        />
        <ActionButtons t={t} />
      </Stack>

      <QuotaGrid
        quotas={quotas}
        columns={columns}
        loading={loading}
        page={page}
        pageSize={pageSize}
        totalCount={totalCount}
        setPage={setPage}
        setPageSize={setPageSize}
      />
    </Stack>
  );
}
