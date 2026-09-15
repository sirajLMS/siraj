"use client";

import type { ReactElement } from "react";
import { StudentQuotaView } from "@/frontend/common/views/dashboard/students/quota/components/__shared__/studentQuotaShared";
import type { StudentQuotaTierConfig } from "@/frontend/common/views/dashboard/students/quota/components/__shared__/studentQuotaShared.types";
import { wrapContextualHelperCardsDefault } from "@/frontend/common/views/dashboard/students/quota/components/__shared__/studentQuotaSharedUtils";
import type { StudentQuotaViewModel } from "@/frontend/common/views/dashboard/students/quota/useStudentQuotaViewModel";
import { DesktopPrimaryPageAction } from "@/frontend/desktop/components/ui/button";
import { DesktopPageContainer, DesktopPageHeader } from "@/frontend/desktop/components/ui/container/page";
import { ContextualHelperCardsDesktop } from "@/frontend/desktop/views/dashboard/students/quota/components/contextualHelperCards.desktop";
import { CourseDetailsSectionDesktop } from "@/frontend/desktop/views/dashboard/students/quota/components/courseDetailsSection.desktop";
import { StudentInformationSectionDesktop } from "@/frontend/desktop/views/dashboard/students/quota/components/studentInformationSection.desktop";

function desktopBreadcrumbs(t: { readonly breadcrumbs: { readonly students: string; readonly adjustQuota: string } }) {
  return [
    { label: t.breadcrumbs.students, href: "/students" },
    { label: t.breadcrumbs.adjustQuota, current: true },
  ];
}

function renderDesktopHeader({
  t,
}: Readonly<{
  t: { readonly breadcrumbs: { readonly students: string; readonly adjustQuota: string } };
}>): ReactElement {
  return (
    <DesktopPageHeader title={t.breadcrumbs.adjustQuota} titleVariant="titleLg" breadcrumbs={desktopBreadcrumbs(t)} />
  );
}

const DESKTOP_TIER: StudentQuotaTierConfig = {
  PrimaryAction: DesktopPrimaryPageAction,
  sections: {
    StudentInformationSection: StudentInformationSectionDesktop,
    CourseDetailsSection: CourseDetailsSectionDesktop,
    ContextualHelperCards: ContextualHelperCardsDesktop,
  },
  renderHeader: renderDesktopHeader,
  cardSx: {
    useCardStyling: true,
    formPadding: 4,
    formGap: 6,
  },
  actionsSx: {
    containerPaddingTop: 5,
    containerDirection: "row",
    innerDirection: "row",
    innerGap: 2,
    innerWidth: "auto",
  },
  wrapContextualHelperCards: wrapContextualHelperCardsDefault,
};

export function StudentQuotaDesktopView(props: Readonly<StudentQuotaViewModel>) {
  return <StudentQuotaView props={props} tier={DESKTOP_TIER} PageContainer={DesktopPageContainer} />;
}
