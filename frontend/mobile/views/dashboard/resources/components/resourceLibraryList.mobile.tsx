"use client";

import { Box, Typography } from "@mui/material";
import type { ResourceLibraryListProps } from "@/frontend/common/views/dashboard/resources/types/resourcesTypes";
import { ResourceLibraryCardMobile } from "@/frontend/mobile/views/dashboard/resources/components/resourceLibraryCard.mobile";
import { ResourceLibraryHeaderMobile } from "@/frontend/mobile/views/dashboard/resources/components/resourceLibraryHeader.mobile";

export function ResourceLibraryListMobile({
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
        <ResourceLibraryHeaderMobile
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
            <ResourceLibraryCardMobile
              key={resource.id}
              resource={resource}
              labels={labels}
              canManage={canManage}
              onDeleteRequest={onDeleteRequest}
              onCardClick={onCardClick}
            />
          ))}
        </Box>
      )}
    </Box>
  );
}
