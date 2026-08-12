"use client";

import { createResourceUploadForm } from "@/frontend/common/views/dashboard/resources/components/__shared__/resourceUploadFormShared";
import { MobilePrimaryPageAction } from "@/frontend/mobile/components/ui";
import { ResourceUploadDropzoneMobile } from "@/frontend/mobile/views/dashboard/resources/components/resourceUploadDropzone.mobile";

export const ResourceUploadFormMobile = createResourceUploadForm({
  gap: 3,
  actionPaddingY: 1.75,
  PrimaryAction: MobilePrimaryPageAction,
  Dropzone: ResourceUploadDropzoneMobile,
});
