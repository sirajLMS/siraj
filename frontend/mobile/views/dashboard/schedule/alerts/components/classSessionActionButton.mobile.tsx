"use client";

import type { ClassSessionActionButtonSharedProps } from "@/frontend/common/views/dashboard/schedule/alerts/components/__shared__/classSessionActionButtonShared";
import { ClassSessionActionButtonShared } from "@/frontend/common/views/dashboard/schedule/alerts/components/__shared__/classSessionActionButtonShared";
import { MOBILE_ACTION_BUTTON_OPTIONS } from "@/frontend/common/views/dashboard/schedule/alerts/components/__shared__/classSessionActionButtonShared.options";

export type ClassSessionActionButtonMobileProps = Omit<ClassSessionActionButtonSharedProps, "options">;

export function ClassSessionActionButtonMobile(props: Readonly<ClassSessionActionButtonMobileProps>) {
  return <ClassSessionActionButtonShared {...props} options={MOBILE_ACTION_BUTTON_OPTIONS} />;
}
