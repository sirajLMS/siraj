"use client";

import { FilterListOutlined } from "@mui/icons-material";
import { Box } from "@mui/material";
import { useState } from "react";
import { SearchBarField } from "@/frontend/common/components/ui/input/searchBarField";
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
import { DesktopMetricCardGrid } from "@/frontend/desktop/components/ui/card/MetricCardGrid";
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
  // Local input state keeps the shared search field controlled; the canonical
  // query lives in the parents store via `onSearch`.
  const [query, setQuery] = useState("");
  return (
    <SearchBarField
      value={query}
      placeholder={placeholder}
      onChange={value => {
        setQuery(value);
        onSearch(value);
      }}
      sx={{ width: 300 }}
    />
  );
}

export function ParentsViewDesktop({
  metrics,
  rows,
  labelsBySection,
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
  canParentsCreate,
  canParentManageStatus,
}: Readonly<ParentsViewDesktopProps>) {
  const { shell, filters, columns, actions } = labelsBySection;

  return (
    <DesktopPageContainer>
      <DesktopPageHeader
        title={shell.pageTitle}
        subtitle={shell.pageSubtitle}
        actions={
          <>
            <ParentSearchField placeholder={filters.searchPlaceholder} onSearch={onSearch} />
            {canParentsCreate ? (
              <DesktopPrimaryPageAction onClick={onAddParent}>{actions.addParent}</DesktopPrimaryPageAction>
            ) : null}
          </>
        }
      />

      <Box sx={{ mb: 4 }}>
        <DesktopMetricCardGrid metrics={metrics} />
      </Box>

      <DesktopSectionPanel
        contentPadding={false}
        title={shell.records}
        actions={
          <Box sx={{ display: "flex", gap: 1 }}>
            <DesktopFilterButton startIcon={<FilterListOutlined />} onClick={onFilter}>
              {filters.filterLabel}
            </DesktopFilterButton>
            <DesktopExportButton onClick={onExport}>{actions.export}</DesktopExportButton>
          </Box>
        }
      >
        <ParentFilterPanel
          open={filterPanelOpen}
          lifecycleStatusFilter={lifecycleStatusFilter}
          filterLabel={filters.filterLabel}
          clearFiltersLabel={filters.clearFilters}
          statusLabels={filters.statusLabels}
          onLifecycleStatusFilterChange={onLifecycleStatusFilterChange}
          onResetFilters={onResetFilters}
        />
        <ParentsDataGridDesktop
          rows={rows}
          labels={columns}
          onOpenSettings={onOpenSettings}
          page={page}
          pageSize={pageSize}
          totalCount={totalCount}
          onPageChange={onPageChange}
          loading={loading}
          canParentManageStatus={canParentManageStatus}
        />
      </DesktopSectionPanel>
    </DesktopPageContainer>
  );
}
