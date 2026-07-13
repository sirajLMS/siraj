"use client";

import { useViewport } from "@/frontend/common/hooks/useViewport";
import { ClassDetailsContainerDesktop } from "@/frontend/desktop/views/dashboard/classes/details/classDetailsContainer.desktop";
import { ClassDetailsContainerMobile } from "@/frontend/mobile/views/dashboard/classes/details/classDetailsContainer.mobile";
import { useClassDetailsViewModel } from "@/frontend/views/dashboard/classes/details/hooks/useClassDetailsViewModel";

export function ClassDetailsContainer() {
  const viewModel = useClassDetailsViewModel();
  const { isMobile } = useViewport();
  return isMobile ? (
    <ClassDetailsContainerMobile viewModel={viewModel} />
  ) : (
    <ClassDetailsContainerDesktop viewModel={viewModel} />
  );
}
