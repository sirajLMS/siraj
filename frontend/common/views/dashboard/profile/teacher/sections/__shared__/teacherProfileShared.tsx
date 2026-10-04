"use client";

import type { ReactNode } from "react";
import type { MetricItem } from "@/frontend/common/types/shared.types";
import {
  type TeacherProfileSharedSections,
  TeacherProfileViewSections,
} from "@/frontend/common/views/dashboard/profile/teacher/sections/__shared__/teacherProfileViewSections.parts";
import { TeacherNonProfileTabContent } from "@/frontend/common/views/dashboard/profile/teacher/TeacherNonProfileTabContent";
import { TeacherProfileEditBody } from "@/frontend/common/views/dashboard/profile/teacher/TeacherProfileEditBody";
import type { TeacherProfileViewModel } from "@/frontend/common/views/dashboard/profile/teacher/useTeacherProfileViewModel";
import { ProfileMode } from "@/shared/constants/profile.enum";

export type { TeacherProfileSharedSections } from "@/frontend/common/views/dashboard/profile/teacher/sections/__shared__/teacherProfileViewSections.parts";

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
    content = (
      <TeacherProfileViewSections
        labels={labels}
        teacherData={teacherData}
        profilePhone={profilePhone}
        profileTimezone={profileTimezone}
        displayCurrency={displayCurrency}
        scope={scope}
        targetUserId={targetUserId}
        isAdminScope={isAdminScope}
        renderView={options.renderView}
        renderStats={options.renderStats}
      />
    );
  }

  return content;
}
