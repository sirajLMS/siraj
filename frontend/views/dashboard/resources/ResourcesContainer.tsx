"use client";

import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { AppPermission } from "@/frontend/graphql/generated/gql/graphql-types";
import { useResourcesStore } from "@/frontend/stores/mockResourcesStore";
import { useUserStore } from "@/frontend/stores/mockUserStore";
import { ResourcesView } from "./ResourcesView";
import { buildResourcesLabels } from "./utils/buildResourcesLabels";
import { filterResources } from "./utils/resourceFilters";

export function ResourcesContainer() {
  const t = useTranslations("dashboard.resources");
  const permissions = useUserStore(state => state.permissions);

  const resources = useResourcesStore(state => state.resources);
  const searchQuery = useResourcesStore(state => state.searchQuery);
  const filterType = useResourcesStore(state => state.filterType);
  const sortBy = useResourcesStore(state => state.sortBy);
  const pendingDeleteId = useResourcesStore(state => state.pendingDeleteId);
  const isUploading = useResourcesStore(state => state.isUploading);
  const showUploadSuccess = useResourcesStore(state => state.showUploadSuccess);
  const setSearchQuery = useResourcesStore(state => state.setSearchQuery);
  const setFilterType = useResourcesStore(state => state.setFilterType);
  const setSortBy = useResourcesStore(state => state.setSortBy);
  const openDeleteDialog = useResourcesStore(state => state.openDeleteDialog);
  const closeDeleteDialog = useResourcesStore(state => state.closeDeleteDialog);
  const confirmDelete = useResourcesStore(state => state.confirmDelete);
  const setUploading = useResourcesStore(state => state.setUploading);
  const resetUploadSuccess = useResourcesStore(state => state.resetUploadSuccess);
  const uploadResource = useResourcesStore(state => state.uploadResource);

  const canView =
    permissions.includes(AppPermission.ResourcesList) || permissions.includes(AppPermission.ResourcesDelete);
  const canManage = permissions.includes(AppPermission.ResourcesDelete);

  const filteredResources = useMemo(
    () => filterResources(resources, searchQuery, filterType, sortBy),
    [filterType, resources, searchQuery, sortBy]
  );

  const pendingDeleteTitle = useMemo(() => {
    if (!pendingDeleteId) {
      return null;
    }

    return resources.find(resource => resource.id === pendingDeleteId)?.title ?? null;
  }, [pendingDeleteId, resources]);

  if (!canView) {
    return null;
  }

  const labels = buildResourcesLabels(t);

  const handleUpload = (data: Parameters<typeof uploadResource>[0]) => {
    setUploading(true);
    resetUploadSuccess();
    uploadResource(data);
    setUploading(false);
  };

  return (
    <ResourcesView
      labels={labels}
      resources={filteredResources}
      searchQuery={searchQuery}
      filterType={filterType}
      sortBy={sortBy}
      pendingDeleteId={pendingDeleteId}
      pendingDeleteTitle={pendingDeleteTitle}
      isUploading={isUploading}
      showUploadSuccess={showUploadSuccess}
      canManage={canManage}
      onSearchChange={setSearchQuery}
      onFilterTypeChange={setFilterType}
      onSortByChange={setSortBy}
      onUpload={handleUpload}
      onDismissSuccess={resetUploadSuccess}
      onDeleteRequest={openDeleteDialog}
      onDeleteCancel={closeDeleteDialog}
      onDeleteConfirm={confirmDelete}
    />
  );
}
