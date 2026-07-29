import { createTabbedPaneStore } from "@/frontend/common/stores/createTabbedPaneStore";
import {
  PEOPLE_DIRECTORY_TAB_IDS,
  type PeopleDirectoryTabId,
} from "@/frontend/common/views/dashboard/people/tabs/types";

export const usePeopleDirectoryTabsStore = createTabbedPaneStore<PeopleDirectoryTabId>(PEOPLE_DIRECTORY_TAB_IDS);
