"use client";

import { useMutation, useQuery } from "@apollo/client/react";
import { useCallback, useMemo, useRef, useState } from "react";
import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql-types";
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
import { type ResourcesLabels, Translation, useAppTranslation } from "@/shared/locale";

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

function resolveResourceFileType(contentType: string): LearningResourceRow["fileType"] {
  if (contentType.startsWith("pdf")) return "pdf";
  if (contentType.startsWith("pptx") || contentType.includes("presentation")) return "pptx";
  if (contentType.startsWith("xlsx") || contentType.includes("spreadsheet")) return "xlsx";
  if (contentType.startsWith("docx") || contentType.includes("word") || contentType.includes("msword")) return "docx";
  return "pdf";
}

function useResourcePermissions(): { canResourcesList: boolean; canResourcesDelete: boolean } {
  // NEW FOR PLAN v5: read the user's permissions ONCE in the ViewModel and
  // expose boolean gates. Tier resource-library card components no longer
  // import `RequirePermission` (specs.md §3 N3).
  const hasPermission = useUserStore(state => state.hasPermission);
  const canResourcesList = hasPermission(AppPermission.ResourcesList);
  const canResourcesDelete = hasPermission(AppPermission.ResourcesDelete);
  return { canResourcesList, canResourcesDelete };
}

function useResourcesQuery(searchQuery: string): LearningResourceRow[] {
  const { data } = useQuery(learningResourcesQueryDocument, {
    variables: { searchQuery: searchQuery || null },
    fetchPolicy: "cache-and-network",
  });
  return useMemo(() => {
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
      return {
        id: resource.id ?? "",
        title: resource.displayName ?? "",
        fileName: resource.filePath?.split("/").pop() ?? resource.displayName ?? "",
        filePath: resource.filePath ?? "",
        fileType: resolveResourceFileType(contentType),
        uploadedAt: resource.createdAt ?? "",
        uploadedAtTimestamp: resource.createdAt ? new Date(resource.createdAt).getTime() : 0,
      };
    });
  }, [data]);
}

interface FileSelection {
  readonly selectedFileName: string;
  readonly selectedFileRef: React.RefObject<File | null>;
  readonly setSelectedFileName: (value: string) => void;
  readonly onFileSelect: (file: File) => void;
}

function useFileSelection(): FileSelection {
  const selectedFileRef = useRef<File | null>(null);
  const [selectedFileName, setSelectedFileName] = useState("");
  const onFileSelect = useCallback((file: File) => {
    selectedFileRef.current = file;
    setSelectedFileName(file.name);
  }, []);
  return { selectedFileName, selectedFileRef, setSelectedFileName, onFileSelect };
}

interface PreparedUpload {
  readonly uploadUrl: string;
  readonly uploadId: string;
}

type UploadPreparation = { readonly url?: string | null; readonly id?: string | null } | null | undefined;

function assertPreparedUpload(value: UploadPreparation): PreparedUpload {
  if (!value?.url || !value.id) {
    throw new Error("Failed to get upload URL");
  }
  return { uploadUrl: value.url, uploadId: value.id };
}

async function pushFileToStorage(file: File, uploadUrl: string): Promise<void> {
  await fetch(uploadUrl, {
    method: "PUT",
    body: file,
    headers: { "Content-Type": file.type },
  });
}

interface UploadHandlers {
  readonly uploading: boolean;
  readonly handleFormSubmit: () => Promise<void>;
}

function useUploadMutations() {
  const [uploadMutation, { loading: uploading }] = useMutation(uploadLearningResourceMutationDocument);
  const [prepareUploadMutation] = useMutation(prepareUploadMutationDocument);
  return { uploading, uploadMutation, prepareUploadMutation };
}

