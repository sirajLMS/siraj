"use client";

import { Box } from "@mui/material";
import { classDetailsContentPaddingSx } from "@/frontend/common/views/dashboard/classes/details/classDetailsMobileLayout";
import type { ClassDetailsHeaderProps } from "@/frontend/common/views/dashboard/classes/details/types";
import { MobilePageHeader } from "@/frontend/mobile/components/ui";
import { useAppTranslation } from "@/shared/locale";

export function ClassDetailsHeaderMobile({ instance, canOverride }: Readonly<ClassDetailsHeaderProps>) {
  const t = useAppTranslation().dashboardTranslations.classDetails;

  return (
    <Box sx={classDetailsContentPaddingSx}>
      <MobilePageHeader
        title={instance.courseName ?? ""}
        subtitle={canOverride ? t.pageSubtitleAdmin : t.pageSubtitleTeacher}
        titleVariant="headlineMd"
        breadcrumbs={undefined}
      />
    </Box>
  );
}
