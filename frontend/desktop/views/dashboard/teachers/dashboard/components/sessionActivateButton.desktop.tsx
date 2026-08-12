"use client";

import { SessionActivateButtonShared } from "@/frontend/common/views/dashboard/teachers/dashboard/components/__shared__/sessionActivateButtonShared";
import type { SessionActivateButtonProps } from "@/frontend/common/views/dashboard/teachers/dashboard/types/teacherDashboardComponentProps";

/**
 * Desktop variant of the session activate button.
 * `fullWidth` defaults to `false` — desktop status rows don't span full width.
 */
export function SessionActivateButtonDesktop(props: Readonly<SessionActivateButtonProps>) {
  return <SessionActivateButtonShared {...props} fullWidth={props.fullWidth ?? false} />;
}
