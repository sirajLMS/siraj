"use client";

import { Chip, Collapse, Stack, Typography } from "@mui/material";
import { FilterButton } from "@/frontend/components/ui";
import type { ParentStatus } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { toParentLifecycleStatus } from "@/frontend/views/dashboard/admin/parents/home/directory";
import { LIFECYCLE_STATUS_FILTER_OPTIONS } from "@/frontend/views/dashboard/admin/parents/home/parentFilterConstants";
import type { ParentLifecycleStatus } from "@/frontend/views/dashboard/types/parent.types";

export interface ParentFilterPanelProps {
  readonly open: boolean;
  readonly lifecycleStatusFilter: ParentStatus | null;
  readonly filterLabel: string;
  readonly clearFiltersLabel: string;
  readonly statusLabels: Record<ParentLifecycleStatus, string>;
  readonly onLifecycleStatusFilterChange: (status: ParentStatus | null) => void;
  readonly onResetFilters: () => void;
}

export function ParentFilterPanel({
  open,
  lifecycleStatusFilter,
  filterLabel,
  clearFiltersLabel,
  statusLabels,
  onLifecycleStatusFilterChange,
  onResetFilters,
}: Readonly<ParentFilterPanelProps>) {
  return (
    <Collapse in={open}>
      <Stack direction="row" spacing={1} sx={{ px: 3, pt: 2, pb: 1, flexWrap: "wrap", gap: 1, alignItems: "center" }}>
        <Typography variant="labelMd" sx={theme => ({ color: theme.palette.text.secondary, mr: 1 })}>
          {filterLabel}:
        </Typography>
        {LIFECYCLE_STATUS_FILTER_OPTIONS.map(status => {
          const displayStatus = toParentLifecycleStatus(status);
          const isActive = lifecycleStatusFilter === status;
          return (
            <Chip
              key={status}
              label={statusLabels[displayStatus]}
              size="small"
              variant={isActive ? "filled" : "outlined"}
              color={isActive ? "primary" : "default"}
              onClick={() => {
                onLifecycleStatusFilterChange(lifecycleStatusFilter === status ? null : status);
              }}
            />
          );
        })}
        {lifecycleStatusFilter && (
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
