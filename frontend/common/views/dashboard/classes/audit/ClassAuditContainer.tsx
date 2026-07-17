"use client";

import { ClassAuditView } from "@/frontend/common/views/dashboard/classes/audit/ClassAuditView";
import {
  type ClassAuditViewModel,
  type UseClassAuditViewModelProps,
  useClassAuditViewModel,
} from "@/frontend/common/views/dashboard/classes/audit/useClassAuditViewModel";

export function ClassAuditContainer() {
  const viewModel = useClassAuditViewModel();

  return <ClassAuditView {...viewModel} />;
}

export type { ClassAuditViewModel, UseClassAuditViewModelProps };
