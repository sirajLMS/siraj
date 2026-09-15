"use client";

import { Stack } from "@mui/material";
import { buildServerPaginationOptions } from "@/frontend/common/components/ui/filter/listPaginationOptions";
import { SearchBarField } from "@/frontend/common/components/ui/input/searchBarField";
import type { BaseParentsViewProps } from "@/frontend/common/views/dashboard/admin/parents/home/ParentsViewTypes";
import { ParentFilterPanel } from "@/frontend/common/views/dashboard/admin/parents/home/parentFilterPanel";
import {
  MobileContentInset,
  MobileContentStack,
  MobileExportButton,
  MobileFilterButton,
  MobileMetricCardGrid,
  MobilePageContainer,
  MobilePageHeader,
  MobilePrimaryPageAction,
  MobileSectionPanel,
} from "@/frontend/mobile/components/ui";
import { ParentCardListMobile } from "@/frontend/mobile/views/dashboard/admin/parents/home/components/parentCardList.mobile";

export type ParentsViewMobileProps = BaseParentsViewProps;

export function ParentsViewMobile({
  metrics,
  rows,
  labelsBySection,
  page,
  pageSize,
  totalCount,
  searchQuery,
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
}: Readonly<ParentsViewMobileProps>) {
  const { shell, filters, card, actions } = labelsBySection;

  return (
    <MobilePageContainer>
      <MobilePageHeader
        title={shell.pageTitle}
        subtitle={shell.pageSubtitle}
        edgeToEdge={false}
        actions={
          canParentsCreate ? (
            <MobilePrimaryPageAction onClick={onAddParent}>{actions.addParent}</MobilePrimaryPageAction>
          ) : undefined
        }
      />

      <MobileContentStack gap={2} paddingBottom={4}>
        <MobileContentInset>
          <SearchBarField value={searchQuery} placeholder={filters.searchPlaceholder} onChange={onSearch} />
        </MobileContentInset>

        <MobileMetricCardGrid metrics={metrics} />

        <MobileSectionPanel
          title={shell.records}
          contentInset={false}
          actions={
            <Stack direction="row" spacing={1} sx={{ display: "flex", alignItems: "center" }}>
              <MobileFilterButton size="small" onClick={onFilter}>
                {filters.filterLabel}
              </MobileFilterButton>
              <MobileExportButton size="small" onClick={onExport}>
                {actions.export}
              </MobileExportButton>
            </Stack>
          }
        >
          <MobileContentInset>
            <ParentFilterPanel
              open={filterPanelOpen}
              lifecycleStatusFilter={lifecycleStatusFilter}
              filterLabel={filters.filterLabel}
              clearFiltersLabel={filters.clearFilters}
              statusLabels={filters.statusLabels}
              onLifecycleStatusFilterChange={onLifecycleStatusFilterChange}
              onResetFilters={onResetFilters}
            />
          </MobileContentInset>
          <ParentCardListMobile
            rows={rows}
            labels={card}
            onOpenSettings={onOpenSettings}
            paginationOptions={
              totalCount !== undefined && onPageChange !== undefined
                ? buildServerPaginationOptions({
                    page: page ?? 0,
                    pageSize: pageSize ?? 10,
                    totalCount,
                    onPageChange,
                  })
                : false
            }
          />
        </MobileSectionPanel>
      </MobileContentStack>
    </MobilePageContainer>
  );
}
