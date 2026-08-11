// Canonical home for catalogImageUpload UI-primitive types per the one-per-contract rule.
// Both common (viewport-agnostic), desktop and mobile tier files import from this location.

import type * as React from "react";

export type CatalogImageUploadPreviewShape = "square" | "circle";

export type CatalogImageUploadSharedProps = {
  readonly imageUrl?: string | null;
  readonly onImageUrlChangeAction?: (url: string | null) => void;
  readonly onUploadAction?: (file: File) => Promise<{ url: string; filePath?: string }>;
  readonly onFilePathChangeAction?: (filePath: string | null) => void;
  readonly label?: string;
  readonly disabled?: boolean;
  readonly maxSizeMb?: number;
  readonly allowUrlFallback?: boolean;
  readonly helperText?: string;
  readonly error?: boolean;
  readonly errorMessage?: string;
  /** `"circle"` for avatars; default square for catalog logos. Mobile tier ignores this (always square). */
  readonly previewShape?: CatalogImageUploadPreviewShape;
};

export type CatalogImageUploadButtonLayout = "horizontal" | "vertical" | "fullWidth";

export interface CatalogImageUploadSlotProps {
  /** Optional container wrapper slot (mobile passes MobileContentStack; default tier passes undefined which renders a plain Box). */
  readonly ContainerWrapper?: React.ComponentType<{ children: React.ReactNode }>;
  /** Preview box size in px (common: 96, desktop/mobile: 128). */
  readonly previewSize?: number;
  /** Button `size` prop — "small" for common/mobile, omitted for desktop. */
  readonly buttonSize?: "small" | "medium" | "large";
  /** Upload button layout: "horizontal" side-by-side, "vertical" stacked, "fullWidth" stretched side-by-side. */
  readonly buttonLayout?: CatalogImageUploadButtonLayout;
  /** Typography variant for the helper text ("bodySm" for common, "bodyMd" for desktop/mobile). */
  readonly helperTextVariant?: "bodySm" | "bodyMd";
  /** Whether to render `aria-label` on the hidden file input (common: true, desktop/mobile: true). */
  readonly fileInputAriaLabel?: boolean;
  /** Whether URL fallback TextField should be `size="small"` (mobile only). */
  readonly urlFieldSize?: "small" | "medium";
  /** Whether URL fallback TextField should be `fullWidth` (mobile only). */
  readonly urlFieldFullWidth?: boolean;
}

export type PreviewBoxProps = {
  readonly previewUrl: string | null;
  readonly label: string | undefined;
  readonly showError: boolean;
  readonly isUploading: boolean;
  readonly previewAlt: string;
  readonly previewShape: CatalogImageUploadPreviewShape;
  readonly previewSize: number;
};

export type UploadButtonsProps = {
  readonly onUploadClick: () => void;
  readonly onRemoveClick: () => void;
  readonly disabled: boolean;
  readonly isUploading: boolean;
  readonly hasPreview: boolean;
  readonly uploadLabel: string;
  readonly uploadingLabel: string;
  readonly removeLabel: string;
  readonly buttonSize?: "small" | "medium" | "large";
  readonly buttonLayout: CatalogImageUploadButtonLayout;
};

export type ErrorDisplayProps = {
  readonly errorMessage: string;
};

export type UrlFallbackFieldProps = {
  readonly imageUrl: string | null;
  readonly onUrlChange: (value: string) => void;
  readonly disabled: boolean;
  readonly showError: boolean;
  readonly errorMessage: string | null;
  readonly label: string | undefined;
  readonly optionalLabel: string | undefined;
  readonly urlFieldSize?: "small" | "medium";
  readonly urlFieldFullWidth?: boolean;
};
