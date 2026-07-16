"use client";

import { useMutation, useQuery } from "@apollo/client/react";
import { useNotifications } from "@toolpad/core/useNotifications";
import { useMemo } from "react";
import { RequirePermission } from "@/frontend/common/components/auth/RequirePermission";
import { AppPermission, UploadType } from "@/frontend/common/graphql/generated/gql/graphql-types";
import {
  deleteLearningResourceMutationDocument,
  learningResourcesQueryDocument,
  prepareUploadMutationDocument,
  uploadLearningResourceMutationDocument,
} from "@/frontend/common/graphql/sharedDocuments";
import { useLearningResourcesStore } from "@/frontend/common/stores/learningResourcesStore";
import { useUserStore } from "@/frontend/common/stores/userStore";
import { logger } from "@/frontend/common/utils/logger";
import { ResourcesView } from "@/frontend/common/views/dashboard/resources/resourcesView";
import { buildResourcesLabels } from "@/frontend/common/views/dashboard/resources/utils/buildResourcesLabels";
import { inferResourceFileType } from "@/frontend/common/views/dashboard/resources/utils/resourceFileTypeUtils";
import { filterResources } from "@/frontend/common/views/dashboard/resources/utils/resourceFilters";
import { useAppTranslation } from "@/shared/locale";
import { extToMime, isAllowedMimeType, validateFileName } from "@/shared/utils/storage.utils";

async function computeContentHash(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
  const hashArray = new Uint8Array(hashBuffer);
  let binary = "";
  for (const byte of hashArray) {
    binary += String.fromCodePoint(byte);
  }
  return btoa(binary);
}

export function ResourcesContainer() {
  const t = useAppTranslation();
  const tResources = t.dashboardTranslations.resources;
  const notifications = useNotifications();
  const permissions = useUserStore(state => state.permissions);

  const searchQuery = useLearningResourcesStore(state => state.searchQuery);
  const filterType = useLearningResourcesStore(state => state.filterType);
  const sortBy = useLearningResourcesStore(state => state.sortBy);
  const pendingDeleteId = useLearningResourcesStore(state => state.pendingDeleteId);
  const isUploading = useLearningResourcesStore(state => state.isUploading);

  const setSearchQuery = useLearningResourcesStore(state => state.setSearchQuery);
  const setFilterType = useLearningResourcesStore(state => state.setFilterType);
  const setSortBy = useLearningResourcesStore(state => state.setSortBy);
  const openDeleteDialog = useLearningResourcesStore(state => state.openDeleteDialog);
  const closeDeleteDialog = useLearningResourcesStore(state => state.closeDeleteDialog);
  const setUploading = useLearningResourcesStore(state => state.setUploading);

  const [uploadResourceMutation] = useMutation(uploadLearningResourceMutationDocument);
  const [deleteResourceMutation, { loading: isDeleting }] = useMutation(deleteLearningResourceMutationDocument);
  const [prepareUploadMutation] = useMutation(prepareUploadMutationDocument);

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
        filePath,
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

  const labels = buildResourcesLabels(tResources);

  const handleUpload = async (formData: { documentName: string; fileName: string }, file: File) => {
    setUploading(true);

    try {
      const fileNameOnly = file.name;
      const nameError = validateFileName(fileNameOnly);
      if (nameError) {
        notifications.show(nameError, { severity: "error", autoHideDuration: 4000 });
        return;
      }

      const contentType =
        file.type && isAllowedMimeType(file.type)
          ? file.type
          : (extToMime[fileNameOnly.split(".").pop()?.toLowerCase() ?? ""] ?? "application/octet-stream");

      if (!isAllowedMimeType(contentType)) {
        notifications.show(labels.notification.fileTypeNotAllowed(contentType), {
          severity: "error",
          autoHideDuration: 4000,
        });
        return;
      }

      const filePath = `resources/${fileNameOnly}`;
      const contentHash = await computeContentHash(file);

      const { data: prepData } = await prepareUploadMutation({
        variables: {
          input: {
            path: filePath,
            fileSize: file.size,
            contentType,
            contentHash,
          },
        },
      });

      if (!prepData?.prepareUpload) {
        notifications.show(labels.notification.uploadPrepareFailed, { severity: "error", autoHideDuration: 4000 });
        return;
      }

      const { id: fileId, url, uploadType } = prepData.prepareUpload;

      if (uploadType === UploadType.VercelBlobClient) {
        const { upload } = await import("@vercel/blob/client");
        await upload(filePath, file, {
          access: "public",
          handleUploadUrl: url,
          clientPayload: JSON.stringify({
            sessionId: fileId,
            fileSize: file.size,
            contentType,
          }),
        });
      } else {
        const putResponse = await fetch(url, {
          method: "PUT",
          body: file,
          headers: {
            "Content-Type": contentType,
            "Content-MD5": contentHash,
          },
        });

        if (!putResponse.ok) {
          const errorText = await putResponse.text().catch(() => "Upload failed");
          logger.error("File upload failed", { status: putResponse.status, errorText });
          notifications.show(labels.notification.uploadFailed, { severity: "error", autoHideDuration: 4000 });
          return;
        }
      }

      const { data: uploadData } = await uploadResourceMutation({
        variables: {
          input: {
            displayName: formData.documentName,
            filePath,
            fileId,
          },
        },
      });

      if (!uploadData?.uploadLearningResource) {
        notifications.show(tResources.notification.createRecordFailed, { severity: "error", autoHideDuration: 4000 });
        return;
      }

      notifications.show(labels.upload.successMessage, { severity: "success", autoHideDuration: 4000 });
      await refetch();
    } catch (err) {
      logger.error("Error uploading resource", err);
      notifications.show(tResources.notification.uploadRetryFailed, { severity: "error", autoHideDuration: 4000 });
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!pendingDeleteId) {
      return;
    }

    try {
      const { data: deleteData } = await deleteResourceMutation({
        variables: {
          id: pendingDeleteId,
        },
      });

      if (!deleteData?.deleteLearningResource) {
        throw new Error("Delete mutation returned no data");
      }

      logger.info(`Successfully deleted resource: ${pendingDeleteId}`);
      notifications.show(tResources.notification.deleteSuccess, { severity: "success", autoHideDuration: 3000 });
      await refetch();
    } catch (err) {
      logger.error(`Failed to delete resource ${pendingDeleteId}:`, err);
      notifications.show(tResources.notification.deleteFailed, { severity: "error", autoHideDuration: 4000 });
    } finally {
      closeDeleteDialog();
    }
  };

  const handleCardClick = (id: string) => {
    const resource = resources.find(r => r.id === id);
    if (resource?.filePath) {
      window.open(`/api/storage/files/${resource.filePath}`, "_blank", "noopener,noreferrer");
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
        canManage={canManage}
        onSearchChange={setSearchQuery}
        onFilterTypeChange={setFilterType}
        onSortByChange={setSortBy}
        onUpload={handleUpload}
        onDeleteRequest={openDeleteDialog}
        onDeleteCancel={closeDeleteDialog}
        onDeleteConfirm={handleDeleteConfirm}
        onCardClick={handleCardClick}
      />
    </RequirePermission>
  );
}
