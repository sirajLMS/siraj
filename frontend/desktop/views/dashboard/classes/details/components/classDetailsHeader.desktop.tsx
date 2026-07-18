"use client";

import { Box } from "@mui/material";
import { classDetailsContentPaddingSx } from "@/frontend/common/views/dashboard/classes/details/classDetailsMobileLayout";
import type { ClassDetailsHeaderProps } from "@/frontend/common/views/dashboard/classes/details/types";
import { DesktopPageHeader } from "@/frontend/desktop/components/ui";
import { useAppTranslation } from "@/shared/locale";

export function ClassDetailsHeaderDesktop({ instance, canOverride }: Readonly<ClassDetailsHeaderProps>) {
  const t = useAppTranslation().dashboardTranslations.classDetails;

  return (
    <Box sx={classDetailsContentPaddingSx}>
      <DesktopPageHeader
        title={instance.courseName ?? ""}
        subtitle={canOverride ? t.pageSubtitleAdmin : t.pageSubtitleTeacher}
        titleVariant="headlineLg"
        breadcrumbs={[
          { label: t.breadcrumbs.dashboard, href: "/dashboard" },
          { label: t.breadcrumbs.classes, href: `/classes/${instance.id}` },
          { label: instance.courseName ?? "", current: true },
        ]}
      />
    </Box>
  );
}
