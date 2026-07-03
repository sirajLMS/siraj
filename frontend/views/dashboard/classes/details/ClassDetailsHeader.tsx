"use client";

import { useTranslations } from "next-intl";
import { PageHeader } from "@/frontend/components/ui";
import type { ClassInstanceDetailReturnType as ClassInstanceDetail } from "@/backend/types/class-instance-detail.types";

interface ClassDetailsHeaderProps {
  readonly instance: ClassInstanceDetail;
  readonly canOverride: boolean;
  readonly isMobile: boolean;
}

export const ClassDetailsHeader = ({ instance, canOverride, isMobile }: ClassDetailsHeaderProps) => {
  const t = useTranslations("dashboard.classDetails");

  return (
    <PageHeader
      title={instance.courseName ?? ""}
      subtitle={canOverride ? t("pageSubtitleAdmin") : t("pageSubtitleTeacher")}
      titleVariant={isMobile ? "headlineMd" : "headlineLg"}
      breadcrumbs={
        isMobile
          ? undefined
          : [
              { label: t("breadcrumbs.dashboard"), href: "/dashboard" },
              { label: t("breadcrumbs.classes"), href: `/classes/${instance.id}` },
              { label: instance.courseName ?? "", current: true },
            ]
      }
    />
  );
};
