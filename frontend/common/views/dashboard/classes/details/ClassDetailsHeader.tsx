"use client";

import { Box } from "@mui/material";
import { PageHeader } from "@/frontend/common/components/ui";
import type { ClassInstanceDetail } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { classDetailsContentPaddingSx } from "@/frontend/common/views/dashboard/classes/details/classDetailsMobileLayout";
import { useAppTranslation } from "@/shared/locale/client";

interface ClassDetailsHeaderProps {
  readonly instance: ClassInstanceDetail;
  readonly canOverride: boolean;
  readonly isMobile: boolean;
}

export const ClassDetailsHeader = ({ instance, canOverride, isMobile }: ClassDetailsHeaderProps) => {
  const t = useAppTranslation().dashboardTranslations.classDetails;

  return (
    <Box sx={classDetailsContentPaddingSx}>
      <PageHeader
        title={instance.courseName ?? ""}
        subtitle={canOverride ? t.pageSubtitleAdmin : t.pageSubtitleTeacher}
        titleVariant={isMobile ? "headlineMd" : "headlineLg"}
        breadcrumbs={
          isMobile
            ? undefined
            : [
                { label: t.breadcrumbs.dashboard, href: "/dashboard" },
                { label: t.breadcrumbs.classes, href: `/classes/${instance.id}` },
                { label: instance.courseName ?? "", current: true },
              ]
        }
      />
    </Box>
  );
};
