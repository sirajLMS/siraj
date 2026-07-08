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
import { RequirePermission } from "@/frontend/components/auth/RequirePermission";
import {
  ExportButton,
  FilterButton,
  PageContainer,
  PageHeader,
  PrimaryPageAction,
  SectionPanel,
} from "@/frontend/components/ui";
import { AppPermission, ParentStatus } from "@/frontend/graphql/generated/gql/graphql-types";
import {
  type ParentDirectoryRow,
  toParentAccountStatus,
} from "@/frontend/views/dashboard/admin/parents/home/directory";
import type { MetricItem } from "@/frontend/views/dashboard/types/dashboard";
import type { ParentAccountStatus } from "@/frontend/views/dashboard/types/parent.types";
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

interface ParentSearchFieldProps {
  readonly placeholder: string;
  readonly onSearch: (query: string) => void;
}

function ParentSearchField({ placeholder, onSearch }: Readonly<ParentSearchFieldProps>) {
  return (
    <TextField
      size="small"
      placeholder={placeholder}
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
  );
}

interface ParentMobileSearchFieldProps {
  readonly placeholder: string;
  readonly onSearch: (query: string) => void;
}

function ParentMobileSearchField({ placeholder, onSearch }: Readonly<ParentMobileSearchFieldProps>) {
  return (
    <TextField
      fullWidth
      size="medium"
      placeholder={placeholder}
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
  );
}

interface ParentFilterPanelProps {
  readonly open: boolean;
  readonly statusFilter: ParentStatus | null;
  readonly filterLabel: string;
  readonly clearFiltersLabel: string;
  readonly statusLabels: Record<ParentAccountStatus, string>;
  readonly onStatusFilterChange: (status: ParentStatus | null) => void;
  readonly onResetFilters: () => void;
}

function ParentFilterPanel({
  open,
  statusFilter,
  filterLabel,
  clearFiltersLabel,
  statusLabels,
  onStatusFilterChange,
  onResetFilters,
}: Readonly<ParentFilterPanelProps>) {
  return (
    <Collapse in={open}>
      <Stack direction="row" spacing={1} sx={{ px: 3, pt: 2, pb: 1, flexWrap: "wrap", gap: 1, alignItems: "center" }}>
        <Typography variant="labelMd" sx={theme => ({ color: theme.palette.text.secondary, mr: 1 })}>
          {filterLabel}:
        </Typography>
        {STATUS_FILTER_OPTIONS.map(status => {
          const displayStatus = toParentAccountStatus(status);
          const isActive = statusFilter === status;
          return (
            <Chip
              key={status}
              label={statusLabels[displayStatus]}
              size="small"
              variant={isActive ? "filled" : "outlined"}
              color={isActive ? "primary" : "default"}
              onClick={() => {
                onStatusFilterChange(statusFilter === status ? null : status);
              }}
            />
          );
        })}
        {statusFilter && (
          <FilterButton
            size="small"
            onClick={onResetFilters}
            sx={theme => ({ color: theme.palette.error.main, borderColor: theme.palette.error.main })}
          >
            {clearFiltersLabel}
          </FilterButton>
        )}
      </Stack>
    </Collapse>
  );
}

interface ParentRecordsSectionProps {
  readonly isMobile: boolean;
  readonly rows: readonly ParentDirectoryRow[];
  readonly labels: ParentsViewLabels;
  readonly page?: number;
  readonly pageSize?: number;
  readonly totalCount?: number;
  readonly onOpenSettings: (id: string) => void;
  readonly onPageChange?: (page: number) => void;
  readonly filterLabel: string;
  readonly onFilter: () => void;
  readonly onExport: () => void;
  readonly filterPanelOpen: boolean;
  readonly statusFilter: ParentStatus | null;
  readonly onStatusFilterChange: (status: ParentStatus | null) => void;
  readonly onResetFilters: () => void;
}

function ParentRecordsSection({
  isMobile,
  rows,
  labels,
  page,
  pageSize,
  totalCount,
  onOpenSettings,
  onPageChange,
  filterLabel,
  onFilter,
  onExport,
  filterPanelOpen,
  statusFilter,
  onStatusFilterChange,
  onResetFilters,
}: Readonly<ParentRecordsSectionProps>) {
  return (
    <SectionPanel
      title={labels.records}
      actions={
        <Box sx={{ display: "flex", gap: 1 }}>
          <FilterButton startIcon={<FilterListOutlined />} onClick={onFilter}>
            {filterLabel}
          </FilterButton>
          <ExportButton onClick={onExport} />
        </Box>
      }
    >
      <ParentFilterPanel
        open={filterPanelOpen}
        statusFilter={statusFilter}
        filterLabel={filterLabel}
        clearFiltersLabel={labels.clearFilters}
        statusLabels={labels.statusLabels}
        onStatusFilterChange={onStatusFilterChange}
        onResetFilters={onResetFilters}
      />
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
  );
}

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
            {!isMobile && <ParentSearchField placeholder={labels.searchPlaceholder} onSearch={onSearch} />}
            <RequirePermission permissions={[AppPermission.ParentsCreate]}>
              <PrimaryPageAction onClick={onAddParent}>{labels.addParent}</PrimaryPageAction>
            </RequirePermission>
          </>
        }
      />

      <ParentsMetricGrid metrics={metrics} />

      {isMobile && <ParentMobileSearchField placeholder={labels.searchPlaceholder} onSearch={onSearch} />}

      <ParentRecordsSection
        isMobile={isMobile}
        rows={rows}
        labels={labels}
        page={page}
        pageSize={pageSize}
        totalCount={totalCount}
        onOpenSettings={onOpenSettings}
        onPageChange={onPageChange}
        filterLabel={labels.filterLabel}
        onFilter={onFilter}
        onExport={onExport}
        filterPanelOpen={filterPanelOpen}
        statusFilter={statusFilter}
        onStatusFilterChange={onStatusFilterChange}
        onResetFilters={onResetFilters}
      />
    </PageContainer>
  );
}
