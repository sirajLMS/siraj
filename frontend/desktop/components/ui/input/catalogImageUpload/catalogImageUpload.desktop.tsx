"use client";

import type * as React from "react";
import { CatalogImageUploadScaffold } from "@/frontend/common/components/ui/input/catalogImageUpload/catalogImageUploadShared";
import type { CatalogImageUploadSharedProps } from "@/frontend/common/components/ui/input/catalogImageUpload/types/catalogImageUploadShared.types";

export type CatalogImageUploadProps = CatalogImageUploadSharedProps;

const DESKTOP_SLOTS = {
  previewSize: 128,
  buttonLayout: "horizontal" as const,
  helperTextVariant: "bodyMd" as const,
  fileInputAriaLabel: true,
};

export const CatalogImageUploadDesktop: React.FC<CatalogImageUploadProps> = (props): React.ReactNode => (
  <CatalogImageUploadScaffold props={{ ...props, previewShape: "square" }} slots={DESKTOP_SLOTS} />
);
