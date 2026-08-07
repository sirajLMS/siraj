"use client";

import { createLazyView } from "@/frontend/common/components/ui/container/createLazyView";
import { ResponsiveViewSwitch } from "@/frontend/common/components/ui/container/ResponsiveViewSwitch";
import { ParentProfileContainer } from "@/frontend/common/views/dashboard/profile/parent/ParentProfileContainer";
import type {
  ParentProfileViewModel,
  UseParentProfileViewModelProps,
} from "@/frontend/common/views/dashboard/profile/parent/useParentProfileViewModel";

export type { ParentProfileViewModel, UseParentProfileViewModelProps };

const lazyViews = createLazyView<ParentProfileViewModel>(
  () =>
    import("@/frontend/mobile/views/dashboard/profile/parent/parentProfile.mobile").then(m => ({
      default: m.ParentProfileMobileView,
    })),
  () =>
    import("@/frontend/desktop/views/dashboard/profile/parent/parentProfile.desktop").then(m => ({
      default: m.ParentProfileDesktopView,
    }))
);

function isContainerProps(
  props: ParentProfileViewModel | UseParentProfileViewModelProps
): props is UseParentProfileViewModelProps {
  return "scope" in props && "mode" in props && "targetUserId" in props && !("parentData" in props);
}

/**
 * This alias is retained so the legacy test and Storybook fixtures in this
 * package (which fabricate a full ViewModel and call
 * `ParentProfileView(...)`) keep compiling during the migration. New call
 * sites should use the Container.
 *
 * When `props.scope`/`mode`/`targetUserId` are present this delegates to the
 * Container (which wires the identity hook); otherwise (test/story fixture
 * path) it renders the tier switcher with the precomputed ViewModel as-is.
 */
export function ParentProfileView(props: Readonly<ParentProfileViewModel | UseParentProfileViewModelProps>) {
  if (isContainerProps(props)) {
    return <ParentProfileContainer {...props} />;
  }
  return <ResponsiveViewSwitch mobile={lazyViews.mobile} desktop={lazyViews.desktop} props={props} />;
}

export default ParentProfileView;
