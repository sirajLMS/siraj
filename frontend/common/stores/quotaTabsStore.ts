"use client";

import { createTabbedPaneStore } from "@/frontend/common/stores/createTabbedPaneStore";
import { QUOTA_TAB_IDS, type QuotaTabId } from "@/frontend/common/views/dashboard/billing/quota/tabs/types";

export const useQuotaTabsStore = createTabbedPaneStore<QuotaTabId>(QUOTA_TAB_IDS);
