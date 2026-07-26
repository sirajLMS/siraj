"use client";

import { RequirePermission } from "@/frontend/common/components/auth/RequirePermission";
import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { MeetingProviderFormView } from "@/frontend/common/views/dashboard/admin/meeting-providers/form/MeetingProviderFormView";
import type { UseMeetingProviderFormViewModelProps } from "@/frontend/common/views/dashboard/admin/meeting-providers/form/types";
import { useMeetingProviderFormViewModel } from "@/frontend/common/views/dashboard/admin/meeting-providers/form/useMeetingProviderFormViewModel";

export function MeetingProviderFormContainer(props: Readonly<UseMeetingProviderFormViewModelProps>) {
  const viewModel = useMeetingProviderFormViewModel(props);
  return (
    <RequirePermission permissions={[AppPermission.MeetingProvidersManageCatalog]} fallback={null}>
      <MeetingProviderFormView {...viewModel} />
    </RequirePermission>
  );
}
