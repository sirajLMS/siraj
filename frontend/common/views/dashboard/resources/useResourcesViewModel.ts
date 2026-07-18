"use client";

import { useMutation, useQuery } from "@apollo/client/react";
import { useCallback, useMemo, useRef, useState } from "react";
import type * as Types from "@/frontend/common/graphql/generated/gql/graphql-types";
import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql-types";
import type * as Operations from "@/frontend/common/graphql/generated/gql/operations";
import {
  deleteLearningResourceMutationDocument,
  learningResourcesQueryDocument,
  prepareUploadMutationDocument,
  uploadLearningResourceMutationDocument,
} from "@/frontend/common/graphql/sharedDocuments";
import { useLearningResourcesStore } from "@/frontend/common/stores/learningResourcesStore";
import { useUserStore } from "@/frontend/common/stores/userStore";
import type { ResourceFilterType, ResourceSortBy } from "@/frontend/common/types/shared.types";
import { logger } from "@/frontend/common/utils/logger";
import type {
  LearningResourceRow,
  ResourceUploadFormData,
} from "@/frontend/common/views/dashboard/resources/types/resourcesTypes";
import type { ResourcesLabels } from "@/shared/locale";
import { useAppTranslation } from "@/shared/locale";

export type {
  LearningResourceRow,
  ResourceUploadFormData,
} from "@/frontend/common/views/dashboard/resources/types/resourcesTypes";
export type { ResourceFilterType, ResourceSortBy };

export interface ResourcesViewModel {
  readonly labels: ResourcesLabels;
  readonly resources: readonly LearningResourceRow[];
  readonly searchQuery: string;
  readonly filterType: ResourceFilterType;
  readonly sortBy: ResourceSortBy;
  readonly pendingDeleteId: string | null;
  readonly pendingDeleteTitle: string | null;
  readonly isUploading: boolean;
  readonly isDeleting: boolean;
  readonly canManage: boolean;
  readonly documentName: string;
  readonly selectedFileName: string;
  readonly onSearchChange: (query: string) => void;
  readonly onFilterTypeChange: (type: ResourceFilterType) => void;
  readonly onSortByChange: (sort: ResourceSortBy) => void;
  readonly onDocumentNameChange: (name: string) => void;
  readonly onFormSubmit: () => void;
  readonly onFileSelect: (file: File) => void;
  readonly onUpload: (data: ResourceUploadFormData, file: File) => void;
  readonly onDeleteRequest: (id: string) => void;
  readonly onDeleteCancel: () => void;
  readonly onDeleteConfirm: () => void;
  readonly onCardClick: (id: string) => void;
  // NEW FOR PLAN v5: lifted permission boolean per specs.md §3 N3 + §6.1.
  // Tier resource-library card components no longer import `RequirePermission`
  // — the Container wraps the View in `<RequirePermission>` (page-level)
  // and the per-card delete IconButton reads `canResourcesDelete` as a prop.
  readonly canResourcesList: boolean;
  readonly canResourcesDelete: boolean;
}

export type UseResourcesViewModelProps = Record<string, never>;

