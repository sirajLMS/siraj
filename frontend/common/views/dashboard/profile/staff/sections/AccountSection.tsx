"use client";

import {
  AccountSectionEdit,
  type AccountSectionEditProps,
} from "@/frontend/common/views/dashboard/profile/staff/sections/AccountSectionEdit.parts";
import {
  AccountSectionView,
  type AccountSectionViewProps,
} from "@/frontend/common/views/dashboard/profile/staff/sections/AccountSectionView.parts";

type AccountSectionProps =
  | ({ readonly mode: "edit" } & AccountSectionEditProps)
  | ({ readonly mode: "view" } & AccountSectionViewProps);

export function AccountSection(props: AccountSectionProps) {
  if (props.mode === "edit") {
    return <AccountSectionEdit {...props} />;
  }
  return <AccountSectionView {...props} />;
}
