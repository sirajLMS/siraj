"use client";

import { ResourceUploadDropzoneShared } from "@/frontend/common/views/dashboard/resources/components/__shared__/resourceUploadDropzoneShared";
import type { ResourceUploadDropzoneProps } from "@/frontend/common/views/dashboard/resources/types/resourcesTypes";

export function ResourceUploadDropzoneMobile(props: Readonly<Omit<ResourceUploadDropzoneProps, "variant">>) {
  return <ResourceUploadDropzoneShared {...props} config={{ padding: 4, iconFontSize: 40 }} />;
}