function useUploadHandlers(params: {
  readonly documentName: string;
  readonly selectedFileRef: React.RefObject<File | null>;
  readonly setSelectedFileName: (value: string) => void;
  readonly setUploading: (value: boolean) => void;
  readonly setDeleting: (value: boolean) => void;
  readonly setDocumentName: (value: string) => void;
}): UploadHandlers {
  const { documentName, selectedFileRef, setSelectedFileName, setUploading, setDeleting, setDocumentName } = params;
  const { uploading, uploadMutation, prepareUploadMutation } = useUploadMutations();

  const resetFormState = useCallback(() => {
    setDocumentName("");
    selectedFileRef.current = null;
    setSelectedFileName("");
  }, [setDocumentName, selectedFileRef, setSelectedFileName]);

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
          input: { contentHash: "", contentType: file.type, fileSize: file.size, path: file.name },
        },
      });
      const { uploadUrl, uploadId } = assertPreparedUpload(prepareData?.prepareUpload);

      await pushFileToStorage(file, uploadUrl);
      await uploadMutation({
        variables: {
          input: { displayName: documentName.trim(), fileId: uploadId, filePath: uploadUrl },
        },
      });
      resetFormState();
    } catch (error) {
      logger.error("Upload failed:", { error });
    } finally {
      setUploading(false);
    }
  }, [documentName, prepareUploadMutation, uploadMutation, setUploading, setDeleting, selectedFileRef, resetFormState]);

  return { uploading, handleFormSubmit };
}

interface DeleteHandlers {
  readonly onDeleteRequest: (id: string) => void;
  readonly onDeleteCancel: () => void;
  readonly onDeleteConfirm: () => Promise<void>;
  readonly deleting: boolean;
}

function useDeleteMutation() {
  return useMutation(deleteLearningResourceMutationDocument);
}

function useDeleteCallbacks(params: {
  readonly pendingDeleteId: string | null;
  readonly closeDeleteDialog: () => void;
  readonly setDeleting: (value: boolean) => void;
  readonly deleteMutation: ReturnType<typeof useDeleteMutation>[0];
}): { onDeleteConfirm: () => Promise<void> } {
  const { pendingDeleteId, closeDeleteDialog, setDeleting, deleteMutation } = params;
  return {
    onDeleteConfirm: useCallback(async () => {
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
    }, [pendingDeleteId, deleteMutation, closeDeleteDialog, setDeleting]),
  };
}

function useDeleteRequest(
  resources: readonly LearningResourceRow[],
  openDeleteDialog: (id: string, title: string) => void
): (id: string) => void {
  return useCallback(
    (id: string) => {
      const resource = resources.find(r => r.id === id);
      if (resource) {
        openDeleteDialog(id, resource.title);
      }
    },
    [resources, openDeleteDialog]
  );
}

function useDeleteHandlers(params: {
  readonly resources: readonly LearningResourceRow[];
  readonly pendingDeleteId: string | null;
  readonly openDeleteDialog: (id: string, title: string) => void;
  readonly closeDeleteDialog: () => void;
  readonly setDeleting: (value: boolean) => void;
}): DeleteHandlers {
  const { resources, pendingDeleteId, openDeleteDialog, closeDeleteDialog, setDeleting } = params;
  const [deleteMutation, { loading: deleting }] = useDeleteMutation();

  const onDeleteRequest = useDeleteRequest(resources, openDeleteDialog);
  const onDeleteCancel = useCallback(() => {
    closeDeleteDialog();
  }, [closeDeleteDialog]);
  const { onDeleteConfirm } = useDeleteCallbacks({
    pendingDeleteId,
    closeDeleteDialog,
    setDeleting,
    deleteMutation,
  });

  return { onDeleteRequest, onDeleteCancel, onDeleteConfirm, deleting };
}

function useCardClick(resources: readonly LearningResourceRow[]): (id: string) => void {
  return useCallback(
    (id: string) => {
      const resource = resources.find(r => r.id === id);
      if (resource) {
        window.open(resource.filePath, "_blank");
      }
    },
    [resources]
  );
}

interface ResourceStoreSlice {
  readonly searchQuery: string;
  readonly filterType: ResourceFilterType;
  readonly sortBy: ResourceSortBy;
  readonly pendingDeleteId: string | null;
  readonly pendingDeleteTitle: string | null;
  readonly isUploading: boolean;
  readonly isDeleting: boolean;
  readonly canManage: boolean;
  readonly documentName: string;
  readonly setDocumentName: (value: string) => void;
  readonly setSearchQuery: (value: string) => void;
  readonly setFilterType: (value: ResourceFilterType) => void;
  readonly setSortBy: (value: ResourceSortBy) => void;
  readonly openDeleteDialog: (id: string, title: string) => void;
  readonly closeDeleteDialog: () => void;
  readonly setUploading: (value: boolean) => void;
  readonly setDeleting: (value: boolean) => void;
}

