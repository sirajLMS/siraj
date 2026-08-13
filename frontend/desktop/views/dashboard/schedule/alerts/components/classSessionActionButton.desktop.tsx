"use client";

import {
  ClassSessionActionButtonShared,
  type ClassSessionActionButtonSharedProps,
} from "@/frontend/common/views/dashboard/schedule/alerts/components/__shared__/classSessionActionButtonShared";
import { DESKTOP_ACTION_BUTTON_OPTIONS } from "@/frontend/common/views/dashboard/schedule/alerts/components/__shared__/classSessionActionButtonShared.options";

export type ClassSessionActionButtonDesktopProps = Omit<ClassSessionActionButtonSharedProps, "options">;

export function ClassSessionActionButtonDesktop(props: Readonly<ClassSessionActionButtonDesktopProps>) {
  return <ClassSessionActionButtonShared {...props} options={DESKTOP_ACTION_BUTTON_OPTIONS} />;
}
