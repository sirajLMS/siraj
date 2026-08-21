import { BadgeOutlined, Diversity1Outlined, PersonOutlined, SchoolOutlined } from "@mui/icons-material";
import type { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql";
import { PAGE_PERMISSIONS } from "@/frontend/common/types/page-permissions.types";
import { getVisibleTabs, type TabDefinition } from "@/frontend/common/views/dashboard/lib/tabbedPane";
import type {
  UsersDirectoryTabId,
  UsersDirectoryTabLabelKey,
} from "@/frontend/common/views/dashboard/users/directory/tabs/types";

export const USERS_DIRECTORY_TABS: readonly TabDefinition<UsersDirectoryTabId, UsersDirectoryTabLabelKey>[] = [
  { id: "teachers", labelKey: "teachers", permissions: PAGE_PERMISSIONS.usersTeachers, icon: SchoolOutlined },
  { id: "parents", labelKey: "parents", permissions: PAGE_PERMISSIONS.usersParents, icon: Diversity1Outlined },
  { id: "students", labelKey: "students", permissions: PAGE_PERMISSIONS.usersStudents, icon: PersonOutlined },
  { id: "staff", labelKey: "staff", permissions: PAGE_PERMISSIONS.usersStaff, icon: BadgeOutlined },
] as const;

export function getVisibleUsersDirectoryTabs(
  hasPermission: (permission: AppPermission) => boolean
): TabDefinition<UsersDirectoryTabId, UsersDirectoryTabLabelKey>[] {
  return getVisibleTabs<UsersDirectoryTabId, UsersDirectoryTabLabelKey>(USERS_DIRECTORY_TABS, hasPermission);
}
