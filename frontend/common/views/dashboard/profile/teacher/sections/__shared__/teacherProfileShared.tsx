"use client";

import type { ReactNode } from "react";
import { toIanaTimezoneOrNull } from "@/frontend/common/lib/timezone";
import type { MetricItem } from "@/frontend/common/types/shared.types";
import { TeacherExtensionProfileSection } from "@/frontend/common/views/dashboard/profile/shared/sections/extensions/TeacherExtensionProfileSection";
import { UserDetailsProfileSection } from "@/frontend/common/views/dashboard/profile/shared/sections/UserDetailsProfileSection";
import { AdminOnlySection } from "@/frontend/common/views/dashboard/profile/teacher/sections/AdminOnlySection";
import { CompensationSection } from "@/frontend/common/views/dashboard/profile/teacher/sections/CompensationSection";
import { buildTeacherStatsMetrics } from "@/frontend/common/views/dashboard/profile/teacher/sections/StatsSection";
import {
  toTeacherPersonalFieldLabels,
  toTeacherSectionLabels,
} from "@/frontend/common/views/dashboard/profile/teacher/sections/teacherProfileLabelUtils";
import {
  hasTeacherAdminOnlyData,
  hasTeacherCompensationData,
  hasTeacherPersonalData,
  hasTeacherStatsData,
} from "@/frontend/common/views/dashboard/profile/teacher/sections/teacherProfileSectionPredicates";
import { isTeacherAdminData } from "@/frontend/common/views/dashboard/profile/teacher/sections/teacherProfileTypes";
import { TeacherNonProfileTabContent } from "@/frontend/common/views/dashboard/profile/teacher/TeacherNonProfileTabContent";
import { TeacherProfileEditBody } from "@/frontend/common/views/dashboard/profile/teacher/TeacherProfileEditBody";
import type { TeacherProfileViewModel } from "@/frontend/common/views/dashboard/profile/teacher/useTeacherProfileViewModel";
import { ProfileMode } from "@/shared/constants/profile.enum";

export interface TeacherProfileSharedSections {
  readonly userDetails: ReactNode;
  readonly compensation: ReactNode;
  readonly extension: ReactNode;
  readonly adminOnly: ReactNode;
  readonly stats: ReactNode;
}

interface TeacherProfileSharedOptions {
  readonly renderView: (sections: TeacherProfileSharedSections) => ReactNode;
  /**
   * Tier slot that renders the teacher stats metric descriptors through the
   * tier metric grid primitive (DesktopMetricCardGrid / MobileMetricCardGrid).
   */
  readonly renderStats: (metrics: readonly MetricItem[]) => ReactNode;
}

export interface TeacherProfileSharedProps {
  readonly vm: Readonly<TeacherProfileViewModel>;
  readonly options: TeacherProfileSharedOptions;
}

export function TeacherProfileShared({ vm, options }: Readonly<TeacherProfileSharedProps>): ReactNode {
  const {
    labels,
    teacherData,
    avatarUrl,
    displayCurrency,
    profilePhone,
    profileTimezone,
    isAdminScope,
    mode,
    scope,
    targetUserId,
    activeTab,
    isSaving,
    onSubmitOwn,
    onSubmitAdmin,
  } = vm;

  const sectionLabels = toTeacherSectionLabels(labels);
  const personalFieldLabels = toTeacherPersonalFieldLabels(labels);

  let content: ReactNode = null;

  if (activeTab !== "profile") {
    content = <TeacherNonProfileTabContent activeTab={activeTab} scope={scope} targetUserId={targetUserId} />;
  } else if (teacherData && mode === ProfileMode.EDIT) {
    content = (
      <TeacherProfileEditBody
        labels={labels}
        teacherData={teacherData}
        avatarUrl={avatarUrl}
        displayCurrency={displayCurrency}
        scope={scope}
        targetUserId={targetUserId}
        isSaving={isSaving}
        onSubmitOwn={onSubmitOwn}
        onSubmitAdmin={onSubmitAdmin}
      />
    );
  } else if (teacherData) {
    content = renderTeacherProfileViewSections({
      labels,
      sectionLabels,
      personalFieldLabels,
      teacherData,
      profilePhone,
      profileTimezone,
      displayCurrency,
      scope,
      targetUserId,
      isAdminScope,
      renderView: options.renderView,
      renderStats: options.renderStats,
    });
  }

  return content;
}

