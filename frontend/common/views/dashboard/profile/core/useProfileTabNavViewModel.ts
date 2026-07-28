"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo } from "react";
import type { ProfileAudience, ProfileScope } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { useUserStore } from "@/frontend/common/stores/userStore";
import type { ProfileTabNavVariantProps } from "@/frontend/common/views/dashboard/profile/core/profileTabNavTypes";
import { getVisibleProfileTabs, resolveProfileTab } from "@/frontend/common/views/dashboard/profile/core/profileTabs";
import type { ProfileTabNavLabels } from "@/frontend/common/views/dashboard/profile/core/types/profileShell.types";
import { Translation, useAppTranslation } from "@/shared/locale";

export type ProfileTabNavProps = {
  readonly audience: ProfileAudience;
  readonly scope: ProfileScope;
  readonly currentTab: string;
  readonly onTabChange: (tab: string) => void;
};

export interface ProfileTabNavViewModel extends ProfileTabNavVariantProps {
  readonly resolvedTab: string | undefined;
}

function buildTabHref(pathname: string, searchParams: URLSearchParams, tab: string): string {
  const params = new URLSearchParams(searchParams.toString());
  params.set("tab", tab);
  return `${pathname}?${params.toString()}`;
}

export function useProfileTabNavViewModel(props: Readonly<ProfileTabNavProps>): ProfileTabNavViewModel | null {
  const labels: ProfileTabNavLabels = useAppTranslation(Translation.Profile.Base);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const hasPermission = useUserStore(state => state.hasPermission);

  const { audience, scope, currentTab, onTabChange } = props;

  const availableTabs = useMemo(
    () => getVisibleProfileTabs({ audience, scope, hasPermission }),
    [audience, scope, hasPermission]
  );

  const tabParam = searchParams.get("tab");
  const resolvedTab = resolveProfileTab(tabParam, availableTabs);

  useEffect(() => {
    if (resolvedTab && resolvedTab !== currentTab) {
      onTabChange(resolvedTab);
    }
  }, [resolvedTab, currentTab, onTabChange]);

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

  return {
    labels,
    availableTabs,
    currentTab: resolvedTab,
    onTabChange: handleTabChange,
    resolvedTab,
  };
}
