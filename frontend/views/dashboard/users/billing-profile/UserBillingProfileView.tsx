"use client";

import { useMediaQuery, useTheme } from "@mui/material";
import type { UserBillingProfileViewProps } from "@/frontend/views/dashboard/users/billing-profile/types/userBillingProfile.types";
import { UserBillingProfileDesktopView } from "@/frontend/views/dashboard/users/billing-profile/UserBillingProfileDesktopView";
import { UserBillingProfileMobileView } from "@/frontend/views/dashboard/users/billing-profile/UserBillingProfileMobileView";

export function UserBillingProfileView(props: Readonly<UserBillingProfileViewProps>) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  if (isMobile) {
    return <UserBillingProfileMobileView {...props} />;
  }

  return <UserBillingProfileDesktopView {...props} />;
}