function useLearningResourcesStoreSlice(): ResourceStoreSlice {
  return useLearningResourcesStore();
}

function buildResourcesViewModel(params: {
  readonly t: ResourcesLabels;
  readonly resources: readonly LearningResourceRow[];
  readonly store: ResourceStoreSlice;
  readonly selectedFileName: string;
  readonly uploadMutationLoading: boolean;
  readonly deleteMutationLoading: boolean;
  readonly handleFormSubmit: () => Promise<void>;
  readonly onFileSelect: (file: File) => void;
  readonly onDeleteRequest: (id: string) => void;
  readonly onDeleteCancel: () => void;
  readonly onDeleteConfirm: () => Promise<void>;
  readonly onCardClick: (id: string) => void;
  readonly canResourcesList: boolean;
  readonly canResourcesDelete: boolean;
}): ResourcesViewModel {
  const {
    t,
    resources,
    store,
    selectedFileName,
    uploadMutationLoading,
    deleteMutationLoading,
    handleFormSubmit,
    onFileSelect,
    onDeleteRequest,
    onDeleteCancel,
    onDeleteConfirm,
    onCardClick,
    canResourcesList,
    canResourcesDelete,
  } = params;
  return {
    labels: t,
    resources,
    searchQuery: store.searchQuery,
    filterType: store.filterType,
    sortBy: store.sortBy,
    pendingDeleteId: store.pendingDeleteId,
    pendingDeleteTitle: store.pendingDeleteTitle,
    isUploading: uploadMutationLoading || store.isUploading,
    isDeleting: deleteMutationLoading || store.isDeleting,
    canManage: store.canManage,
    documentName: store.documentName,
    selectedFileName,
    onSearchChange: store.setSearchQuery,
    onFilterTypeChange: store.setFilterType,
    onSortByChange: store.setSortBy,
    onDocumentNameChange: store.setDocumentName,
    onFormSubmit: handleFormSubmit,
    onFileSelect,
    onUpload: () => {}, // Not used since handleFormSubmit handles upload
    onDeleteRequest,
    onDeleteCancel,
    onDeleteConfirm,
    onCardClick,
    // NEW FOR PLAN v5: lifted permission booleans consumed by the tier card components.
    canResourcesList,
    canResourcesDelete,
  };
}

export function useResourcesViewModel(_props: Readonly<UseResourcesViewModelProps>): ResourcesViewModel {
  const t = useAppTranslation(Translation.Dashboard.Resources);
  const { canResourcesList, canResourcesDelete } = useResourcePermissions();
  const store = useLearningResourcesStoreSlice();

  const resources = useResourcesQuery(store.searchQuery);
  const { selectedFileName, selectedFileRef, setSelectedFileName, onFileSelect } = useFileSelection();
  const { uploading: uploadMutationLoading, handleFormSubmit } = useUploadHandlers({
    documentName: store.documentName,
    selectedFileRef,
    setSelectedFileName,
    setUploading: store.setUploading,
    setDeleting: store.setDeleting,
    setDocumentName: store.setDocumentName,
  });
  const {
    onDeleteRequest,
    onDeleteCancel,
    onDeleteConfirm,
    deleting: deleteMutationLoading,
  } = useDeleteHandlers({
    resources,
    pendingDeleteId: store.pendingDeleteId,
    openDeleteDialog: store.openDeleteDialog,
    closeDeleteDialog: store.closeDeleteDialog,
    setDeleting: store.setDeleting,
  });
  const onCardClick = useCardClick(resources);

  return buildResourcesViewModel({
    t,
    resources,
    store,
    selectedFileName,
    uploadMutationLoading,
    deleteMutationLoading,
    handleFormSubmit,
    onFileSelect,
    onDeleteRequest,
    onDeleteCancel,
    onDeleteConfirm,
    onCardClick,
    canResourcesList,
    canResourcesDelete,
  });
}
