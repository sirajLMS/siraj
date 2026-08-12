"use client";

import { SessionActivateButtonShared } from "@/frontend/common/views/dashboard/teachers/dashboard/components/__shared__/sessionActivateButtonShared";
import type { SessionActivateButtonProps } from "@/frontend/common/views/dashboard/teachers/dashboard/types/teacherDashboardComponentProps";

/**
 * Mobile variant of the session activate button.
 * `fullWidth` defaults to `true` — mobile buttons span the available width.
 */
export function SessionActivateButtonMobile(props: Readonly<SessionActivateButtonProps>) {
  return <SessionActivateButtonShared {...props} fullWidth={props.fullWidth ?? true} />;
}
