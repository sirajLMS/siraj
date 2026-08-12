"use client";

import type { ReactNode } from "react";
import { ParentSocialShared } from "@/frontend/common/views/dashboard/parent/social/__shared__/parentSocialShared";
import { DESKTOP_OPTIONS } from "@/frontend/common/views/dashboard/parent/social/__shared__/parentSocialShared.options";
import type { ParentSocialViewModel } from "@/frontend/common/views/dashboard/parent/social/useParentSocialViewModel";

export function ParentSocialDesktopView({ ...vm }: Readonly<ParentSocialViewModel>): ReactNode {
  return <ParentSocialShared {...vm} options={DESKTOP_OPTIONS} />;
}
