"use client";

import { Box } from "@mui/material";
import { classDetailsContentPaddingSx } from "@/frontend/common/views/dashboard/classes/details/classDetailsMobileLayout";
import type { ClassDetailsHeaderProps } from "@/frontend/common/views/dashboard/classes/details/types";
import { getLocalizedClassTypeName } from "@/frontend/common/views/dashboard/classes/details/utils/localizedClassTypeName";
import { MobilePageHeader } from "@/frontend/mobile/components/ui";

export function ClassDetailsHeaderMobile({
  instance,
  canOverride,
  isStudentView,
  labels,
}: Readonly<ClassDetailsHeaderProps>) {
  const title = getLocalizedClassTypeName(instance.classType, labels.classTypes, instance.courseName);
  let subtitle: string;
  if (canOverride) {
    subtitle = labels.pageSubtitleAdmin;
  } else if (isStudentView) {
    subtitle = labels.pageSubtitleStudent;
  } else {
    subtitle = labels.pageSubtitleTeacher;
  }

  return (
    <Box sx={classDetailsContentPaddingSx}>
      <MobilePageHeader title={title} subtitle={subtitle} titleVariant="headlineMd" breadcrumbs={undefined} />
    </Box>
  );
}
