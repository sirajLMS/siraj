"use client";

import { Alert } from "@mui/material";
import type { ReactNode } from "react";
import { ErrorState, LoadingState } from "@/frontend/common/components/ui";
import { NotificationPreferencesTab } from "@/frontend/common/views/dashboard/profile/core/notifications/NotificationPreferencesTab";
import type { AssociatedStudentsSectionVariantProps } from "@/frontend/common/views/dashboard/profile/parent/sections/parentProfileTypes";
import { PaymentMethodsTab } from "@/frontend/common/views/dashboard/profile/shared/payment-methods/PaymentMethodsTab";
import { MeetingConfigsTab } from "@/frontend/common/views/dashboard/profile/teacher/meeting/MeetingConfigsTab";
import { ProfileScope } from "@/shared/constants/profile.enum";

export interface ParentProfileSlotProps {
  readonly ViewContentWrapper: React.FC<{ readonly children: ReactNode }>;
  readonly StudentsSection: React.FC<AssociatedStudentsSectionVariantProps>;
}

type ParentProfileTabRoutesProps = {
  readonly activeTab: string;
  readonly scope: ProfileScope;
  readonly targetUserId: string;
  readonly children: ReactNode;
};

export function ParentProfileTabRoutes({
  activeTab,
  scope,
  targetUserId,
  children,
}: ParentProfileTabRoutesProps): ReactNode {
  if (activeTab === "notifications" && scope === ProfileScope.OWN) {
    return <NotificationPreferencesTab isActive />;
  }

  if (activeTab === "meeting") {
    return <MeetingConfigsTab targetUserId={targetUserId} scope={scope} />;
  }

  if (activeTab === "paymentMethods") {
    return <PaymentMethodsTab targetUserId={targetUserId} scope={scope} slot="payin" />;
  }

  if (activeTab !== "profile") {
    return null;
  }

  return <>{children}</>;
}

type ParentProfileGuardStateProps = {
  readonly loading: boolean;
  readonly error: unknown;
  readonly hasParentData: boolean;
  readonly failedToLoadMessage: string;
  readonly retryLabel: string;
  readonly notFoundMessage: string;
  readonly onRetry: () => void;
  readonly children: ReactNode;
};

export function ParentProfileGuardState({
  loading,
  error,
  hasParentData,
  failedToLoadMessage,
  retryLabel,
  notFoundMessage,
  onRetry,
  children,
}: ParentProfileGuardStateProps): ReactNode {
  if (loading && !hasParentData) {
    return <LoadingState />;
  }

  if (error && !hasParentData) {
    return <ErrorState embedded message={failedToLoadMessage} retryLabel={retryLabel} onRetry={onRetry} />;
  }

  if (!hasParentData) {
    return (
      <Alert severity="warning" sx={{ my: 2 }}>
        {notFoundMessage}
      </Alert>
    );
  }

  return <>{children}</>;
}
