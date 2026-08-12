"use client";

import { OverridesDialogFooterShared } from "@/frontend/common/views/dashboard/permissions/components/__shared__/overridesDialogFooterShared";
import type { OverridesDialogFooterProps } from "@/frontend/common/views/dashboard/permissions/types";

export function OverridesDialogFooterDesktop(props: Readonly<OverridesDialogFooterProps>) {
  return <OverridesDialogFooterShared {...props} />;
}
