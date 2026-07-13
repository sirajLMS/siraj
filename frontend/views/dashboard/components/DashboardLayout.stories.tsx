import type { Meta, StoryObj } from "@storybook/react";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { useUserStore } from "@/frontend/common/stores/userStore";
import { SidebarShell, type TranslatedNavItem } from "@/frontend/views/dashboard/components/client/SidebarShell";
import { DashboardLayoutPreview } from "@/frontend/views/dashboard/components/DashboardLayoutPreview";
import { useDashboardLayoutProps } from "@/frontend/views/dashboard/components/useDashboardLayoutProps";
import { BOTTOM_NAV_ITEMS, SIDEBAR_NAV_ITEMS } from "@/frontend/views/dashboard/config/mockNavigationConfig";

interface MockDashboardLayoutContainerProps {
  readonly children?: ReactNode;
}

function MockDashboardLayoutContainer({ children }: MockDashboardLayoutContainerProps) {
  const t = useTranslations("dashboard.admin");
  const tNav = useTranslations();
  const { name, avatarUrl, permissions, notificationCount, user } = useUserStore();

  const { sidebarItems, bottomNavItems, activeNavKey } = useDashboardLayoutProps({
    sidebarNavItems: SIDEBAR_NAV_ITEMS,
    bottomNavItems: BOTTOM_NAV_ITEMS,
    permissions,
  });

  const translatedSidebarItems: TranslatedNavItem[] = sidebarItems.map(item => ({
    ...item,
    label: tNav(item.labelKey),
  }));

  const translatedBottomNavItems: TranslatedNavItem[] = bottomNavItems.map(item => ({
    ...item,
    label: tNav(item.labelKey),
  }));

  return (
    <DashboardLayoutPreview
      sidebar={<SidebarShell navItems={translatedSidebarItems} activeKey={activeNavKey} sidebarWidth="260px" />}
      bottomNavItems={translatedBottomNavItems}
      activeNavKey={activeNavKey}
      userName={name}
      userEmail={user?.email || "mock@example.com"}
      roleLabel={t("roleLabel")}
      avatarUrl={avatarUrl}
      notificationCount={notificationCount}
    >
      {children}
    </DashboardLayoutPreview>
  );
}

const meta: Meta<typeof MockDashboardLayoutContainer> = {
  title: "Views/dashboard/components/DashboardLayoutContainer",
  component: MockDashboardLayoutContainer,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
};

export default meta;
type Story = StoryObj<typeof MockDashboardLayoutContainer>;

export const Default: Story = {
  args: {},
};
