"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo } from "react";
import { createLazyView } from "@/frontend/common/components/ui/container/createLazyView";
import { ResponsiveViewSwitch } from "@/frontend/common/components/ui/container/ResponsiveViewSwitch";
import type { ProfileAudience, ProfileScope } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { useUserStore } from "@/frontend/common/stores/userStore";
import type { ProfileTabNavVariantProps } from "@/frontend/common/views/dashboard/profile/core/profileTabNavTypes";
import { getVisibleProfileTabs } from "@/frontend/common/views/dashboard/profile/core/profileTabs";

export type ProfileTabNavProps = {
  readonly audience: ProfileAudience;
  readonly scope: ProfileScope;
  readonly currentTab: string;
  readonly onTabChange: (tab: string) => void;
};

const lazyViews = createLazyView<ProfileTabNavVariantProps>(
  () =>
    import("@/frontend/mobile/views/dashboard/profile/core/profileTabNav.mobile").then(m => ({
      default: m.ProfileTabNavMobileView,
    })),
  () =>
    import("@/frontend/desktop/views/dashboard/profile/core/profileTabNav.desktop").then(m => ({
      default: m.ProfileTabNavDesktopView,
    }))
);

export function ProfileTabNav({ audience, scope, currentTab, onTabChange }: Readonly<ProfileTabNavProps>) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const hasPermission = useUserStore(state => state.hasPermission);

  const availableTabs = useMemo(
    () => getVisibleProfileTabs({ audience, scope, hasPermission }),
    [audience, scope, hasPermission]
  );

  useEffect(() => {
    const tabParam = searchParams.get("tab");
    const nextTab = tabParam && availableTabs.some(tab => tab.id === tabParam) ? tabParam : availableTabs[0]?.id;

    if (nextTab && nextTab !== currentTab) {
      onTabChange(nextTab);
    }
  }, [searchParams, availableTabs, onTabChange, currentTab]);

  useEffect(() => {
    if (!currentTab) {
      return;
    }

    const params = new URLSearchParams(searchParams.toString());
    if (params.get("tab") === currentTab) {
      return;
    }

    params.set("tab", currentTab);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }, [currentTab, pathname, router, searchParams]);

  if (availableTabs.length === 0) {
    return null;
  }

  return (
    <ResponsiveViewSwitch
      mobile={lazyViews.mobile}
      desktop={lazyViews.desktop}
      props={{ availableTabs, currentTab, onTabChange }}
    />
  );
}
