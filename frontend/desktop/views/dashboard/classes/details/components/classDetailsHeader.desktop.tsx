"use client";

import { Box } from "@mui/material";
import { classDetailsContentPaddingSx } from "@/frontend/common/views/dashboard/classes/details/classDetailsMobileLayout";
import type { ClassDetailsHeaderProps } from "@/frontend/common/views/dashboard/classes/details/types";
import { getLocalizedClassTypeName } from "@/frontend/common/views/dashboard/classes/details/utils/localizedClassTypeName";
import { DesktopPageHeader } from "@/frontend/desktop/components/ui";
import { useAppTranslation } from "@/shared/locale";

export function ClassDetailsHeaderDesktop({ instance, canOverride }: Readonly<ClassDetailsHeaderProps>) {
  const translations = useAppTranslation();
  const t = translations.dashboardTranslations.classDetails;
  const title = getLocalizedClassTypeName(
    instance.classType,
    translations.sessionTranslations.classTypes,
    instance.courseName
  );

  return (
    <Box sx={classDetailsContentPaddingSx}>
      <DesktopPageHeader
        title={title}
        subtitle={canOverride ? t.pageSubtitleAdmin : t.pageSubtitleTeacher}
        titleVariant="headlineLg"
        breadcrumbs={[
          { label: t.breadcrumbs.dashboard, href: "/dashboard" },
          { label: t.breadcrumbs.classes, href: `/classes/${instance.id}` },
          { label: title, current: true },
        ]}
      />
    </Box>
  );
}
