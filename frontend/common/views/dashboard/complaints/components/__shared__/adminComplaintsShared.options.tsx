import type { AdminComplaintsSharedOptions } from "@/frontend/common/views/dashboard/complaints/components/__shared__/adminComplaintsShared";
import { DesktopSectionPanel } from "@/frontend/desktop/components/ui/container";
import { DesktopPageContainer, DesktopPageHeader } from "@/frontend/desktop/components/ui/container/page";
import { ComplaintQueueCardListDesktop } from "@/frontend/desktop/views/dashboard/complaints/components/complaintQueueCardList.desktop";
import { ComplaintsMetricsRowDesktop } from "@/frontend/desktop/views/dashboard/complaints/components/complaintsMetricsRow.desktop";
import { ComplaintsSearchBarDesktop } from "@/frontend/desktop/views/dashboard/complaints/components/complaintsSearchBar.desktop";
import { ComplaintsTabBarDesktop } from "@/frontend/desktop/views/dashboard/complaints/components/complaintsTabBar.desktop";
import {
  MobileContentInset,
  MobileContentStack,
  MobilePageContainer,
  MobilePageHeader,
} from "@/frontend/mobile/components/ui";
import { ComplaintQueueCardListMobile } from "@/frontend/mobile/views/dashboard/complaints/components/complaintQueueCardList.mobile";
import { ComplaintsMetricsRowMobile } from "@/frontend/mobile/views/dashboard/complaints/components/complaintsMetricsRow.mobile";
import { ComplaintsSearchBarMobile } from "@/frontend/mobile/views/dashboard/complaints/components/complaintsSearchBar.mobile";
import { ComplaintsTabBarMobile } from "@/frontend/mobile/views/dashboard/complaints/components/complaintsTabBar.mobile";

export const DESKTOP_OPTIONS: AdminComplaintsSharedOptions = {
  renderPageContainer: children => <DesktopPageContainer>{children}</DesktopPageContainer>,
  renderPageHeader: (title, subtitle) => <DesktopPageHeader title={title} subtitle={subtitle} />,
  renderMetricsRow: (summary, labels) => <ComplaintsMetricsRowDesktop summary={summary} labels={labels} />,
  renderSearchBar: (value, placeholder, onChange) => (
    <ComplaintsSearchBarDesktop value={value} placeholder={placeholder} onChange={onChange} />
  ),
  renderTabBar: (activeTab, unansweredCount, answeredCount, labels, onTabChange) => (
    <ComplaintsTabBarDesktop
      activeTab={activeTab}
      unansweredCount={unansweredCount}
      answeredCount={answeredCount}
      labels={labels}
      onTabChange={onTabChange}
    />
  ),
  renderCardList: props => <ComplaintQueueCardListDesktop {...props} />,
  renderContent: (searchBar, tabBar, cardList) => (
    <DesktopSectionPanel actions={searchBar}>
      {tabBar}
      {cardList}
    </DesktopSectionPanel>
  ),
};

export const MOBILE_OPTIONS: AdminComplaintsSharedOptions = {
  renderPageContainer: children => <MobilePageContainer>{children}</MobilePageContainer>,
  renderPageHeader: (title, subtitle) => <MobilePageHeader title={title} subtitle={subtitle} />,
  renderMetricsRow: (summary, labels) => <ComplaintsMetricsRowMobile summary={summary} labels={labels} />,
  renderSearchBar: (value, placeholder, onChange) => (
    <ComplaintsSearchBarMobile value={value} placeholder={placeholder} onChange={onChange} />
  ),
  renderTabBar: (activeTab, unansweredCount, answeredCount, labels, onTabChange) => (
    <ComplaintsTabBarMobile
      activeTab={activeTab}
      unansweredCount={unansweredCount}
      answeredCount={answeredCount}
      labels={labels}
      onTabChange={onTabChange}
    />
  ),
  renderCardList: props => <ComplaintQueueCardListMobile {...props} />,
  renderContent: (searchBar, tabBar, cardList) => (
    <MobileContentStack gap={3} paddingBottom={4}>
      <MobileContentInset>{searchBar}</MobileContentInset>
      <MobileContentInset>{tabBar}</MobileContentInset>
      {cardList}
    </MobileContentStack>
  ),
};
