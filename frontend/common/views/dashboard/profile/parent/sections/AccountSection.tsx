"use client";

import type { AccountSectionProps } from "@/frontend/common/views/dashboard/profile/parent/sections/accountSection.helpers";
import {
  AccountSectionEdit,
  AccountSectionView,
} from "@/frontend/common/views/dashboard/profile/parent/sections/accountSection.parts";

export function AccountSection(props: AccountSectionProps) {
  if (props.mode === "edit") {
    return <AccountSectionEdit {...props} />;
  }
  return <AccountSectionView {...props} />;
}