function renderTeacherProfileViewSections(params: {
  readonly labels: TeacherProfileViewModel["labels"];
  readonly sectionLabels: ReturnType<typeof toTeacherSectionLabels>;
  readonly personalFieldLabels: ReturnType<typeof toTeacherPersonalFieldLabels>;
  readonly teacherData: NonNullable<TeacherProfileViewModel["teacherData"]>;
  readonly profilePhone: TeacherProfileViewModel["profilePhone"];
  readonly profileTimezone: TeacherProfileViewModel["profileTimezone"];
  readonly displayCurrency: TeacherProfileViewModel["displayCurrency"];
  readonly scope: TeacherProfileViewModel["scope"];
  readonly targetUserId: TeacherProfileViewModel["targetUserId"];
  readonly isAdminScope: TeacherProfileViewModel["isAdminScope"];
  readonly renderView: TeacherProfileSharedOptions["renderView"];
  readonly renderStats: TeacherProfileSharedOptions["renderStats"];
}): ReactNode {
  const {
    labels,
    sectionLabels,
    personalFieldLabels,
    teacherData,
    profilePhone,
    profileTimezone,
    displayCurrency,
    scope,
    targetUserId,
    isAdminScope,
    renderView,
    renderStats,
  } = params;

  const adminData = isTeacherAdminData(teacherData) ? teacherData : null;
  const showCompensation = hasTeacherCompensationData(teacherData);
  const showExtension = hasTeacherPersonalData(teacherData);
  const showAdminOnly = isAdminScope && adminData != null && hasTeacherAdminOnlyData(adminData);
  const showStats = hasTeacherStatsData(teacherData);

  const sections: TeacherProfileSharedSections = {
    userDetails: (
      <UserDetailsProfileSection
        scope={scope}
        sectionTitle={labels.teacher.sections.contact}
        phoneLabel={labels.teacher.fields.phone}
        timezoneLabel={labels.teacher.fields.timezone}
        currencyLabel={labels.teacher.fields.displayCurrency}
        phone={profilePhone ?? teacherData.phone}
        timezone={toIanaTimezoneOrNull(profileTimezone ?? teacherData.timezone)}
        displayCurrency={displayCurrency}
        baseLabels={sectionLabels.baseLabels}
      />
    ),
    compensation: showCompensation ? (
      <CompensationSection labels={labels} mode="view" teacherData={teacherData} subjectUserId={targetUserId} />
    ) : null,
    extension: showExtension ? (
      <TeacherExtensionProfileSection
        mode="view"
        scope={scope}
        labels={{
          teacher: labels.teacher,
          personalFieldLabels,
          baseLabels: sectionLabels.baseLabels,
        }}
        sectionTitle={labels.teacher.sections.identity}
        nationality={teacherData.nationality}
        address={adminData?.address ?? teacherData.address}
        dateOfBirth={adminData?.dateOfBirth ?? teacherData.dateOfBirth}
        gender={adminData?.gender ?? teacherData.gender}
        qualifications={adminData?.qualifications ?? teacherData.qualifications}
      />
    ) : null,
    adminOnly:
      showAdminOnly && adminData ? <AdminOnlySection labels={sectionLabels} mode="view" adminData={adminData} /> : null,
    stats: showStats ? renderStats(buildTeacherStatsMetrics({ labels, teacherData, isAdminScope })) : null,
  };

  return renderView(sections);
}
