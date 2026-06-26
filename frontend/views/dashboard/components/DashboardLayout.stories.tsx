import type { Meta, StoryObj } from "@storybook/react";
import { useLocale, useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { useUserStore } from "@/frontend/stores/userStore";
import { BOTTOM_NAV_ITEMS, SIDEBAR_NAV_ITEMS } from "@/frontend/views/dashboard/config/mockNavigationConfig";
import { SidebarShell, type TranslatedNavItem } from "./client/SidebarShell";
import { DashboardLayoutPreview } from "./DashboardLayoutPreview";
import { useDashboardLayoutProps } from "./useDashboardLayoutProps";

interface MockDashboardLayoutContainerProps {
  readonly children?: ReactNode;
}

function MockDashboardLayoutContainer({ children }: MockDashboardLayoutContainerProps) {
  const t = useTranslations("dashboard.admin");
  const tNav = useTranslations();
  const locale = useLocale();
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
      sidebar={
        <SidebarShell navItems={translatedSidebarItems} activeKey={activeNavKey} locale={locale} sidebarWidth="260px" />
      }
      bottomNavItems={translatedBottomNavItems}
      activeNavKey={activeNavKey}
      locale={locale}
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
