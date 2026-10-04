import type { PaletteMode } from "@mui/material";
import type { StoryContext } from "@storybook/nextjs-vite";
import { AccountStatus, CurrencyCode as CurrencyCodeEnum } from "@/frontend/common/graphql/generated/gql/graphql";
import { useUserStore } from "@/frontend/common/stores/userStore";
import { STORYBOOK_ADMIN_PERMISSIONS, type ViewportGlobal } from "./story-wrapper.constants";

function isLocale(value: unknown): value is "ar" | "en" {
  return value === "ar" || value === "en";
}

function isViewport(value: unknown): value is ViewportGlobal {
  return value === "mobile" || value === "tablet" || value === "desktop";
}

function isPaletteMode(value: unknown): value is PaletteMode {
  return value === "light" || value === "dark";
}

export function checkIsUiComponent(context: StoryContext): boolean {
  if (context.parameters?.fileName?.includes("frontend/components/ui/")) {
    return true;
  }
  if (context.title?.startsWith("UI/")) {
    return true;
  }
  return context.title?.startsWith("Form/") ?? false;
}

type StorybookGlobals = {
  locale: "ar" | "en";
  themeMode: PaletteMode;
  viewport: ViewportGlobal;
  direction: "rtl" | "ltr";
};

export function resolveStorybookGlobals(context: StoryContext): StorybookGlobals {
  const globals = context.globals as Record<string, unknown>;
  const locale = isLocale(globals.locale) ? globals.locale : "ar";
  const themeMode: PaletteMode = isPaletteMode(globals.theme) ? globals.theme : "dark";
  const viewport = isViewport(globals.viewport) ? globals.viewport : "desktop";
  const direction: "rtl" | "ltr" = locale === "ar" ? "rtl" : "ltr";
  return { locale, themeMode, viewport, direction };
}

/** Seeds the user store with admin permissions by default for Storybook. */
export function seedStorybookAdminUser(): void {
  const adminPermissions = STORYBOOK_ADMIN_PERMISSIONS;
  const adminUser = {
    id: "mock-admin-id",
    name: "Admin",
    role: "Admin",
    avatarUrl: "",
    permissions: adminPermissions,
    notificationCount: 3,
    teacherId: null,
    parentId: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    emailVerifiedAt: new Date().toISOString(),
    email: "admin@example.com",
    phone: null,
    status: AccountStatus.Activated,
    displayCurrency: CurrencyCodeEnum.Usd,
    __typename: "User" as const,
  };

  useUserStore.setState({
    user: adminUser,
    name: adminUser.name,
    role: adminUser.role,
    avatarUrl: adminUser.avatarUrl,
    permissions: adminPermissions,
    notificationCount: adminUser.notificationCount,
    displayCurrency: adminUser.displayCurrency,
  });
}
