"use client";

import { SearchOutlined } from "@mui/icons-material";
import { InputAdornment, Stack, TextField } from "@mui/material";
import { RequirePermission } from "@/frontend/common/components/auth/RequirePermission";
import {
  ExportButton,
  FilterButton,
  PageContainer,
  PrimaryPageAction,
  SectionPanel,
} from "@/frontend/common/components/ui";
import { AppPermission, type ParentStatus } from "@/frontend/common/graphql/generated/gql/graphql-types";
import type { ParentDirectoryRow } from "@/frontend/common/views/dashboard/admin/parents/home/directory";
import { ParentsMetricGrid } from "@/frontend/common/views/dashboard/admin/parents/home/ParentsMetricGrid";
import type { ParentsViewLabels } from "@/frontend/common/views/dashboard/admin/parents/home/ParentsView";
import { ParentFilterPanel } from "@/frontend/common/views/dashboard/admin/parents/home/parentFilterPanel";
import type { MetricItem } from "@/frontend/common/views/dashboard/types/dashboard";
import { MobileContentStack, MobilePageHeader } from "@/frontend/mobile/components/ui";
import { ParentCardListMobile } from "@/frontend/mobile/views/dashboard/admin/parents/home/components/parentCardList.mobile";

export interface ParentsViewMobileProps {
  readonly metrics: readonly MetricItem[];
  readonly rows: readonly ParentDirectoryRow[];
  readonly labels: ParentsViewLabels;
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
}: Readonly<ParentsViewMobileProps>) {
  return (
    <PageContainer>
      <MobilePageHeader
        title={labels.pageTitle}
        subtitle={labels.pageSubtitle}
        edgeToEdge={false}
        actions={
          <RequirePermission permissions={[AppPermission.ParentsCreate]}>
            <PrimaryPageAction onClick={onAddParent}>{labels.addParent}</PrimaryPageAction>
          </RequirePermission>
        }
      />

      <MobileContentStack gap={2} paddingBottom={4}>
        <ParentMobileSearchField placeholder={labels.searchPlaceholder} onSearch={onSearch} />

        <ParentsMetricGrid metrics={metrics} />

        <SectionPanel
          title={labels.records}
          actions={
            <Stack direction="row" spacing={1} sx={{ display: "flex", alignItems: "center" }}>
              <FilterButton size="small" onClick={onFilter}>
                {labels.filterLabel}
              </FilterButton>
              <ExportButton size="small" onClick={onExport} />
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
            labels={labels.card}
            onOpenSettings={onOpenSettings}
            page={page}
            pageSize={pageSize}
            totalCount={totalCount}
            onPageChange={onPageChange}
          />
        </SectionPanel>
      </MobileContentStack>
    </PageContainer>
  );
}
