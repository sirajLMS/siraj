"use client";

import { createTabbedPaneStore } from "@/frontend/common/stores/createTabbedPaneStore";
import { BILLING_TAB_IDS, type BillingTabId } from "@/frontend/common/views/dashboard/billing/tabs/types";

export const useBillingTabsStore = createTabbedPaneStore<BillingTabId>(BILLING_TAB_IDS);
