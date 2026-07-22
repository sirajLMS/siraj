"use client";

import { ClassDetailsContainerBody } from "@/frontend/common/views/dashboard/classes/details/components/classDetailsContainerBody";
import type { ClassDetailsViewModel } from "@/frontend/common/views/dashboard/classes/details/hooks/useClassDetailsViewModel";
import { MobilePageContainer } from "@/frontend/mobile/components/ui";
import { ClassDetailsContentMobile } from "@/frontend/mobile/views/dashboard/classes/details/components/classDetailsContent.mobile";

export function ClassDetailsContainerMobile({ viewModel }: { readonly viewModel: ClassDetailsViewModel }) {
  return (
    <ClassDetailsContainerBody
      viewModel={viewModel}
      slots={{ PageContainer: MobilePageContainer, ClassDetailsContent: ClassDetailsContentMobile }}
    />
  );
}
