"use client";

import type { ReactNode } from "react";
import { NotificationPreferencesTabShared } from "@/frontend/common/views/dashboard/profile/core/notifications/__shared__/notificationPreferencesTabShared";
import type { NotificationPreferencesTabVariantProps } from "@/frontend/common/views/dashboard/profile/core/notifications/notificationPreferenceTypes";
import { PreferencesMatrixDesktopView } from "@/frontend/desktop/views/dashboard/profile/core/notifications/preferencesMatrix.desktop";

function renderDesktopBody(props: Readonly<NotificationPreferencesTabVariantProps>): ReactNode {
  return (
    <PreferencesMatrixDesktopView
      labels={props.labels}
      matrixRows={props.matrixRows ?? []}
      categoryRows={props.categoryRows}
      onToggle={props.onToggle}
      onCategoryToggle={props.onCategoryToggle}
      disabled={props.disabled}
      loading={props.loading}
    />
  );
}

export function NotificationPreferencesTabDesktop(props: Readonly<NotificationPreferencesTabVariantProps>) {
  return <NotificationPreferencesTabShared variantProps={props} options={{ renderBody: renderDesktopBody }} />;
}
