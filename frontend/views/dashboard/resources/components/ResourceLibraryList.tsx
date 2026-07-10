"use client";

import { Box, Typography } from "@mui/material";
import { ResourceLibraryCard } from "@/frontend/views/dashboard/resources/components/ResourceLibraryCard";
import { ResourceLibraryHeader } from "@/frontend/views/dashboard/resources/components/ResourceLibraryHeader";
import type { ResourceLibraryListProps } from "@/frontend/views/dashboard/resources/types/resourcesTypes";

export function ResourceLibraryList({
  resources,
  labels,
  filterType,
  sortBy,
  canManage,
  onFilterTypeChange,
  onSortByChange,
  onDeleteRequest,
  onCardClick,
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
              onCardClick={onCardClick}
              variant="list"
            />
          ))}
        </Box>
      )}
    </Box>
  );
}