export function useResourcesViewModel(_props: Readonly<UseResourcesViewModelProps>): ResourcesViewModel {
  const t = useAppTranslation().dashboardTranslations.resources;

  // NEW FOR PLAN v5: read the user's permissions ONCE in the ViewModel and
  // expose boolean gates. Tier resource-library card components no longer
  // import `RequirePermission` (specs.md §3 N3).
  const hasPermission = useUserStore(state => state.hasPermission);
  const canResourcesList = hasPermission(AppPermission.ResourcesList);
  const canResourcesDelete = hasPermission(AppPermission.ResourcesDelete);

  const {
    searchQuery,
    filterType,
    sortBy,
    pendingDeleteId,
    pendingDeleteTitle,
    isUploading,
    isDeleting,
    canManage,
    documentName,
    setDocumentName,
    setSearchQuery,
    setFilterType,
    setSortBy,
    openDeleteDialog,
    closeDeleteDialog,
    setUploading,
    setDeleting,
  } = useLearningResourcesStore();

  const { data } = useQuery<Operations.LearningResourcesQuery, Types.QueryLearningResourcesArgs>(
    learningResourcesQueryDocument,
    {
      variables: {
        searchQuery: searchQuery || null,
      },
      fetchPolicy: "cache-and-network",
    }
  );

  const resources: LearningResourceRow[] = useMemo(() => {
    return (data?.learningResources ?? []).map(resource => {
      const contentType = resource.contentType ?? "";
      // NEW FOR PLAN v5: clamp `fileType` to the canonical `ResourceFileType`
      // union (`"pdf" | "pptx" | "xlsx" | "docx"`) declared in `shared.types` —
      // the previous inline `LearningResourceRow` interface accepted a wider
      // literal union that included `video` / `image` / `document` and caused
      // a TS identity mismatch with the canonical type in `resourcesTypes.ts`.
      // The card components don't branch on these extra literals (they only
      // render the icon for the four document types and a generic icon for
      // everything else) so the clamp is safe.
      const resolvedFileType: LearningResourceRow["fileType"] = contentType.startsWith("pdf")
        ? "pdf"
        : contentType.startsWith("pptx") || contentType.includes("presentation")
          ? "pptx"
          : contentType.startsWith("xlsx") || contentType.includes("spreadsheet")
            ? "xlsx"
            : contentType.startsWith("docx") || contentType.includes("word") || contentType.includes("msword")
              ? "docx"
              : "pdf";
      return {
        id: resource.id ?? "",
        title: resource.displayName ?? "",
        fileName: resource.filePath?.split("/").pop() ?? resource.displayName ?? "",
        filePath: resource.filePath ?? "",
        fileType: resolvedFileType,
        uploadedAt: resource.createdAt ?? "",
        uploadedAtTimestamp: resource.createdAt ? new Date(resource.createdAt).getTime() : 0,
      };
    });
  }, [data]);

  const [uploadMutation, { loading: uploading }] = useMutation<
    Operations.UploadLearningResourceMutation,
    Types.MutationUploadLearningResourceArgs
  >(uploadLearningResourceMutationDocument);
  const [prepareUploadMutation] = useMutation<Operations.PrepareUploadMutation, Types.MutationPrepareUploadArgs>(
    prepareUploadMutationDocument
  );
  const [deleteMutation, { loading: deleting }] = useMutation<
    Operations.DeleteLearningResourceMutation,
    Types.MutationDeleteLearningResourceArgs
  >(deleteLearningResourceMutationDocument);

  const selectedFileRef = useRef<File | null>(null);
  const [selectedFileName, setSelectedFileName] = useState("");

  const handleFileSelect = (file: File) => {
    selectedFileRef.current = file;
    setSelectedFileName(file.name);
  };

  const handleFormSubmit = useCallback(async () => {
    const file = selectedFileRef.current;
    if (!file || !documentName.trim()) {
      return;
    }

    setUploading(true);
    setDeleting(false);

    try {
      const { data: prepareData } = await prepareUploadMutation({
        variables: {
          input: {
            contentHash: "",
            contentType: file.type,
            fileSize: file.size,
            path: file.name,
          },
        },
      });

      if (!prepareData?.prepareUpload?.url) {
        throw new Error("Failed to get upload URL");
      }

      const uploadUrl = prepareData.prepareUpload.url;
      const uploadId = prepareData.prepareUpload.id;

      await fetch(uploadUrl, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": file.type,
        },
      });

      await uploadMutation({
        variables: {
          input: {
            displayName: documentName.trim(),
            fileId: uploadId,
            filePath: uploadUrl,
          },
        },
      });

      setDocumentName("");
      selectedFileRef.current = null;
      setSelectedFileName("");
    } catch (error) {
      logger.error("Upload failed:", { error });
    } finally {
      setUploading(false);
    }
  }, [documentName, prepareUploadMutation, uploadMutation, setDocumentName, setUploading, setDeleting]);

  const handleDeleteRequest = useCallback(
    (id: string) => {
      const resource = resources.find(r => r.id === id);
      if (resource) {
        openDeleteDialog(id, resource.title);
      }
    },
    [resources, openDeleteDialog]
  );

  const handleDeleteCancel = useCallback(() => {
    closeDeleteDialog();
  }, [closeDeleteDialog]);

  const handleDeleteConfirm = useCallback(async () => {
    if (!pendingDeleteId) return;

    setDeleting(true);

    try {
      await deleteMutation({ variables: { id: pendingDeleteId } });
      closeDeleteDialog();
    } catch (error) {
      logger.error("Delete failed:", { error });
    } finally {
      setDeleting(false);
    }
  }, [pendingDeleteId, deleteMutation, closeDeleteDialog, setDeleting]);

  const handleCardClick = useCallback(
    (id: string) => {
      const resource = resources.find(r => r.id === id);
      if (resource) {
        window.open(resource.filePath, "_blank");
      }
    },
    [resources]
  );

  return {
    labels: t,
    resources,
    searchQuery,
    filterType,
    sortBy,
    pendingDeleteId,
    pendingDeleteTitle,
    isUploading: uploading || isUploading,
    isDeleting: deleting || isDeleting,
    canManage,
    documentName,
    selectedFileName,
    onSearchChange: setSearchQuery,
    onFilterTypeChange: setFilterType,
    onSortByChange: setSortBy,
    onDocumentNameChange: setDocumentName,
    onFormSubmit: handleFormSubmit,
    onFileSelect: handleFileSelect,
    onUpload: () => {}, // Not used since handleFormSubmit handles upload
    onDeleteRequest: handleDeleteRequest,
    onDeleteCancel: handleDeleteCancel,
    onDeleteConfirm: handleDeleteConfirm,
    onCardClick: handleCardClick,
    // NEW FOR PLAN v5: lifted permission booleans consumed by the tier card components.
    canResourcesList,
    canResourcesDelete,
  };
}
