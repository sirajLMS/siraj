"use client";

import { FilterListOutlined, SortOutlined } from "@mui/icons-material";
import { Box } from "@mui/material";
import { FilterButton } from "@/frontend/common/components/ui";
import type { ResourceLibraryHeaderProps } from "@/frontend/common/views/dashboard/resources/types/resourcesTypes";

export function ResourceLibraryHeaderDesktop({
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
      <FilterButton startIcon={<SortOutlined />} onClick={handleSortToggle} sx={{ borderRadius: 999 }}>
        {sortLabel}
      </FilterButton>
    </Box>
  );
}
