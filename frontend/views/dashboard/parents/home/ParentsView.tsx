"use client";

import { FilterListOutlined, SearchOutlined } from "@mui/icons-material";
import {
  Box,
  Chip,
  Collapse,
  InputAdornment,
  Stack,
  TextField,
  type Theme,
  Typography,
  useMediaQuery,
} from "@mui/material";
import {
  ExportButton,
  FilterButton,
  PageContainer,
  PageHeader,
  PrimaryPageAction,
  SectionPanel,
} from "@/frontend/components/ui";
import { ParentStatus } from "@/frontend/graphql/generated/gql/graphql-types";
import {
  type ParentAccountStatus,
  type ParentDirectoryRow,
  toParentAccountStatus,
} from "@/frontend/views/dashboard/parents/types/directory";
import type { MetricItem } from "@/frontend/views/dashboard/types/dashboard";
import { ParentCardList, type ParentCardListLabels } from "./ParentCardList";
import { ParentsDataGrid, type ParentsDataGridLabels } from "./ParentsDataGrid";
import { ParentsMetricGrid } from "./ParentsMetricGrid";

interface ParentsViewLabels {
  readonly pageTitle: string;
  readonly pageSubtitle: string;
  readonly searchPlaceholder: string;
  readonly addParent: string;
  readonly records: string;
  readonly filterLabel: string;
  readonly clearFilters: string;
  readonly table: ParentsDataGridLabels;
  readonly card: ParentCardListLabels;
  readonly statusLabels: Record<ParentAccountStatus, string>;
}

interface ParentsViewProps {
  readonly metrics: readonly MetricItem[];
  readonly rows: readonly ParentDirectoryRow[];
  readonly labels: ParentsViewLabels;
  readonly page?: number;
  readonly pageSize?: number;
  readonly totalCount?: number;
  readonly statusFilter: ParentStatus | null;
  readonly filterPanelOpen: boolean;
  readonly onAddParent: () => void;
  readonly onOpenSettings: (id: string) => void;
  readonly onSearch: (query: string) => void;
  readonly onPageChange?: (page: number) => void;
  readonly onFilter: () => void;
  readonly onExport: () => void;
  readonly onStatusFilterChange: (status: ParentStatus | null) => void;
  readonly onResetFilters: () => void;
}

const STATUS_FILTER_OPTIONS: readonly ParentStatus[] = [
  ParentStatus.Activated,
  ParentStatus.Deactivated,
  ParentStatus.Regular,
  ParentStatus.OnLeave,
  ParentStatus.Suspended,
  ParentStatus.OnTrial,
];

export function ParentsView({
  metrics,
  rows,
  labels,
  page,
  pageSize,
  totalCount,
  statusFilter,
  filterPanelOpen,
  onAddParent,
  onOpenSettings,
  onSearch,
  onPageChange,
  onFilter,
  onExport,
  onStatusFilterChange,
  onResetFilters,
}: Readonly<ParentsViewProps>) {
  const isMobile = useMediaQuery((theme: Theme) => theme.breakpoints.down("md"));

  return (
    <PageContainer>
      <PageHeader
        title={labels.pageTitle}
        subtitle={labels.pageSubtitle}
        actions={
          <>
            {!isMobile && (
              <TextField
                size="small"
                placeholder={labels.searchPlaceholder}
                onChange={e => {
                  onSearch(e.target.value);
                }}
                sx={{
                  width: 300,
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 10,
                    backgroundColor: theme => theme.palette.background.paper,
                  },
                }}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchOutlined fontSize="small" />
                      </InputAdornment>
                    ),
                  },
                }}
              />
            )}
            <PrimaryPageAction onClick={onAddParent}>{labels.addParent}</PrimaryPageAction>
          </>
        }
      />

      <ParentsMetricGrid metrics={metrics} />

      {isMobile && (
        <TextField
          fullWidth
          size="medium"
          placeholder={labels.searchPlaceholder}
          onChange={e => {
            onSearch(e.target.value);
          }}
          sx={{
            mb: 3,
            "& .MuiOutlinedInput-root": {
              borderRadius: 3,
              backgroundColor: theme => theme.palette.background.paper,
            },
          }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchOutlined />
                </InputAdornment>
              ),
            },
          }}
        />
      )}

      <SectionPanel
        title={labels.records}
        actions={
          <Box sx={{ display: "flex", gap: 1 }}>
            <FilterButton startIcon={<FilterListOutlined />} onClick={onFilter}>
              {labels.filterLabel}
            </FilterButton>
            <ExportButton onClick={onExport} />
          </Box>
        }
      >
        <Collapse in={filterPanelOpen}>
          <Stack
            direction="row"
            spacing={1}
            sx={{ px: 3, pt: 2, pb: 1, flexWrap: "wrap", gap: 1, alignItems: "center" }}
          >
            <Typography variant="labelMd" sx={theme => ({ color: theme.palette.text.secondary, mr: 1 })}>
              {labels.filterLabel}:
            </Typography>
            {STATUS_FILTER_OPTIONS.map(status => {
              const displayStatus = toParentAccountStatus(status);
              return (
                <Chip
                  key={status}
                  label={labels.statusLabels[displayStatus]}
                  size="small"
                  variant={statusFilter === status ? "filled" : "outlined"}
                  onClick={() => {
                    onStatusFilterChange(statusFilter === status ? null : status);
                  }}
                  sx={theme => ({
                    ...(statusFilter === status && {
                      backgroundColor: theme.palette.primary.main,
                      color: theme.palette.onPrimary,
                    }),
                  })}
                />
              );
            })}
            {statusFilter && (
              <Chip
                label={labels.clearFilters}
                size="small"
                variant="outlined"
                onDelete={onResetFilters}
                onClick={onResetFilters}
                sx={theme => ({ borderColor: theme.palette.error.main, color: theme.palette.error.main })}
              />
            )}
          </Stack>
        </Collapse>

        {isMobile ? (
          <ParentCardList
            rows={rows}
            labels={labels.card}
            onOpenSettings={onOpenSettings}
            page={page}
            pageSize={pageSize}
            totalCount={totalCount}
            onPageChange={onPageChange}
          />
        ) : (
          <ParentsDataGrid
            rows={rows}
            labels={labels.table}
            onOpenSettings={onOpenSettings}
            page={page}
            pageSize={pageSize}
            totalCount={totalCount}
            onPageChange={onPageChange}
          />
        )}
      </SectionPanel>
    </PageContainer>
  );
}
