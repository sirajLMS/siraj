"use client";

import { useMutation } from "@apollo/client/react";
import { useCallback } from "react";
import { prepareUploadMutationDocument } from "@/frontend/common/graphql/sharedDocuments/resources/learning-resource.documents";
import { uploadAppearanceLogoFile } from "@/frontend/common/views/dashboard/appearance/shared/uploadAppearanceLogoFile";

/**
 * Hook returning an `uploadLogo(file)` callback for the appearance
 * customizer's `LogoUploadSection`.
 *
 * Wraps the `prepareUpload` GraphQL mutation + the
 * `uploadAppearanceLogoFile` helper (signed-URL PUT or Vercel Blob
 * client upload). Returns the canonical public URL of the stored logo.
 *
 * Reused pattern: `useAvatarUpload` (`frontend/common/hooks/useAvatarUpload.ts`).
 */
export function useAppearanceLogoUpload(): {
  readonly uploadLogo: (file: File) => Promise<{ url: string; path: string }>;
} {
  const [prepareUploadMutation] = useMutation(prepareUploadMutationDocument);

  const uploadLogo = useCallback(
    async (file: File): Promise<{ url: string; path: string }> => {
      return uploadAppearanceLogoFile({
        file,
        prepareUpload: options => prepareUploadMutation(options),
      });
    },
    [prepareUploadMutation]
  );

  return { uploadLogo };
}
