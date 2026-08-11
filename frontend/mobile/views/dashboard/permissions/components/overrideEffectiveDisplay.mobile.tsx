"use client";

import { OverrideEffectiveDisplayShared } from "@/frontend/common/views/dashboard/permissions/components/__shared__/overrideEffectiveDisplayShared";
import type { OverrideEffectiveDisplayProps } from "@/frontend/common/views/dashboard/permissions/types";

export function OverrideEffectiveDisplayMobile(props: Readonly<OverrideEffectiveDisplayProps>) {
  return <OverrideEffectiveDisplayShared {...props} />;
}
