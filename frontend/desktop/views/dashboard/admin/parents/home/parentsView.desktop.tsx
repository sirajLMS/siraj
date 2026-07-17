"use client";

import { FilterListOutlined, SearchOutlined } from "@mui/icons-material";
import { Box, InputAdornment, TextField } from "@mui/material";
import { RequirePermission } from "@/frontend/common/components/auth/RequirePermission";
import {
  ExportButton,
  FilterButton,
  PageContainer,
  PageHeader,
  PrimaryPageAction,
  SectionPanel,
} from "@/frontend/common/components/ui";
import { AppPermission, type ParentStatus } from "@/frontend/common/graphql/generated/gql/graphql-types";
import type { ParentDirectoryRow } from "@/frontend/common/views/dashboard/admin/parents/home/directory";
import { ParentsMetricGrid } from "@/frontend/common/views/dashboard/admin/parents/home/ParentsMetricGrid";
import type { ParentsViewLabels } from "@/frontend/common/views/dashboard/admin/parents/home/ParentsView";
import { ParentFilterPanel } from "@/frontend/common/views/dashboard/admin/parents/home/parentFilterPanel";
import type { MetricItem } from "@/frontend/common/views/dashboard/types/dashboard";
import { ParentsDataGridDesktop } from "@/frontend/desktop/views/dashboard/admin/parents/home/components/parentsDataGrid.desktop";

export interface ParentsViewDesktopProps {
  readonly metrics: readonly MetricItem[];
  readonly rows: readonly ParentDirectoryRow[];
  readonly labels: ParentsViewLabels;
  readonly loading?: boolean;
  readonly page?: number;
  readonly pageSize?: number;
  readonly totalCount?: number;
  readonly lifecycleStatusFilter: ParentStatus | null;
  readonly filterPanelOpen: boolean;
  readonly onAddParent: () => void;
  readonly onOpenSettings: (id: string) => void;
  readonly onSearch: (query: string) => void;
  readonly onPageChange?: (page: number) => void;
  readonly onFilter: () => void;
  readonly onExport: () => void;
  readonly onLifecycleStatusFilterChange: (status: ParentStatus | null) => void;
  readonly onResetFilters: () => void;
}

function ParentSearchField({
  placeholder,
  onSearch,
}: {
  readonly placeholder: string;
  readonly onSearch: (query: string) => void;
}) {
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

export function ParentsViewDesktop({
  metrics,
  rows,
  labels,
  loading,
  page,
  pageSize,
  totalCount,
  lifecycleStatusFilter,
  filterPanelOpen,
  onAddParent,
  onOpenSettings,
  onSearch,
  onPageChange,
  onFilter,
  onExport,
  onLifecycleStatusFilterChange,
  onResetFilters,
}: Readonly<ParentsViewDesktopProps>) {
  return (
    <PageContainer>
      <PageHeader
        title={labels.pageTitle}
        subtitle={labels.pageSubtitle}
        actions={
          <>
            <ParentSearchField placeholder={labels.searchPlaceholder} onSearch={onSearch} />
            <RequirePermission permissions={[AppPermission.ParentsCreate]}>
              <PrimaryPageAction onClick={onAddParent}>{labels.addParent}</PrimaryPageAction>
            </RequirePermission>
          </>
        }
      />

      <ParentsMetricGrid metrics={metrics} />

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
        <ParentFilterPanel
          open={filterPanelOpen}
          lifecycleStatusFilter={lifecycleStatusFilter}
          filterLabel={labels.filterLabel}
          clearFiltersLabel={labels.clearFilters}
          statusLabels={labels.statusLabels}
          onLifecycleStatusFilterChange={onLifecycleStatusFilterChange}
          onResetFilters={onResetFilters}
        />
        <ParentsDataGridDesktop
          rows={rows}
          labels={labels.table}
          onOpenSettings={onOpenSettings}
          page={page}
          pageSize={pageSize}
          totalCount={totalCount}
          onPageChange={onPageChange}
          loading={loading}
        />
      </SectionPanel>
    </PageContainer>
  );
}
