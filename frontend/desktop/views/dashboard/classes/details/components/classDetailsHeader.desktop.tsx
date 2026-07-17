"use client";

import { Box } from "@mui/material";
import type { ClassInstanceDetail } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { classDetailsContentPaddingSx } from "@/frontend/common/views/dashboard/classes/details/classDetailsMobileLayout";
import { DesktopPageHeader } from "@/frontend/desktop/components/ui";
import { useAppTranslation } from "@/shared/locale";

interface ClassDetailsHeaderDesktopProps {
  readonly instance: ClassInstanceDetail;
  readonly canOverride: boolean;
}

export function ClassDetailsHeaderDesktop({ instance, canOverride }: ClassDetailsHeaderDesktopProps) {
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
