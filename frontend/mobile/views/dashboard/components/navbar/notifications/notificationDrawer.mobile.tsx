"use client";

import { NotificationDrawerShared } from "@/frontend/common/views/dashboard/components/navbar/notifications/__shared__/notificationDrawerShared";
import { MOBILE_OPTIONS } from "@/frontend/common/views/dashboard/components/navbar/notifications/__shared__/notificationDrawerShared.options";
import type { NotificationDrawerProps } from "@/frontend/common/views/dashboard/components/navbar/notifications/types";

export function NotificationDrawerMobile({ vm }: Readonly<NotificationDrawerProps>) {
  return <NotificationDrawerShared vm={vm} options={MOBILE_OPTIONS} />;
}
