"use client";

import { NotificationDrawerShared } from "@/frontend/common/views/dashboard/components/navbar/notifications/__shared__/notificationDrawerShared";
import { DESKTOP_OPTIONS } from "@/frontend/common/views/dashboard/components/navbar/notifications/__shared__/notificationDrawerShared.options";
import type { NotificationDrawerProps } from "@/frontend/common/views/dashboard/components/navbar/notifications/types";

export function NotificationDrawerDesktop({ vm }: Readonly<NotificationDrawerProps>) {
  return <NotificationDrawerShared vm={vm} options={DESKTOP_OPTIONS} />;
}
