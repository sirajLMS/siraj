"use client";

import { ResourceUploadGuidelinesShared } from "@/frontend/common/views/dashboard/resources/components/__shared__/resourceUploadGuidelinesShared";
import type { ResourceUploadGuidelinesProps } from "@/frontend/common/views/dashboard/resources/types/resourcesTypes";

export function ResourceUploadGuidelinesDesktop({ labels }: Readonly<ResourceUploadGuidelinesProps>) {
  return <ResourceUploadGuidelinesShared labels={labels} config={{ padding: 3 }} />;
}
