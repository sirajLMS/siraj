import type { Meta, StoryObj } from "@storybook/react";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { useUserStore } from "@/frontend/stores/mockUserStore";
import { BOTTOM_NAV_ITEMS, SIDEBAR_NAV_ITEMS } from "@/frontend/views/dashboard/config/mockNavigationConfig";
import { DashboardLayout } from "./DashboardLayout";
import { useDashboardLayoutProps } from "./useDashboardLayoutProps";

interface MockDashboardLayoutContainerProps {
  readonly children?: ReactNode;
}

function MockDashboardLayoutContainer({ children }: MockDashboardLayoutContainerProps) {
  const t = useTranslations("dashboard.admin");
  const { name, role, avatarUrl, permissions, notificationCount, user } = useUserStore();

  const {
    sidebarItems,
    bottomNavItems,
    activeNavKey,
    sidebarOpen,
    mobileDrawerOpen,
    toggleSidebar,
    toggleMobileDrawer,
    closeMobileDrawer,
    handleNavigate,
  } = useDashboardLayoutProps({
    sidebarNavItems: SIDEBAR_NAV_ITEMS,
    bottomNavItems: BOTTOM_NAV_ITEMS,
    permissions,
  });

  return (
    <DashboardLayout
      sidebarItems={sidebarItems}
      bottomNavItems={bottomNavItems}
      activeNavKey={activeNavKey}
      userName={name}
      userEmail={user?.email || "mock@example.com"}
      userRole={role}
      roleLabel={t("roleLabel")}
      avatarUrl={avatarUrl}
      notificationCount={notificationCount}
      sidebarWidth="260px"
      navbarHeight="64px"
      sidebarOpen={sidebarOpen}
      mobileDrawerOpen={mobileDrawerOpen}
      onToggleSidebar={toggleSidebar}
      onToggleMobileDrawer={toggleMobileDrawer}
      onCloseMobileDrawer={closeMobileDrawer}
      onNavigate={handleNavigate}
    >
      {children}
    </DashboardLayout>
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
