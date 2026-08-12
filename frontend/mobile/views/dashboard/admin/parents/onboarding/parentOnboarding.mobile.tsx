"use client";

import type { ReactNode } from "react";
import { ParentOnboardingShared } from "@/frontend/common/views/dashboard/admin/parents/onboarding/__shared__/parentOnboardingShared";
import { MOBILE_OPTIONS } from "@/frontend/common/views/dashboard/admin/parents/onboarding/__shared__/parentOnboardingShared.options";
import type { ParentOnboardingViewModel } from "@/frontend/common/views/dashboard/admin/parents/onboarding/useParentOnboardingViewModel";

export function ParentOnboardingMobileView({ ...vm }: Readonly<ParentOnboardingViewModel>): ReactNode {
  return <ParentOnboardingShared {...vm} options={MOBILE_OPTIONS} />;
}
