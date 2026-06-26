"use client";

import { FilterListOutlined, SortOutlined } from "@mui/icons-material";
import { Box, Chip } from "@mui/material";
import { FilterButton } from "@/frontend/components/ui";
import type { ResourcesLabels } from "@/shared/messages/types/dashboard/resources/main";
import type { ResourceFilterType, ResourceSortBy } from "../types/resourcesTypes";

interface ResourceLibraryHeaderProps {
  readonly labels: ResourcesLabels;
  readonly filterType: ResourceFilterType;
  readonly sortBy: ResourceSortBy;
  readonly onFilterTypeChange: (type: ResourceFilterType) => void;
  readonly onSortByChange: (sort: ResourceSortBy) => void;
}

export function ResourceLibraryHeader({
  labels,
  filterType,
  sortBy,
  onFilterTypeChange,
  onSortByChange,
}: Readonly<ResourceLibraryHeaderProps>) {
  const handleSortToggle = () => {
    onSortByChange(sortBy === "date" ? "name" : "date");
  };

  const handleFilterToggle = () => {
    if (filterType === "all") {
      onFilterTypeChange("pdf");
      return;
    }
    if (filterType === "pdf") {
      onFilterTypeChange("pptx");
      return;
    }
    if (filterType === "pptx") {
      onFilterTypeChange("xlsx");
      return;
    }
    if (filterType === "xlsx") {
      onFilterTypeChange("docx");
      return;
    }
    onFilterTypeChange("all");
  };

  const sortLabel = sortBy === "date" ? labels.library.sortByDate : labels.library.sortByName;
  const filterLabel =
    filterType === "all" ? labels.library.typeAll : `${labels.library.filter}: ${filterType.toUpperCase()}`;

  return (
    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 2 }}>
      <FilterButton startIcon={<FilterListOutlined />} onClick={handleFilterToggle} sx={{ borderRadius: 999 }}>
        {filterLabel}
      </FilterButton>
      <Chip
        icon={<SortOutlined />}
        label={sortLabel}
        onClick={handleSortToggle}
        sx={theme => ({ backgroundColor: theme.palette.surfaceContainerHigh })}
      />
    </Box>
  );
}
