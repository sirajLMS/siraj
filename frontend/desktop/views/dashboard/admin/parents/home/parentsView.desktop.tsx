"use client";

import { FilterListOutlined, SearchOutlined } from "@mui/icons-material";
import { Box, InputAdornment, TextField } from "@mui/material";
import { ParentsMetricGrid } from "@/frontend/common/views/dashboard/admin/parents/home/ParentsMetricGrid";
import type { BaseParentsViewProps } from "@/frontend/common/views/dashboard/admin/parents/home/ParentsViewTypes";
import { ParentFilterPanel } from "@/frontend/common/views/dashboard/admin/parents/home/parentFilterPanel";
import {
  DesktopExportButton,
  DesktopFilterButton,
  DesktopPageContainer,
  DesktopPageHeader,
  DesktopPrimaryPageAction,
  DesktopSectionPanel,
} from "@/frontend/desktop/components/ui";
import { ParentsDataGridDesktop } from "@/frontend/desktop/views/dashboard/admin/parents/home/components/parentsDataGrid.desktop";

// VARIANT JUSTIFICATION: extra field loading — desktop tier renders a grid-level loading overlay via
// DesktopAppDataGrid's `loading` prop; mobile twin has no equivalent overlay (renders sentinel rows).
export interface ParentsViewDesktopProps extends BaseParentsViewProps {
  readonly loading?: boolean;
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
  // NEW FOR PLAN v5: lifted permission booleans consumed by the tier view
  // instead of `RequirePermission` wrappers (specs.md §3 N3).
  canParentsCreate,
  canParentManageStatus,
}: Readonly<ParentsViewDesktopProps>) {
  return (
    <DesktopPageContainer>
      <DesktopPageHeader
        title={labels.pageTitle}
        subtitle={labels.pageSubtitle}
        actions={
          <>
            <ParentSearchField placeholder={labels.searchPlaceholder} onSearch={onSearch} />
            {canParentsCreate ? (
              <DesktopPrimaryPageAction onClick={onAddParent}>{labels.addParent}</DesktopPrimaryPageAction>
            ) : null}
          </>
        }
      />

      <ParentsMetricGrid metrics={metrics} />

      <DesktopSectionPanel
        title={labels.records}
        actions={
          <Box sx={{ display: "flex", gap: 1 }}>
            <DesktopFilterButton startIcon={<FilterListOutlined />} onClick={onFilter}>
              {labels.filterLabel}
            </DesktopFilterButton>
            <DesktopExportButton onClick={onExport} />
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
          labels={{
            ...labels.table,
            noEntries: labels.noEntries,
            statusLabels: labels.statusLabels,
            accountStatusLabels: labels.accountStatusLabels,
            manageLifecycle: labels.manageLifecycle,
          }}
          onOpenSettings={onOpenSettings}
          page={page}
          pageSize={pageSize}
          totalCount={totalCount}
          onPageChange={onPageChange}
          loading={loading}
          // NEW FOR PLAN v5: lifted permission boolean consumed by the data-grid
          // child instead of an inline `RequirePermission` wrapper.
          canParentManageStatus={canParentManageStatus}
        />
      </DesktopSectionPanel>
    </DesktopPageContainer>
  );
}
