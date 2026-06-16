"use client";

import { Box, Typography } from "@mui/material";
import type { ResourcesLabels } from "@/frontend/messages/types/dashboard/resources/main";
import type { LearningResourceRow, ResourceFilterType, ResourceSortBy } from "@/frontend/stores/resourcesStore";
import { ResourceLibraryCard } from "./ResourceLibraryCard";
import { ResourceLibraryHeader } from "./ResourceLibraryHeader";

interface ResourceLibraryListProps {
  readonly resources: readonly LearningResourceRow[];
  readonly labels: ResourcesLabels;
  readonly filterType: ResourceFilterType;
  readonly sortBy: ResourceSortBy;
  readonly canManage: boolean;
  readonly onFilterTypeChange: (type: ResourceFilterType) => void;
  readonly onSortByChange: (sort: ResourceSortBy) => void;
  readonly onDeleteRequest: (id: string) => void;
}

export function ResourceLibraryList({
  resources,
  labels,
  filterType,
  sortBy,
  canManage,
  onFilterTypeChange,
  onSortByChange,
  onDeleteRequest,
}: Readonly<ResourceLibraryListProps>) {
  return (
    <Box>
      <Typography variant="titleLg" sx={{ mb: 2 }}>
        {labels.library.title}
      </Typography>

      <Box sx={{ overflowX: "auto", pb: 1, mb: 2 }}>
        <ResourceLibraryHeader
          labels={labels}
          filterType={filterType}
          sortBy={sortBy}
          onFilterTypeChange={onFilterTypeChange}
          onSortByChange={onSortByChange}
        />
      </Box>

      {resources.length === 0 ? (
        <Typography
          variant="bodyMd"
          sx={theme => ({ color: theme.palette.text.secondary, py: 4, textAlign: "center" })}
        >
          {labels.library.noEntries}
        </Typography>
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
          {resources.map(resource => (
            <ResourceLibraryCard
              key={resource.id}
              resource={resource}
              labels={labels}
              canManage={canManage}
              onDeleteRequest={onDeleteRequest}
              variant="list"
            />
          ))}
        </Box>
      )}
    </Box>
  );
}
