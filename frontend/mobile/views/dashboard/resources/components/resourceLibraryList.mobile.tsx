"use client";

import type { ResourceLibraryListProps } from "@/frontend/common/views/dashboard/resources/types/resourcesTypes";
import { Box, Typography } from "@mui/material";
import { MobileCardList } from "@/frontend/mobile/components/ui";
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

      <MobileCardList
        rows={resources}
        emptyMessage={labels.library.noEntries}
        getKey={resource => resource.id}
        paginationOptions={{ mode: "client" }}
        layout="edge-to-edge"
        renderItem={resource => (
          <ResourceLibraryCardMobile
            resource={resource}
            labels={labels}
            canManage={canManage}
            onDeleteRequest={onDeleteRequest}
            onCardClick={onCardClick}
          />
        )}
      />
    </Box>
  );
}
