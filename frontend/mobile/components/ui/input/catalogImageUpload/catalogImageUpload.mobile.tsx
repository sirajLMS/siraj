"use client";

import type * as React from "react";
import { CatalogImageUploadScaffold } from "@/frontend/common/components/ui/input/catalogImageUpload/catalogImageUploadShared";
import type {
  CatalogImageUploadSharedProps,
  CatalogImageUploadSlotProps,
} from "@/frontend/common/components/ui/input/catalogImageUpload/types/catalogImageUploadShared.types";
import { MobileContentStack } from "@/frontend/mobile/components/ui/container";

export type CatalogImageUploadProps = CatalogImageUploadSharedProps;

function MobileContainer({ children }: Readonly<{ children: React.ReactNode }>): React.ReactNode {
  return (
    <MobileContentStack gap={1.5} paddingBottom={0}>
      {children}
    </MobileContentStack>
  );
}

const MOBILE_SLOTS: CatalogImageUploadSlotProps = {
  ContainerWrapper: MobileContainer,
  previewSize: 128,
  buttonLayout: "fullWidth",
  helperTextVariant: "bodyMd",
  fileInputAriaLabel: true,
  urlFieldSize: "small",
  urlFieldFullWidth: true,
};

export const CatalogImageUploadMobile: React.FC<CatalogImageUploadProps> = (props): React.ReactNode => (
  <CatalogImageUploadScaffold props={{ ...props, previewShape: "square" }} slots={MOBILE_SLOTS} />
);
