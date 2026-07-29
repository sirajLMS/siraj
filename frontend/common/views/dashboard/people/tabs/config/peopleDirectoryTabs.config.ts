import { BadgeOutlined, Diversity1Outlined, PersonOutlineOutlined, SchoolOutlined } from "@mui/icons-material";
import type { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { PAGE_PERMISSIONS } from "@/frontend/common/types/page-permissions.types";
import type { TabDefinition } from "@/frontend/common/views/dashboard/lib/tabbedPane";
import { getVisibleTabs } from "@/frontend/common/views/dashboard/lib/tabbedPane";
import type {
  PeopleDirectoryTabId,
  PeopleDirectoryTabLabelKey,
} from "@/frontend/common/views/dashboard/people/tabs/types";

export const PEOPLE_DIRECTORY_TABS: readonly TabDefinition<PeopleDirectoryTabId, PeopleDirectoryTabLabelKey>[] = [
  { id: "teachers", labelKey: "teachers", permissions: PAGE_PERMISSIONS.peopleTeachers, icon: SchoolOutlined },
  { id: "parents", labelKey: "parents", permissions: PAGE_PERMISSIONS.peopleParents, icon: Diversity1Outlined },
  { id: "students", labelKey: "students", permissions: PAGE_PERMISSIONS.peopleStudents, icon: PersonOutlineOutlined },
  { id: "staff", labelKey: "staff", permissions: PAGE_PERMISSIONS.peopleStaff, icon: BadgeOutlined },
] as const;

export function getVisiblePeopleDirectoryTabs(
  hasPermission: (permission: AppPermission) => boolean
): TabDefinition<PeopleDirectoryTabId, PeopleDirectoryTabLabelKey>[] {
  return getVisibleTabs<PeopleDirectoryTabId, PeopleDirectoryTabLabelKey>(PEOPLE_DIRECTORY_TABS, hasPermission);
}
