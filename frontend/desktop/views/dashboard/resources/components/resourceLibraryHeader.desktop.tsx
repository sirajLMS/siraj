"use client";

import { ResourceLibraryHeaderShared } from "@/frontend/common/views/dashboard/resources/components/__shared__/resourceLibraryHeaderShared";
import type { ResourceLibraryHeaderProps } from "@/frontend/common/views/dashboard/resources/types/resourcesTypes";
import { DesktopFilterButton } from "@/frontend/desktop/components/ui/button";

export function ResourceLibraryHeaderDesktop(props: Readonly<ResourceLibraryHeaderProps>) {
  return <ResourceLibraryHeaderShared {...props} config={{ FilterButton: DesktopFilterButton }} />;
}
