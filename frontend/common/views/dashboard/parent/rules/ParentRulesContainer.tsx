"use client";

import { ParentRulesView } from "@/frontend/common/views/dashboard/parent/rules/ParentRulesView";
import {
  type UseParentRulesViewModelProps,
  useParentRulesViewModel,
} from "@/frontend/common/views/dashboard/parent/rules/useParentRulesViewModel";

export function ParentRulesContainer(_props: Readonly<UseParentRulesViewModelProps>) {
  const viewModel = useParentRulesViewModel({});

  return <ParentRulesView {...viewModel} />;
}
