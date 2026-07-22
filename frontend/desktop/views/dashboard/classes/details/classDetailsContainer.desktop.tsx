"use client";

import { ClassDetailsContainerBody } from "@/frontend/common/views/dashboard/classes/details/components/classDetailsContainerBody";
import type { ClassDetailsViewModel } from "@/frontend/common/views/dashboard/classes/details/hooks/useClassDetailsViewModel";
import { DesktopPageContainer } from "@/frontend/desktop/components/ui";
import { ClassDetailsContentDesktop } from "@/frontend/desktop/views/dashboard/classes/details/components/classDetailsContent.desktop";

export function ClassDetailsContainerDesktop({ viewModel }: { readonly viewModel: ClassDetailsViewModel }) {
  return (
    <ClassDetailsContainerBody
      viewModel={viewModel}
      slots={{ PageContainer: DesktopPageContainer, ClassDetailsContent: ClassDetailsContentDesktop }}
    />
  );
}
