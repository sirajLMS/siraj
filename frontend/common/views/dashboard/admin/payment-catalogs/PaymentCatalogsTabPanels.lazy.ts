import { lazy } from "react";

export const LazyPaymentCatalogsTab = lazy(() =>
  import("@/frontend/common/views/dashboard/admin/payment-catalogs/tabs/paymentCatalogs/PaymentCatalogsTab").then(
    m => ({
      default: m.PaymentCatalogsTab,
    })
  )
);

export const LazyMeetingProvidersTab = lazy(() =>
  import("@/frontend/common/views/dashboard/admin/payment-catalogs/tabs/meetingProviders/MeetingProvidersTab").then(
    m => ({
      default: m.MeetingProvidersTab,
    })
  )
);
