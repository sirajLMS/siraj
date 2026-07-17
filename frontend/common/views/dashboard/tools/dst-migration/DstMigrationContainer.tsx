"use client";

import { RequirePermission } from "@/frontend/common/components/auth/RequirePermission";
import { DstMigrationView } from "@/frontend/common/views/dashboard/tools/dst-migration/DstMigrationView";
import { useDstMigrationViewModel } from "@/frontend/common/views/dashboard/tools/dst-migration/useDstMigrationViewModel";

export function DstMigrationContainer() {
  const viewModel = useDstMigrationViewModel();

  return (
    <RequirePermission permissions={[viewModel.requiredPermission]}>
      <DstMigrationView {...viewModel} />
    </RequirePermission>
  );
}
