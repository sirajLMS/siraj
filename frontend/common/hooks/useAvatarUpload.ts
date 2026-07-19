"use client";

import { useMutation } from "@apollo/client/react";
import { useCallback } from "react";
import { prepareUploadMutationDocument } from "@/frontend/common/graphql/sharedDocuments/resources/learning-resource.documents";
import { uploadAvatarFile } from "@/frontend/common/views/dashboard/profile/shared/uploadAvatarFile";

export type UseAvatarUploadParams = {
  readonly storageOwnerKey: string;
};

export type UseAvatarUploadResult = {
  readonly onUploadAvatar: (file: File) => Promise<{ url: string }>;
};

export function useAvatarUpload(params: UseAvatarUploadParams): UseAvatarUploadResult {
  const [prepareUploadMutation] = useMutation(prepareUploadMutationDocument);

  const onUploadAvatar = useCallback(
    async (file: File): Promise<{ url: string }> => {
      return uploadAvatarFile({
        file,
        storageOwnerKey: params.storageOwnerKey,
        prepareUpload: options => prepareUploadMutation(options),
      });
    },
    [params.storageOwnerKey, prepareUploadMutation]
  );

  return { onUploadAvatar };
}
