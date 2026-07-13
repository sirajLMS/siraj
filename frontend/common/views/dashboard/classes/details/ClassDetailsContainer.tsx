"use client";

import { useViewport } from "@/frontend/common/hooks/useViewport";
import { useClassDetailsViewModel } from "@/frontend/common/views/dashboard/classes/details/hooks/useClassDetailsViewModel";
import { ClassDetailsContainerDesktop } from "@/frontend/desktop/views/dashboard/classes/details/classDetailsContainer.desktop";
import { ClassDetailsContainerMobile } from "@/frontend/mobile/views/dashboard/classes/details/classDetailsContainer.mobile";

export function ClassDetailsContainer() {
  const viewModel = useClassDetailsViewModel();
  const { isMobile } = useViewport();
  return isMobile ? (
    <ClassDetailsContainerMobile viewModel={viewModel} />
  ) : (
    <ClassDetailsContainerDesktop viewModel={viewModel} />
  );
}
