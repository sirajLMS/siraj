import { createTabbedPaneStore } from "@/frontend/common/stores/createTabbedPaneStore";
import {
  USERS_DIRECTORY_TAB_IDS,
  type UsersDirectoryTabId,
} from "@/frontend/common/views/dashboard/users/directory/tabs/types";

export const useUsersDirectoryTabsStore = createTabbedPaneStore<UsersDirectoryTabId>(USERS_DIRECTORY_TAB_IDS);
