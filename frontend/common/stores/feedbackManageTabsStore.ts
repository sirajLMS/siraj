"use client";

import { createTabbedPaneStore } from "@/frontend/common/stores/createTabbedPaneStore";
import {
  FEEDBACK_MANAGE_TAB_IDS,
  type FeedbackManageTabId,
} from "@/frontend/common/views/dashboard/feedback/tabs/types";

export const useFeedbackManageTabsStore = createTabbedPaneStore<FeedbackManageTabId>(FEEDBACK_MANAGE_TAB_IDS);
