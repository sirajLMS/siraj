import { PAGE_PERMISSIONS } from "@/frontend/common/types/page-permissions.types";
import { makeNavItem } from "@/frontend/common/views/dashboard/config/navigationItems.factory";
import { complaintsSubmitNavItem } from "@/frontend/common/views/dashboard/config/navigationItems.pinned";
import type { NavItem } from "@/frontend/common/views/dashboard/types/dashboard";

/**
 * Admin / feedback / integrations sidebar entries grouped under
 * `grp_admin` and `grp_integrations` (plus the parent feedback items).
 */
export const SIDEBAR_ADMIN_NAV_ITEMS: readonly NavItem[] = [
  makeNavItem(
    "feedback-manage",
    "feedbackManage",
    "reportProblem",
    "/feedback/manage",
    PAGE_PERMISSIONS.feedbackManageParent,
    {
      groupId: "grp_feedback",
    }
  ),
  makeNavItem(
    "suggestions-submit",
    "suggestionsSubmit",
    "lightbulb",
    "/suggestions",
    PAGE_PERMISSIONS.suggestionsSubmit,
    {
      audience: "parent",
    }
  ),
  complaintsSubmitNavItem,
  makeNavItem("dst-migration", "dstMigration", "update", "/tools/dst-migration", PAGE_PERMISSIONS.dstMigration, {
    groupId: "grp_admin",
  }),
  makeNavItem("cron", "cron", "eventRepeat", "/cron", PAGE_PERMISSIONS.cronManagement, { groupId: "grp_admin" }),
  makeNavItem("permissions", "permissions", "security", "/permissions", PAGE_PERMISSIONS.permissions, {
    groupId: "grp_admin",
  }),
  makeNavItem("settings", "settings", "settings", "/settings", PAGE_PERMISSIONS.settings, { groupId: "grp_admin" }),
  makeNavItem("whatsapp-settings", "whatsappSettings", "hub", "/settings/whatsapp", PAGE_PERMISSIONS.whatsappSettings, {
    groupId: "grp_integrations",
  }),
  makeNavItem(
    "whatsapp-conversations",
    "whatsappConversations",
    "chat",
    "/whatsapp",
    PAGE_PERMISSIONS.whatsappConversations,
    {
      groupId: "grp_integrations",
    }
  ),
  makeNavItem("whatsapp-groups", "whatsappGroups", "group", "/whatsapp/groups", PAGE_PERMISSIONS.whatsappGroups, {
    groupId: "grp_integrations",
  }),
];
