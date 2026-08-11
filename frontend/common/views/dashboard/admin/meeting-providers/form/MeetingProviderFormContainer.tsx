"use client";

import { MeetingProviderFormView } from "@/frontend/common/views/dashboard/admin/meeting-providers/form/MeetingProviderFormView";
import type { UseMeetingProviderFormViewModelProps } from "@/frontend/common/views/dashboard/admin/meeting-providers/form/types";
import { useMeetingProviderFormViewModel } from "@/frontend/common/views/dashboard/admin/meeting-providers/form/useMeetingProviderFormViewModel";

export function MeetingProviderFormContainer(props: Readonly<UseMeetingProviderFormViewModelProps>) {
  const viewModel = useMeetingProviderFormViewModel(props);
  return <MeetingProviderFormView {...viewModel} />;
}
