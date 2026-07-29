import { createTabbedPaneStore } from "@/frontend/common/stores/createTabbedPaneStore";
import {
  PAYMENT_CATALOGS_TAB_IDS,
  type PaymentCatalogsTabId,
} from "@/frontend/common/views/dashboard/admin/payment-catalogs/tabs/types";

export const usePaymentCatalogsTabsStore = createTabbedPaneStore<PaymentCatalogsTabId>(PAYMENT_CATALOGS_TAB_IDS);
