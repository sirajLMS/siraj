import type { ProfileTabDefinition } from "@/frontend/common/views/dashboard/profile/core/profileTabs";
import type { ProfileTabNavLabels } from "@/frontend/common/views/dashboard/profile/core/types/profileShell.types";

export interface ProfileTabNavVariantProps {
  readonly labels: ProfileTabNavLabels;
  readonly availableTabs: readonly ProfileTabDefinition[];
  readonly currentTab: string;
  readonly onTabChange: (tab: string) => void;
}
