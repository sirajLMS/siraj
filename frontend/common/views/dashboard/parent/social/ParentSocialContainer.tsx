"use client";

import { ParentSocialView } from "@/frontend/common/views/dashboard/parent/social/ParentSocialView";
import {
  type UseParentSocialViewModelProps,
  useParentSocialViewModel,
} from "@/frontend/common/views/dashboard/parent/social/useParentSocialViewModel";

export function ParentSocialContainer(_props: Readonly<UseParentSocialViewModelProps>) {
  const viewModel = useParentSocialViewModel({});

  return <ParentSocialView {...viewModel} />;
}
