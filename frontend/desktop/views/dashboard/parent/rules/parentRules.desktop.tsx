"use client";

import { ParentRulesShared } from "@/frontend/common/views/dashboard/parent/rules/__shared__/parentRulesShared";
import type { ParentRulesViewModel } from "@/frontend/common/views/dashboard/parent/rules/useParentRulesViewModel";
import { DesktopSectionPanel } from "@/frontend/desktop/components/ui/container";
import { DesktopPageContainer, DesktopPageHeader } from "@/frontend/desktop/components/ui/container/page";

export function ParentRulesDesktopView({ ...vm }: Readonly<ParentRulesViewModel>) {
  return (
    <ParentRulesShared
      vm={vm}
      options={{
        PageContainer: DesktopPageContainer,
        PageHeader: DesktopPageHeader,
        SectionPanel: DesktopSectionPanel,
      }}
    />
  );
}
