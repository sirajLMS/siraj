"use client";

import { usePaymentCatalogsTabsStore } from "@/frontend/common/stores/paymentCatalogsTabsStore";
import { PAGE_PERMISSIONS } from "@/frontend/common/types/page-permissions.types";
import {
  LazyMeetingProvidersTab,
  LazyPaymentCatalogsTab,
} from "@/frontend/common/views/dashboard/admin/payment-catalogs/PaymentCatalogsTabPanels.lazy";
import type { PaymentCatalogsTabId } from "@/frontend/common/views/dashboard/admin/payment-catalogs/tabs/types";
import { createTabbedPanePanels } from "@/frontend/common/views/dashboard/lib/createTabbedPanePanels";

export const PaymentCatalogsTabPanels = createTabbedPanePanels<PaymentCatalogsTabId>({
  useVisitedTabs: () => usePaymentCatalogsTabsStore(state => state.visitedTabs),
  ariaIdPrefix: "payment-catalogs",
  panels: [
    {
      id: "paymentCatalogs",
      permissions: PAGE_PERMISSIONS.paymentCatalogsTab,
      Component: LazyPaymentCatalogsTab,
    },
    {
      id: "meetingProviders",
      permissions: PAGE_PERMISSIONS.paymentCatalogsMeetingProviders,
      Component: LazyMeetingProvidersTab,
    },
  ],
});
