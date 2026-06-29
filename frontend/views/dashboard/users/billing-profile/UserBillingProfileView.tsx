"use client";

import { useMediaQuery, useTheme } from "@mui/material";
import type { UserBillingProfileViewProps } from "./types/userBillingProfile.types";
import { UserBillingProfileDesktopView } from "./UserBillingProfileDesktopView";
import { UserBillingProfileMobileView } from "./UserBillingProfileMobileView";

export function UserBillingProfileView(props: Readonly<UserBillingProfileViewProps>) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  if (isMobile) {
    return <UserBillingProfileMobileView {...props} />;
  }

  return <UserBillingProfileDesktopView {...props} />;
}
