"use client";

import { Box, Grid, Typography } from "@mui/material";
import type { ResourceLibraryGridProps } from "@/frontend/common/views/dashboard/resources/types/resourcesTypes";
import { ResourceLibraryCardDesktop } from "@/frontend/desktop/views/dashboard/resources/components/resourceLibraryCard.desktop";
import { ResourceLibraryHeaderDesktop } from "@/frontend/desktop/views/dashboard/resources/components/resourceLibraryHeader.desktop";

export function ResourceLibraryGridDesktop({
  resources,
  labels,
  filterType,
  sortBy,
  onFilterTypeChange,
  onSortByChange,
  onDeleteRequest,
  onCardClick,
}: Readonly<Omit<ResourceLibraryGridProps, "canManage">>) {
  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2, gap: 2 }}>
        <Typography variant="titleLg">{labels.library.title}</Typography>
      </Box>

      <ResourceLibraryHeaderDesktop
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
              <ResourceLibraryCardDesktop
                resource={resource}
                onDeleteRequest={onDeleteRequest}
                onCardClick={onCardClick}
              />
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
}
