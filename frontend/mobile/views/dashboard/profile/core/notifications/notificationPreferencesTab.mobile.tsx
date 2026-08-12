"use client";

import type { ReactNode } from "react";
import { NotificationChannel } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { NotificationPreferencesTabShared } from "@/frontend/common/views/dashboard/profile/core/notifications/__shared__/notificationPreferencesTabShared";
import type { NotificationPreferencesTabVariantProps } from "@/frontend/common/views/dashboard/profile/core/notifications/notificationPreferenceTypes";
import { PreferencesChannelTabsMobileView } from "@/frontend/mobile/views/dashboard/profile/core/notifications/preferencesChannelTabs.mobile";

function renderMobileBody(props: Readonly<NotificationPreferencesTabVariantProps>): ReactNode {
  return (
    <PreferencesChannelTabsMobileView
      labels={props.labels}
      preferences={props.preferences}
      preferenceMap={props.preferenceMap ?? new Map()}
      eventTypes={props.eventTypes}
      categoryRows={props.categoryRows}
      onToggle={props.onToggle}
      onCategoryToggle={props.onCategoryToggle}
      disabled={props.disabled}
      loading={props.loading}
      activeChannel={props.activeChannel ?? NotificationChannel.Email}
      slideDirection={props.slideDirection ?? "left"}
      onChannelChange={props.onChannelChange ?? (() => undefined)}
    />
  );
}

export function NotificationPreferencesTabMobile(props: Readonly<NotificationPreferencesTabVariantProps>) {
  return <NotificationPreferencesTabShared variantProps={props} options={{ renderBody: renderMobileBody }} />;
}
