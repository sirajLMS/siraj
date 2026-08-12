"use client";

import { ParentRulesShared } from "@/frontend/common/views/dashboard/parent/rules/__shared__/parentRulesShared";
import type { ParentRulesViewModel } from "@/frontend/common/views/dashboard/parent/rules/useParentRulesViewModel";
import { MobilePageContainer, MobilePageHeader, MobileSectionPanel } from "@/frontend/mobile/components/ui";

export function ParentRulesMobileView({ ...vm }: Readonly<ParentRulesViewModel>) {
  return (
    <ParentRulesShared
      vm={vm}
      options={{
        PageContainer: MobilePageContainer,
        PageHeader: MobilePageHeader,
        SectionPanel: MobileSectionPanel,
      }}
    />
  );
}
