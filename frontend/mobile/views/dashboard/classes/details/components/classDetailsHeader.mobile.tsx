"use client";

import { Box } from "@mui/material";
import { classDetailsContentPaddingSx } from "@/frontend/common/views/dashboard/classes/details/classDetailsMobileLayout";
import type { ClassDetailsHeaderProps } from "@/frontend/common/views/dashboard/classes/details/types";
import { getLocalizedClassTypeName } from "@/frontend/common/views/dashboard/classes/details/utils/localizedClassTypeName";
import { MobilePageHeader } from "@/frontend/mobile/components/ui";

export function ClassDetailsHeaderMobile({ instance, canOverride, labels }: Readonly<ClassDetailsHeaderProps>) {
  const title = getLocalizedClassTypeName(instance.classType, labels.classTypes, instance.courseName);

  return (
    <Box sx={classDetailsContentPaddingSx}>
      <MobilePageHeader
        title={title}
        subtitle={canOverride ? labels.pageSubtitleAdmin : labels.pageSubtitleTeacher}
        titleVariant="headlineMd"
        breadcrumbs={undefined}
      />
    </Box>
  );
}
