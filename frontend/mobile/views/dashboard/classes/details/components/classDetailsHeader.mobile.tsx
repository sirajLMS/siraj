"use client";

import { Box } from "@mui/material";
import type { ClassInstanceDetail } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { classDetailsContentPaddingSx } from "@/frontend/common/views/dashboard/classes/details/classDetailsMobileLayout";
import { MobilePageHeader } from "@/frontend/mobile/components/ui";
import { useAppTranslation } from "@/shared/locale";

interface ClassDetailsHeaderMobileProps {
  readonly instance: ClassInstanceDetail;
  readonly canOverride: boolean;
}

export function ClassDetailsHeaderMobile({ instance, canOverride }: ClassDetailsHeaderMobileProps) {
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
