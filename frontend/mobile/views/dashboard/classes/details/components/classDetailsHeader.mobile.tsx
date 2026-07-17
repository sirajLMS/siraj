"use client";

import { Box } from "@mui/material";
import { PageHeader } from "@/frontend/common/components/ui";
import type { ClassInstanceDetail } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { classDetailsContentPaddingSx } from "@/frontend/common/views/dashboard/classes/details/classDetailsMobileLayout";
import { useAppTranslation } from "@/shared/locale";

interface ClassDetailsHeaderMobileProps {
  readonly instance: ClassInstanceDetail;
  readonly canOverride: boolean;
}

export function ClassDetailsHeaderMobile({ instance, canOverride }: ClassDetailsHeaderMobileProps) {
  const t = useAppTranslation().dashboardTranslations.classDetails;

  return (
    <Box sx={classDetailsContentPaddingSx}>
      <PageHeader
        title={instance.courseName ?? ""}
        subtitle={canOverride ? t.pageSubtitleAdmin : t.pageSubtitleTeacher}
        titleVariant="headlineMd"
        breadcrumbs={undefined}
      />
    </Box>
  );
}
