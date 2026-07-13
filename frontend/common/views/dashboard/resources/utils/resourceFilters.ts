import type {
  LearningResourceRow,
  ResourceFilterType,
  ResourceSortBy,
} from "@/frontend/common/views/dashboard/resources/types/resourcesTypes";

export function filterResources(
  rows: readonly LearningResourceRow[],
  searchQuery: string,
  filterType: ResourceFilterType,
  sortBy: ResourceSortBy
): LearningResourceRow[] {
  const normalizedQuery = searchQuery.trim().toLowerCase();

  const filtered = rows.filter(row => {
    if (filterType !== "all" && row.fileType !== filterType) {
      return false;
    }

    if (normalizedQuery.length === 0) {
      return true;
    }

    return row.title.toLowerCase().includes(normalizedQuery) || row.fileName.toLowerCase().includes(normalizedQuery);
  });

  return [...filtered].sort((left, right) => {
    if (sortBy === "name") {
      return left.title.localeCompare(right.title);
    }

    return right.uploadedAtTimestamp - left.uploadedAtTimestamp;
  });
}
