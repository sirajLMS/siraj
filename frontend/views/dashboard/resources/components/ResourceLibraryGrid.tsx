"use client";

import { Box, Grid, Typography } from "@mui/material";
import type { LearningResourceRow, ResourceFilterType, ResourceSortBy } from "@/frontend/stores/resourcesStore";
import type { ResourcesLabels } from "@/shared/messages/types/dashboard/resources/main";
import { ResourceLibraryCard } from "./ResourceLibraryCard";
import { ResourceLibraryHeader } from "./ResourceLibraryHeader";

interface ResourceLibraryGridProps {
  readonly resources: readonly LearningResourceRow[];
  readonly labels: ResourcesLabels;
  readonly filterType: ResourceFilterType;
  readonly sortBy: ResourceSortBy;
  readonly canManage: boolean;
  readonly onFilterTypeChange: (type: ResourceFilterType) => void;
  readonly onSortByChange: (sort: ResourceSortBy) => void;
  readonly onDeleteRequest: (id: string) => void;
}

export function ResourceLibraryGrid({
  resources,
  labels,
  filterType,
  sortBy,
  canManage,
  onFilterTypeChange,
  onSortByChange,
  onDeleteRequest,
}: Readonly<ResourceLibraryGridProps>) {
  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2, gap: 2 }}>
        <Typography variant="titleLg">{labels.library.title}</Typography>
      </Box>

      <ResourceLibraryHeader
        labels={labels}
        filterType={filterType}
        sortBy={sortBy}
        onFilterTypeChange={onFilterTypeChange}
        onSortByChange={onSortByChange}
      />

      {resources.length === 0 ? (
        <Typography
          variant="bodyMd"
          sx={theme => ({ color: theme.palette.text.secondary, py: 4, textAlign: "center" })}
        >
          {labels.library.noEntries}
        </Typography>
      ) : (
        <Grid container spacing={2}>
          {resources.map(resource => (
            <Grid key={resource.id} size={{ xs: 12, md: 6 }}>
              <ResourceLibraryCard
                resource={resource}
                labels={labels}
                canManage={canManage}
                onDeleteRequest={onDeleteRequest}
                variant="grid"
              />
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
}
