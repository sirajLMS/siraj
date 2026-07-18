"use client";

import { useNotifications } from "@toolpad/core/useNotifications";
import type * as React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useAppTranslation } from "@/shared/locale";

// NEW FOR PLAN v5: migrated hook from
//   frontend/{mobile,desktop}/components/ui/input/catalogImageUpload/*.{m,d}.tsx
//   and frontend/common/components/ui/input/catalogImageUpload/CatalogImageUpload.tsx
//   to frontend/common/hooks/ to satisfy specs.md §2.4 allowlist + §3 N25 (functions
//   named `use[A-Z]` declared in tier files forbidden) and §3 N17
//   (`useNotifications`/`@toolpad` forbidden in tier files). The three tier/common
//   payload components now import this single hook so ownership of `useState`,
//   `useEffect`, `useRef`, and `useNotifications` lives outside tier renderers.

export const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export const DEFAULT_MAX_SIZE_MB = 2;
export const BYTES_PER_MB = 1024 * 1024;

export type UploadState = "idle" | "uploading" | "ready" | "error";

export type ImageUploadHookParams = {
  readonly onImageUrlChangeAction?: (url: string | null) => void;
  readonly onUploadAction?: (file: File) => Promise<{ url: string; filePath?: string }>;
  readonly onFilePathChangeAction?: (filePath: string | null) => void;
  readonly maxSizeMb?: number;
};

export type UseImageUploadResult = {
  readonly previewUrl: string | null;
  readonly uploadState: UploadState;
  readonly localError: string | null;
  readonly isUploading: boolean;
  readonly handleFileSelect: (event: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  readonly handleRemove: () => void;
  readonly handleUrlChange: (value: string) => void;
};

export function useImageUpload(params: ImageUploadHookParams): UseImageUploadResult {
  const { onImageUrlChangeAction, onUploadAction, onFilePathChangeAction, maxSizeMb = DEFAULT_MAX_SIZE_MB } = params;
  const t = useAppTranslation().uiTranslations.catalogImageUpload;
  const notifications = useNotifications();
  const objectUrlRef = useRef<string | null>(null);

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadState, setUploadState] = useState<UploadState>("idle");
  const [localError, setLocalError] = useState<string | null>(null);

  const maxBytes = maxSizeMb * BYTES_PER_MB;

  useEffect(() => {
    return () => {
      if (objectUrlRef.current !== null) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
    };
  }, []);

  const setLocalPreview = useCallback((file: File) => {
    if (objectUrlRef.current !== null) {
      URL.revokeObjectURL(objectUrlRef.current);
    }
    const url = URL.createObjectURL(file);
    objectUrlRef.current = url;
    setPreviewUrl(url);
  }, []);

  const handleFileSelect = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      event.target.value = "";
      if (!file) {
        return;
      }

      setLocalError(null);

      if (!ACCEPTED_TYPES.includes(file.type as (typeof ACCEPTED_TYPES)[number])) {
        const message = t.invalidType;
        setLocalError(message);
        notifications.show(message, { severity: "error" });
        return;
      }

      if (file.size > maxBytes) {
        const message = t.fileTooLarge(maxSizeMb);
        setLocalError(message);
        notifications.show(message, { severity: "error" });
        return;
      }

      setLocalPreview(file);

      if (!onUploadAction) {
        return;
      }

      setUploadState("uploading");
      try {
        const result = await onUploadAction(file);
        onImageUrlChangeAction?.(result.url);
        onFilePathChangeAction?.(result.filePath ?? null);
        setUploadState("ready");
      } catch {
        const message = t.uploadFailed;
        setLocalError(message);
        notifications.show(message, { severity: "error" });
        setUploadState("error");
      }
    },
    [
      maxBytes,
      maxSizeMb,
      notifications,
      onFilePathChangeAction,
      onImageUrlChangeAction,
      onUploadAction,
      setLocalPreview,
      t,
    ]
  );

  const handleRemove = useCallback(() => {
    if (objectUrlRef.current !== null) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    setPreviewUrl(null);
    setLocalError(null);
    setUploadState("idle");
    onImageUrlChangeAction?.(null);
    onFilePathChangeAction?.(null);
  }, [onFilePathChangeAction, onImageUrlChangeAction]);

  const handleUrlChange = useCallback(
    (value: string) => {
      onImageUrlChangeAction?.(value === "" ? null : value);
      onFilePathChangeAction?.(null);
    },
    [onFilePathChangeAction, onImageUrlChangeAction]
  );

  return {
    previewUrl,
    uploadState,
    localError,
    isUploading: uploadState === "uploading",
    handleFileSelect,
    handleRemove,
    handleUrlChange,
  };
}
