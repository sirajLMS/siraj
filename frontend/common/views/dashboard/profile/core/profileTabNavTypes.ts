import type { ProfileTabDefinition } from "@/frontend/common/views/dashboard/profile/core/profileTabs";

export interface ProfileTabNavVariantProps {
  readonly availableTabs: readonly ProfileTabDefinition[];
  readonly currentTab: string;
  readonly onTabChange: (tab: string) => void;
}
