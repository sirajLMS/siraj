"use client";

import { Box } from "@mui/material";
import { classDetailsContentPaddingSx } from "@/frontend/common/views/dashboard/classes/details/classDetailsMobileLayout";
import type { ClassDetailsHeaderProps } from "@/frontend/common/views/dashboard/classes/details/types";
import { getLocalizedClassTypeName } from "@/frontend/common/views/dashboard/classes/details/utils/localizedClassTypeName";
import { DesktopPageHeader } from "@/frontend/desktop/components/ui";

export function ClassDetailsHeaderDesktop({ instance, canOverride, isStudentView, labels }: Readonly<ClassDetailsHeaderProps>) {
  const title = getLocalizedClassTypeName(instance.classType, labels.classTypes, instance.courseName);
  const subtitle = canOverride
    ? labels.pageSubtitleAdmin
    : isStudentView
      ? labels.pageSubtitleStudent
      : labels.pageSubtitleTeacher;

  return (
    <Box sx={classDetailsContentPaddingSx}>
      <DesktopPageHeader
        title={title}
        subtitle={subtitle}
        titleVariant="headlineLg"
        breadcrumbs={[
          { label: labels.breadcrumbs.dashboard, href: "/dashboard" },
          { label: labels.breadcrumbs.classes, href: `/classes/${instance.id}` },
          { label: title, current: true },
        ]}
      />
    </Box>
  );
}
