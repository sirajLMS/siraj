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
  Stack,
  TextField,
  Tooltip,
} from "@mui/material";
import Link from "next/link";
import { useMemo } from "react";
import { AppDataGrid } from "@/frontend/common/components/ui/dataGrid/AppDataGrid";
import { QuotaKind, QuotaStatus } from "@/frontend/common/graphql/generated/gql/graphql-types";
import type { useQuotaViewModel } from "@/frontend/common/views/dashboard/billing/quota/useQuotaViewModel";
import { buildQuotaColumns } from "@/frontend/common/views/dashboard/billing/quota/utils/buildQuotaColumns";

export function QuotaListDesktop(props: ReturnType<typeof useQuotaViewModel>) {
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

  const columns = useMemo(() => {
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
            <IconButton size="small" color="error" onClick={() => handleDelete(params.row.id)}>
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
            <Select
              value={filterStatus ?? ""}
              label={t.fields.status}
              onChange={e => setFilterStatus((e.target.value as QuotaStatus) || null)}
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value={QuotaStatus.Active}>{t.statuses.ACTIVE}</MenuItem>
              <MenuItem value={QuotaStatus.Expired}>{t.statuses.EXPIRED}</MenuItem>
              <MenuItem value={QuotaStatus.Archived}>{t.statuses.ARCHIVED}</MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel>{t.fields.kind}</InputLabel>
            <Select
              value={filterKind ?? ""}
              label={t.fields.kind}
              onChange={e => setFilterKind((e.target.value as QuotaKind) || null)}
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value={QuotaKind.Package}>{t.kinds.PACKAGE}</MenuItem>
              <MenuItem value={QuotaKind.Periodic}>{t.kinds.PERIODIC}</MenuItem>
            </Select>
          </FormControl>
        </Stack>

        <Stack direction="row" spacing={1.5}>
          <Button variant="outlined" startIcon={<InsightsOutlinedIcon />} component={Link} href="/quotas/insights">
            {t.insights}
          </Button>
          <Button variant="contained" startIcon={<AddOutlinedIcon />} component={Link} href="/quotas/new">
            {t.newQuota}
          </Button>
        </Stack>
      </Stack>

      <Box sx={{ width: "100%", height: 600 }}>
        <AppDataGrid
          rows={quotas}
          columns={columns as unknown as Parameters<typeof AppDataGrid>[0]["columns"]}
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
    </Stack>
  );
}
