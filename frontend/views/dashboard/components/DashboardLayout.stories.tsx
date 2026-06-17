import type { Meta, StoryObj } from "@storybook/react";
import { usePathname, useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { useLayoutStore } from "@/frontend/stores/layoutStore";
import { useUserStore } from "@/frontend/stores/mockUserStore";
import {
  BOTTOM_NAV_ITEMS,
  getNavItemsForPermissions,
  SIDEBAR_NAV_ITEMS,
} from "@/frontend/views/dashboard/config/mockNavigationConfig";
import { DashboardLayout } from "./DashboardLayout";

interface MockDashboardLayoutContainerProps {
  readonly children?: ReactNode;
}

function MockDashboardLayoutContainer({ children }: MockDashboardLayoutContainerProps) {
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();
  const t = useTranslations("dashboard.admin");

  // Read Zustand stores
  const { sidebarOpen, mobileDrawerOpen, toggleSidebar, toggleMobileDrawer, closeMobileDrawer } = useLayoutStore();
  const { name, role, avatarUrl, permissions, notificationCount } = useUserStore();

  // Derive filtered nav items from permissions
  const sidebarItems = getNavItemsForPermissions(SIDEBAR_NAV_ITEMS, permissions);
  const bottomNavItems = getNavItemsForPermissions(BOTTOM_NAV_ITEMS, permissions);

  // Determine active nav key from current pathname
  const pathWithoutLocale = pathname.replace(`/${locale}`, "") || "/dashboard";
  const activeNavKey = sidebarItems.find(item => pathWithoutLocale.startsWith(item.href))?.key ?? "home";

  const handleNavigate = (href: string) => {
    router.push(`/${locale}${href}`);
  };

  return (
    <DashboardLayout
      sidebarItems={sidebarItems}
      bottomNavItems={bottomNavItems}
      activeNavKey={activeNavKey}
      userName={name}
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
