"use client";

import { SearchOutlined } from "@mui/icons-material";
import { InputAdornment, Stack, TextField } from "@mui/material";
import { buildServerPaginationOptions } from "@/frontend/common/components/ui/filter/listPaginationOptions";
import { ParentsMetricGrid } from "@/frontend/common/views/dashboard/admin/parents/home/ParentsMetricGrid";
import type { BaseParentsViewProps } from "@/frontend/common/views/dashboard/admin/parents/home/ParentsViewTypes";
import { ParentFilterPanel } from "@/frontend/common/views/dashboard/admin/parents/home/parentFilterPanel";
import {
  MobileContentInset,
  MobileContentStack,
  MobileExportButton,
  MobileFilterButton,
  MobilePageContainer,
  MobilePageHeader,
  MobilePrimaryPageAction,
  MobileSectionPanel,
} from "@/frontend/mobile/components/ui";
import { ParentCardListMobile } from "@/frontend/mobile/views/dashboard/admin/parents/home/components/parentCardList.mobile";

export type ParentsViewMobileProps = BaseParentsViewProps;

function ParentMobileSearchField({
  placeholder,
  onSearch,
}: {
  readonly placeholder: string;
  readonly onSearch: (query: string) => void;
}) {
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

export function ParentsViewMobile({
  metrics,
  rows,
  labelsBySection,
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
          <ParentMobileSearchField placeholder={filters.searchPlaceholder} onSearch={onSearch} />
        </MobileContentInset>

        <MobileContentInset>
          <ParentsMetricGrid metrics={metrics} />
        </MobileContentInset>

        <MobileSectionPanel
          title={shell.records}
          contentInset={false}
          actions={
            <Stack direction="row" spacing={1} sx={{ display: "flex", alignItems: "center" }}>
              <MobileFilterButton size="small" onClick={onFilter}>
                {filters.filterLabel}
              </MobileFilterButton>
              <MobileExportButton size="small" onClick={onExport} />
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
