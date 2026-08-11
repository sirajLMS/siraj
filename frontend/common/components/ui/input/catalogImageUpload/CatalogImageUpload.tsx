"use client";

import type * as React from "react";
import { CatalogImageUploadScaffold } from "@/frontend/common/components/ui/input/catalogImageUpload/catalogImageUploadShared";
import type { CatalogImageUploadSharedProps } from "@/frontend/common/components/ui/input/catalogImageUpload/types/catalogImageUploadShared.types";

export type CatalogImageUploadProps = CatalogImageUploadSharedProps;

const DEFAULT_PREVIEW_SHAPE = "square" as const;

export const CatalogImageUpload: React.FC<CatalogImageUploadProps> = (props): React.ReactNode => (
  <CatalogImageUploadScaffold props={{ ...props, previewShape: props.previewShape ?? DEFAULT_PREVIEW_SHAPE }} />
);
