import { useMutation, useQuery } from "@apollo/client/react";
import { useCallback, useMemo, useRef, useState } from "react";
import {
  learningResourcesQueryDocument,
  prepareUploadMutationDocument,
  uploadLearningResourceMutationDocument,
} from "@/frontend/common/graphql/sharedDocuments";
import { safeOpenWindow } from "@/frontend/common/lib/safeOpenWindow";
import { logger } from "@/frontend/common/utils/logger";
import type { LearningResourceRow } from "@/frontend/common/views/dashboard/resources/types/resourcesTypes";

function resolveResourceFileType(contentType: string): LearningResourceRow["fileType"] {
  if (contentType.startsWith("pdf")) return "pdf";
  if (contentType.startsWith("pptx") || contentType.includes("presentation")) return "pptx";
  if (contentType.startsWith("xlsx") || contentType.includes("spreadsheet")) return "xlsx";
  if (contentType.startsWith("docx") || contentType.includes("word") || contentType.includes("msword")) return "docx";
  return "pdf";
}

export function useResourcesQuery(searchQuery: string): LearningResourceRow[] {
  const { data } = useQuery(learningResourcesQueryDocument, {
    variables: { searchQuery: searchQuery || null },
    fetchPolicy: "cache-and-network",
  });
  return useMemo(() => {
    return (data?.learningResources ?? []).map(resource => {
      const contentType = resource.contentType ?? "";
      return {
        id: resource.id ?? "",
        title: resource.displayName ?? "",
        fileName: resource.filePath?.split("/").pop() ?? resource.displayName ?? "",
        filePath: resource.filePath ?? "",
        // Clamp `fileType` to the canonical `ResourceFileType` union declared in `shared.types`.
        fileType: resolveResourceFileType(contentType),
        uploadedAt: resource.createdAt ?? "",
        uploadedAtTimestamp: resource.createdAt ? new Date(resource.createdAt).getTime() : 0,
      };
    });
  }, [data]);
}

export function useCardClick(resources: readonly LearningResourceRow[]): (id: string) => void {
  return useCallback(
    (id: string) => {
      const resource = resources.find(r => r.id === id);
      if (resource) {
        safeOpenWindow(resource.filePath);
      }
    },
    [resources]
  );
}

export interface FileSelection {
  readonly selectedFileName: string;
  readonly selectedFileRef: React.RefObject<File | null>;
  readonly setSelectedFileName: (value: string) => void;
  readonly onFileSelect: (file: File) => void;
}

export function useFileSelection(): FileSelection {
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

export interface UploadHandlers {
  readonly uploading: boolean;
  readonly handleFormSubmit: () => Promise<void>;
}

function useUploadMutations() {
  const [uploadMutation, { loading: uploading }] = useMutation(uploadLearningResourceMutationDocument);
  const [prepareUploadMutation] = useMutation(prepareUploadMutationDocument);
  return { uploading, uploadMutation, prepareUploadMutation };
}

export function useUploadHandlers(params: {
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
