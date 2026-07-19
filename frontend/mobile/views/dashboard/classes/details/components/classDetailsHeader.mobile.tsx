"use client";

import { Box } from "@mui/material";
import { classDetailsContentPaddingSx } from "@/frontend/common/views/dashboard/classes/details/classDetailsMobileLayout";
import type { ClassDetailsHeaderProps } from "@/frontend/common/views/dashboard/classes/details/types";
import { getLocalizedClassTypeName } from "@/frontend/common/views/dashboard/classes/details/utils/localizedClassTypeName";
import { MobilePageHeader } from "@/frontend/mobile/components/ui";
import { useAppTranslation } from "@/shared/locale";

export function ClassDetailsHeaderMobile({ instance, canOverride }: Readonly<ClassDetailsHeaderProps>) {
  const translations = useAppTranslation();
  const t = translations.dashboardTranslations.classDetails;
  const title = getLocalizedClassTypeName(
    instance.classType,
    translations.sessionTranslations.classTypes,
    instance.courseName
  );

  return (
    <Box sx={classDetailsContentPaddingSx}>
      <MobilePageHeader
        title={title}
        subtitle={canOverride ? t.pageSubtitleAdmin : t.pageSubtitleTeacher}
        titleVariant="headlineMd"
        breadcrumbs={undefined}
      />
    </Box>
  );
}
