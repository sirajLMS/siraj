"use client";

import { FilterListOutlined, SortOutlined } from "@mui/icons-material";
import { Box } from "@mui/material";
import type { ResourceLibraryHeaderProps } from "@/frontend/common/views/dashboard/resources/types/resourcesTypes";
import { DesktopFilterButton } from "@/frontend/desktop/components/ui/button";

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
      <DesktopFilterButton startIcon={<FilterListOutlined />} onClick={handleFilterToggle} sx={{ borderRadius: 999 }}>
        {filterLabel}
      </DesktopFilterButton>
      <DesktopFilterButton startIcon={<SortOutlined />} onClick={handleSortToggle} sx={{ borderRadius: 999 }}>
        {sortLabel}
      </DesktopFilterButton>
    </Box>
  );
}
