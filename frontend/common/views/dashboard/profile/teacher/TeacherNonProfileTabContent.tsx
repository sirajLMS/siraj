"use client";

import type { ReactElement } from "react";
import { ProfileScope } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { NotificationPreferencesTab } from "@/frontend/common/views/dashboard/profile/core/notifications/NotificationPreferencesTab";
import { PaymentMethodsTab } from "@/frontend/common/views/dashboard/profile/shared/payment-methods/PaymentMethodsTab";
import { MeetingConfigsTab } from "@/frontend/common/views/dashboard/profile/teacher/meeting/MeetingConfigsTab";

type TeacherNonProfileTabContentProps = {
  readonly activeTab: string;
  readonly scope: ProfileScope;
  readonly targetUserId: string;
};

export function TeacherNonProfileTabContent({
  activeTab,
  scope,
  targetUserId,
}: TeacherNonProfileTabContentProps): ReactElement | null {
  if (activeTab === "notifications" && scope === ProfileScope.Own) {
    return <NotificationPreferencesTab isActive />;
  }
  if (activeTab === "meeting") {
    return <MeetingConfigsTab targetUserId={targetUserId} scope={scope} />;
  }
  if (activeTab === "paymentMethods") {
    return <PaymentMethodsTab targetUserId={targetUserId} scope={scope} slot="payout" />;
  }
  return null;
}
