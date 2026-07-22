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

type TranslationBundle = ReturnType<typeof useAppTranslation>["uiTranslations"]["catalogImageUpload"];

type NotifyFn = (message: string, options: { severity: "error" | "warning" | "info" | "success" }) => void;

const isAcceptedType = (fileType: string): fileType is (typeof ACCEPTED_TYPES)[number] =>
  (ACCEPTED_TYPES as readonly string[]).includes(fileType);

const validateFileType = (file: File, t: TranslationBundle, notify: NotifyFn): string | null => {
  if (!isAcceptedType(file.type)) {
    const message = t.invalidType;
    notify(message, { severity: "error" });
    return message;
  }
  return null;
};

const validateFileSize = (
  file: File,
  maxBytes: number,
  maxSizeMb: number,
  t: TranslationBundle,
  notify: NotifyFn
): string | null => {
  if (file.size > maxBytes) {
    const message = t.fileTooLarge(maxSizeMb);
    notify(message, { severity: "error" });
    return message;
  }
  return null;
};

const performUpload = async (
  file: File,
  onUploadAction: (file: File) => Promise<{ url: string; filePath?: string }>,
  onImageUrlChangeAction: ((url: string | null) => void) | undefined,
  onFilePathChangeAction: ((filePath: string | null) => void) | undefined
): Promise<"ready" | "error"> => {
  try {
    const result = await onUploadAction(file);
    onImageUrlChangeAction?.(result.url);
    onFilePathChangeAction?.(result.filePath ?? null);
    return "ready";
  } catch {
    return "error";
  }
};

const reportUploadError = (t: TranslationBundle, notify: NotifyFn): string => {
  const message = t.uploadFailed;
  notify(message, { severity: "error" });
  return message;
};

type SelectResult =
  | { kind: "skip" }
  | { kind: "invalidType"; message: string }
  | { kind: "invalidSize"; message: string }
  | { kind: "readyToUpload"; file: File };

const buildSelectResult = (
  event: React.ChangeEvent<HTMLInputElement>,
  maxBytes: number,
  maxSizeMb: number,
  t: TranslationBundle,
  notify: NotifyFn
): SelectResult => {
  const file = event.target.files?.[0];
  event.target.value = "";
  if (!file) {
    return { kind: "skip" };
  }

  const typeError = validateFileType(file, t, notify);
  if (typeError !== null) {
    return { kind: "invalidType", message: typeError };
  }

  const sizeError = validateFileSize(file, maxBytes, maxSizeMb, t, notify);
  if (sizeError !== null) {
    return { kind: "invalidSize", message: sizeError };
  }

  return { kind: "readyToUpload", file };
};

type StateSetters = {
  readonly setPreviewUrl: (value: string | null) => void;
  readonly setLocalError: (value: string | null) => void;
  readonly setUploadState: (state: UploadState) => void;
};

type UrlChangeHandlers = {
  readonly onImageUrlChangeAction?: (url: string | null) => void;
  readonly onFilePathChangeAction?: (filePath: string | null) => void;
};

const resetPreviewState = (setters: StateSetters, revokeObjectUrl: () => void, handlers: UrlChangeHandlers): void => {
  revokeObjectUrl();
  setters.setPreviewUrl(null);
  setters.setLocalError(null);
  setters.setUploadState("idle");
  handlers.onImageUrlChangeAction?.(null);
  handlers.onFilePathChangeAction?.(null);
};

const createHandleUrlChange =
  (handlers: UrlChangeHandlers) =>
  (value: string): void => {
    handlers.onImageUrlChangeAction?.(value === "" ? null : value);
    handlers.onFilePathChangeAction?.(null);
  };

const emitUrlChange = (handlers: UrlChangeHandlers, value: string): void => createHandleUrlChange(handlers)(value);

type ObjectPreviewApi = {
  readonly objectUrlRef: React.RefObject<string | null>;
  readonly previewUrl: string | null;
  readonly revokeObjectUrl: () => void;
  readonly setLocalPreview: (file: File) => void;
  readonly setPreviewUrl: (value: string | null) => void;
};

