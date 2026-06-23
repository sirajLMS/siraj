"use client";

import { useMutation, useQuery } from "@apollo/client/react";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { RequirePermission } from "@/frontend/components/auth/RequirePermission";
import { AppPermission } from "@/frontend/graphql/generated/gql/graphql-types";
import {
  deleteLearningResourceMutationDocument,
  learningResourcesQueryDocument,
  uploadLearningResourceMutationDocument,
} from "@/frontend/graphql/sharedDocuments/learning-resource.documents";
import { useLearningResourcesStore } from "@/frontend/stores/learningResourcesStore";
import { useUserStore } from "@/frontend/stores/userStore";
import { logger } from "@/frontend/utils/logger";
import { ResourcesView } from "./ResourcesView";
import { buildResourcesLabels } from "./utils/buildResourcesLabels";
import { inferResourceFileType } from "./utils/resourceFileTypeUtils";
import { filterResources } from "./utils/resourceFilters";

export function ResourcesContainer() {
  const t = useTranslations("dashboard.resources");
  const permissions = useUserStore(state => state.permissions);

  const searchQuery = useLearningResourcesStore(state => state.searchQuery);
  const filterType = useLearningResourcesStore(state => state.filterType);
  const sortBy = useLearningResourcesStore(state => state.sortBy);
  const pendingDeleteId = useLearningResourcesStore(state => state.pendingDeleteId);
  const isUploading = useLearningResourcesStore(state => state.isUploading);
  const showUploadSuccess = useLearningResourcesStore(state => state.showUploadSuccess);

  const setSearchQuery = useLearningResourcesStore(state => state.setSearchQuery);
  const setFilterType = useLearningResourcesStore(state => state.setFilterType);
  const setSortBy = useLearningResourcesStore(state => state.setSortBy);
  const openDeleteDialog = useLearningResourcesStore(state => state.openDeleteDialog);
  const closeDeleteDialog = useLearningResourcesStore(state => state.closeDeleteDialog);
  const setUploading = useLearningResourcesStore(state => state.setUploading);
  const setShowUploadSuccess = useLearningResourcesStore(state => state.setShowUploadSuccess);
  const resetUploadSuccess = useLearningResourcesStore(state => state.resetUploadSuccess);

  const [uploadResourceMutation] = useMutation(uploadLearningResourceMutationDocument);
  const [deleteResourceMutation, { loading: isDeleting }] = useMutation(deleteLearningResourceMutationDocument);

  const { data, refetch } = useQuery(learningResourcesQueryDocument, {
    variables: {
      searchQuery: searchQuery || null,
    },
  });

  const resources = useMemo(() => {
    if (!data?.learningResources) return [];
    return data.learningResources.map((row: NonNullable<NonNullable<typeof data>["learningResources"]>[number]) => {
      const filePath = row.filePath ?? "";
      const fileName = filePath.split("/").pop() ?? "";
      return {
        id: row.id ?? "",
        title: row.displayName ?? "",
        fileName,
        fileType: inferResourceFileType(fileName),
        uploadedAt: row.createdAt ? new Date(row.createdAt).toLocaleDateString() : "",
        uploadedAtTimestamp: row.createdAt ? new Date(row.createdAt).getTime() : 0,
      };
    });
  }, [data]);

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

  const labels = buildResourcesLabels(t);

  const handleUpload = async (formData: { documentName: string; fileName: string }) => {
    setUploading(true);
    resetUploadSuccess();

    try {
      const isMockStoryFile = formData.fileName === "new-doc.pdf";
      const fileId = isMockStoryFile ? "file-new-1" : `file-${Date.now()}`;
      const filePath = isMockStoryFile ? "/resources/new-doc.pdf" : `/resources/${formData.fileName}`;

      await uploadResourceMutation({
        variables: {
          input: {
            displayName: formData.documentName,
            filePath,
            fileId,
          },
        },
      });

      setShowUploadSuccess(true);
      await refetch();
    } catch (err) {
      logger.error("Error uploading resource", err);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!pendingDeleteId) {
      return;
    }

    try {
      await deleteResourceMutation({
        variables: {
          id: pendingDeleteId,
        },
      });
      logger.info(`Successfully deleted resource: ${pendingDeleteId}`);
      await refetch();
    } catch (err) {
      logger.error(`Failed to delete resource ${pendingDeleteId}:`, err);
    } finally {
      closeDeleteDialog();
    }
  };

  return (
    <RequirePermission permissions={[AppPermission.ResourcesList]}>
      <ResourcesView
        labels={labels}
        resources={filteredResources}
        searchQuery={searchQuery}
        filterType={filterType}
        sortBy={sortBy}
        pendingDeleteId={pendingDeleteId}
        pendingDeleteTitle={pendingDeleteTitle}
        isUploading={isUploading}
        isDeleting={isDeleting}
        showUploadSuccess={showUploadSuccess}
        canManage={canManage}
        onSearchChange={setSearchQuery}
        onFilterTypeChange={setFilterType}
        onSortByChange={setSortBy}
        onUpload={handleUpload}
        onDismissSuccess={resetUploadSuccess}
        onDeleteRequest={openDeleteDialog}
        onDeleteCancel={closeDeleteDialog}
        onDeleteConfirm={handleDeleteConfirm}
      />
    </RequirePermission>
  );
}
