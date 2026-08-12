"use client";

import { createResourceUploadForm } from "@/frontend/common/views/dashboard/resources/components/__shared__/resourceUploadFormShared";
import { DesktopPrimaryPageAction } from "@/frontend/desktop/components/ui/button";
import { ResourceUploadDropzoneDesktop } from "@/frontend/desktop/views/dashboard/resources/components/resourceUploadDropzone.desktop";

export const ResourceUploadFormDesktop = createResourceUploadForm({
  gap: 4,
  actionPaddingY: 2,
  PrimaryAction: DesktopPrimaryPageAction,
  Dropzone: ResourceUploadDropzoneDesktop,
});
