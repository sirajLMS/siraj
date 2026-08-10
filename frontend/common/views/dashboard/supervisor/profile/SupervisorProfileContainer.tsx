"use client";

import { createLazyView } from "@/frontend/common/components/ui/container/createLazyView";
import { ResponsiveViewSwitch } from "@/frontend/common/components/ui/container/ResponsiveViewSwitch";
import {
  type SupervisorProfileViewModel,
  type UseSupervisorProfileViewModelProps,
  useSupervisorProfileViewModel,
} from "@/frontend/common/views/dashboard/supervisor/profile/useSupervisorProfileViewModel";
import { Translation, useAppTranslation } from "@/shared/locale";

const lazyViews = createLazyView<SupervisorProfileViewModel>(
  () =>
    import("@/frontend/mobile/views/dashboard/supervisor/profile/supervisorProfile.mobile").then(m => ({
      default: m.SupervisorProfileMobileView,
    })),
  () =>
    import("@/frontend/desktop/views/dashboard/supervisor/profile/supervisorProfile.desktop").then(m => ({
      default: m.SupervisorProfileDesktopView,
    }))
);

export function SupervisorProfileContainer(props: Readonly<UseSupervisorProfileViewModelProps>) {
  const viewModel = useSupervisorProfileViewModel(props);
  const t = useAppTranslation(Translation.Dashboard.SupervisorPortalProfile);
  const labelsWithAdmin = {
    ...viewModel.labels,
    adminResetPassword: t.adminResetPassword,
    actions: {
      ...viewModel.labels.actions,
      manageLifecycle: t.actions.manageLifecycle,
    },
  };
  return (
    <ResponsiveViewSwitch
      mobile={lazyViews.mobile}
      desktop={lazyViews.desktop}
      props={{ ...viewModel, labels: labelsWithAdmin }}
    />
  );
}

export type { SupervisorProfileViewModel, UseSupervisorProfileViewModelProps };
