"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo } from "react";
import { createLazyView } from "@/frontend/common/components/ui/container/createLazyView";
import { ResponsiveViewSwitch } from "@/frontend/common/components/ui/container/ResponsiveViewSwitch";
import type { ProfileAudience, ProfileScope } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { useUserStore } from "@/frontend/common/stores/userStore";
import type { ProfileTabNavVariantProps } from "@/frontend/common/views/dashboard/profile/core/profileTabNavTypes";
import { getVisibleProfileTabs, resolveProfileTab } from "@/frontend/common/views/dashboard/profile/core/profileTabs";

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

function buildTabHref(pathname: string, searchParams: URLSearchParams, tab: string): string {
  const params = new URLSearchParams(searchParams.toString());
  params.set("tab", tab);
  return `${pathname}?${params.toString()}`;
}

export function ProfileTabNav({ audience, scope, currentTab, onTabChange }: Readonly<ProfileTabNavProps>) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const hasPermission = useUserStore(state => state.hasPermission);

  const availableTabs = useMemo(
    () => getVisibleProfileTabs({ audience, scope, hasPermission }),
    [audience, scope, hasPermission]
  );

  const tabParam = searchParams.get("tab");
  const resolvedTab = resolveProfileTab(tabParam, availableTabs);

  // URL is the source of truth. Sync parent state from the resolved URL tab only —
  // never write parent state back into the URL (that raced with useSearchParams
  // hydration and caused an infinite profile ↔ notifications replace loop).
  useEffect(() => {
    if (resolvedTab && resolvedTab !== currentTab) {
      onTabChange(resolvedTab);
    }
  }, [resolvedTab, currentTab, onTabChange]);

  // Normalize missing/invalid ?tab= to the first visible tab.
  useEffect(() => {
    if (!resolvedTab || tabParam === resolvedTab) {
      return;
    }
    router.replace(buildTabHref(pathname, searchParams, resolvedTab), { scroll: false });
  }, [resolvedTab, tabParam, pathname, router, searchParams]);

  const handleTabChange = (tab: string) => {
    onTabChange(tab);
    if (tabParam === tab) {
      return;
    }
    router.replace(buildTabHref(pathname, searchParams, tab), { scroll: false });
  };

  if (availableTabs.length === 0 || !resolvedTab) {
    return null;
  }

  return (
    <ResponsiveViewSwitch
      mobile={lazyViews.mobile}
      desktop={lazyViews.desktop}
      props={{ availableTabs, currentTab: resolvedTab, onTabChange: handleTabChange }}
    />
  );
}