const useObjectPreviewState = (): ObjectPreviewApi => {
  const objectUrlRef = useRef<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const revokeObjectUrl = useCallback(() => {
    if (objectUrlRef.current !== null) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      revokeObjectUrl();
    };
  }, [revokeObjectUrl]);

  const setLocalPreview = useCallback(
    (file: File) => {
      revokeObjectUrl();
      const url = URL.createObjectURL(file);
      objectUrlRef.current = url;
      setPreviewUrl(url);
    },
    [revokeObjectUrl]
  );

  return { objectUrlRef, previewUrl, revokeObjectUrl, setLocalPreview, setPreviewUrl };
};

type FileSelectDeps = {
  readonly maxBytes: number;
  readonly maxSizeMb: number;
  readonly t: TranslationBundle;
  readonly notify: NotifyFn;
  readonly onUploadAction?: (file: File) => Promise<{ url: string; filePath?: string }>;
  readonly onImageUrlChangeAction?: (url: string | null) => void;
  readonly onFilePathChangeAction?: (filePath: string | null) => void;
  readonly setLocalError: (value: string | null) => void;
  readonly setUploadState: (state: UploadState) => void;
  readonly setLocalPreview: (file: File) => void;
};

const applyFileSelectResult = async (result: SelectResult, deps: FileSelectDeps): Promise<void> => {
  switch (result.kind) {
    case "skip": {
      return;
    }
    case "invalidType":
    case "invalidSize": {
      deps.setLocalError(result.message);
      return;
    }
    case "readyToUpload": {
      deps.setLocalError(null);
      deps.setLocalPreview(result.file);
      if (!deps.onUploadAction) {
        return;
      }
      deps.setUploadState("uploading");
      const outcome = await performUpload(
        result.file,
        deps.onUploadAction,
        deps.onImageUrlChangeAction,
        deps.onFilePathChangeAction
      );
      applyUploadOutcome(outcome, deps.t, deps.notify, deps.setLocalError, deps.setUploadState);
    }
  }
};

const runFileSelect = async (event: React.ChangeEvent<HTMLInputElement>, deps: FileSelectDeps): Promise<void> => {
  const result = buildSelectResult(event, deps.maxBytes, deps.maxSizeMb, deps.t, deps.notify);
  return applyFileSelectResult(result, deps);
};

const applyUploadOutcome = (
  outcome: "ready" | "error",
  t: TranslationBundle,
  notify: NotifyFn,
  setLocalError: (value: string | null) => void,
  setUploadState: (state: UploadState) => void
): void => {
  if (outcome === "ready") {
    setUploadState("ready");
    return;
  }
  const errorMessage = reportUploadError(t, notify);
  setLocalError(errorMessage);
  setUploadState("error");
};

export function useImageUpload(params: ImageUploadHookParams): UseImageUploadResult {
  const { onImageUrlChangeAction, onUploadAction, onFilePathChangeAction, maxSizeMb = DEFAULT_MAX_SIZE_MB } = params;
  const t = useAppTranslation().uiTranslations.catalogImageUpload;
  const notifications = useNotifications();
  const notify = notifications.show.bind(notifications);

  const [uploadState, setUploadState] = useState<UploadState>("idle");
  const [localError, setLocalError] = useState<string | null>(null);

  const { previewUrl, revokeObjectUrl, setLocalPreview, setPreviewUrl } = useObjectPreviewState();

  const maxBytes = maxSizeMb * BYTES_PER_MB;

  const handleFileSelect = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>): Promise<void> =>
      runFileSelect(event, {
        maxBytes,
        maxSizeMb,
        t,
        notify,
        onUploadAction,
        onImageUrlChangeAction,
        onFilePathChangeAction,
        setLocalError,
        setUploadState,
        setLocalPreview,
      }),
    [maxBytes, maxSizeMb, notify, onFilePathChangeAction, onImageUrlChangeAction, onUploadAction, setLocalPreview, t]
  );

  const handleRemove = useCallback(
    () =>
      resetPreviewState({ setPreviewUrl, setLocalError, setUploadState }, revokeObjectUrl, {
        onImageUrlChangeAction,
        onFilePathChangeAction,
      }),
    [onFilePathChangeAction, onImageUrlChangeAction, setPreviewUrl, revokeObjectUrl]
  );

  const handleUrlChange = useCallback(
    (value: string) => emitUrlChange({ onImageUrlChangeAction, onFilePathChangeAction }, value),
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
