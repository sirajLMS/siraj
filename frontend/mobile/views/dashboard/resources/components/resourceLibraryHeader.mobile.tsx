"use client";

import { ResourceLibraryHeaderShared } from "@/frontend/common/views/dashboard/resources/components/__shared__/resourceLibraryHeaderShared";
import type { ResourceLibraryHeaderProps } from "@/frontend/common/views/dashboard/resources/types/resourcesTypes";
import { MobileFilterButton } from "@/frontend/mobile/components/ui";

export function ResourceLibraryHeaderMobile(props: Readonly<ResourceLibraryHeaderProps>) {
  return <ResourceLibraryHeaderShared {...props} config={{ FilterButton: MobileFilterButton }} />;
}
