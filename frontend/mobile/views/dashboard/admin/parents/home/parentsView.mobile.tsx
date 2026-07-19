"use client";

import { SearchOutlined } from "@mui/icons-material";
import { InputAdornment, Stack, TextField } from "@mui/material";
import { buildServerPaginationOptions } from "@/frontend/common/components/ui/filter/listPaginationOptions";
import { ParentsMetricGrid } from "@/frontend/common/views/dashboard/admin/parents/home/ParentsMetricGrid";
import type { BaseParentsViewProps } from "@/frontend/common/views/dashboard/admin/parents/home/ParentsViewTypes";
import { ParentFilterPanel } from "@/frontend/common/views/dashboard/admin/parents/home/parentFilterPanel";
import {
  MobileContentStack,
  MobileExportButton,
  MobileFilterButton,
  MobilePageContainer,
  MobilePageHeader,
  MobilePrimaryPageAction,
  MobileSectionPanel,
} from "@/frontend/mobile/components/ui";
import { ParentCardListMobile } from "@/frontend/mobile/views/dashboard/admin/parents/home/components/parentCardList.mobile";

// VARIANT JUSTIFICATION: ParentsViewMobileProps is structurally identical to BaseParentsViewProps
// — the mobile tier supplies no extra fields beyond the shared contract. The mobile view renders
// sentinel rows / in-list skeletons instead of the desktop grid-level loading overlay, so
// `loading` is omitted (kept on the desktop twin only). Implemented as a `type` alias to satisfy
// `@typescript-eslint/no-empty-object-type` while still keeping a tier-suffixed public name.
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
  labels,
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
  // NEW FOR PLAN v5: lifted permission boolean consumed by the tier view
  // instead of a `RequirePermission` wrapper (specs.md §3 N3).
  canParentsCreate,
}: Readonly<ParentsViewMobileProps>) {
  return (
    <MobilePageContainer>
      <MobilePageHeader
        title={labels.pageTitle}
        subtitle={labels.pageSubtitle}
        edgeToEdge={false}
        actions={
          canParentsCreate ? (
            <MobilePrimaryPageAction onClick={onAddParent}>{labels.addParent}</MobilePrimaryPageAction>
          ) : undefined
        }
      />

      <MobileContentStack gap={2} paddingBottom={4}>
        <ParentMobileSearchField placeholder={labels.searchPlaceholder} onSearch={onSearch} />

        <ParentsMetricGrid metrics={metrics} />

        <MobileSectionPanel
          title={labels.records}
          actions={
            <Stack direction="row" spacing={1} sx={{ display: "flex", alignItems: "center" }}>
              <MobileFilterButton size="small" onClick={onFilter}>
                {labels.filterLabel}
              </MobileFilterButton>
              <MobileExportButton size="small" onClick={onExport} />
            </Stack>
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
          <ParentCardListMobile
            rows={rows}
            labels={{
              ...labels.card,
              statusLabels: labels.statusLabels,
              accountStatusLabels: labels.accountStatusLabels,
            }}
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
