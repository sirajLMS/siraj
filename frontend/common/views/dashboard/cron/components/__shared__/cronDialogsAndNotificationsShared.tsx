"use client";

import {
  CronDialogsShared,
  type CronDialogsSharedConfig,
} from "@/frontend/common/views/dashboard/cron/__shared__/cronDialogsShared";
import { getCronDialogsProps } from "@/frontend/common/views/dashboard/cron/__shared__/cronDialogsSharedHelpers";
import {
  CronNotificationsShared,
  type CronNotificationsSharedConfig,
} from "@/frontend/common/views/dashboard/cron/__shared__/cronNotificationsShared";
import type { CronViewProps } from "@/frontend/common/views/dashboard/cron/types";

export interface CronDialogsAndNotificationsConfig {
  readonly dialogs: Readonly<CronDialogsSharedConfig>;
  readonly notifications: Readonly<CronNotificationsSharedConfig>;
}

export function CronDialogsAndNotificationsShared({
  props,
  config,
}: Readonly<{
  readonly props: Readonly<CronViewProps>;
  readonly config: Readonly<CronDialogsAndNotificationsConfig>;
}>) {
  return (
    <>
      <CronDialogsShared {...getCronDialogsProps(props)} config={config.dialogs} />
      <CronNotificationsShared notifications={props.notifications} config={config.notifications} />
    </>
  );
}
