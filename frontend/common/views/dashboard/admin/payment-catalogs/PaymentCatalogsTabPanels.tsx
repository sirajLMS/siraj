"use client";

import { Box, CircularProgress } from "@mui/material";
import { type ComponentType, lazy, Suspense } from "react";
import { RequirePermission } from "@/frontend/common/components/auth/RequirePermission";
import { usePaymentCatalogsTabsStore } from "@/frontend/common/stores/paymentCatalogsTabsStore";
import { PAGE_PERMISSIONS } from "@/frontend/common/types/page-permissions.types";
import type { PaymentCatalogsTabId } from "@/frontend/common/views/dashboard/admin/payment-catalogs/tabs/types";

type PaymentCatalogsTabPanelsProps = {
  readonly activeTab: PaymentCatalogsTabId;
};

type TabPanelDefinition = {
  readonly id: PaymentCatalogsTabId;
  readonly permissions: (typeof PAGE_PERMISSIONS)[keyof typeof PAGE_PERMISSIONS];
  readonly Component: ComponentType;
};

const LazyPaymentCatalogsTab = lazy(() =>
  import("@/frontend/common/views/dashboard/admin/payment-catalogs/tabs/paymentCatalogs/PaymentCatalogsTab").then(
    m => ({
      default: m.PaymentCatalogsTab,
    })
  )
);

const LazyMeetingProvidersTab = lazy(() =>
  import("@/frontend/common/views/dashboard/admin/payment-catalogs/tabs/meetingProviders/MeetingProvidersTab").then(
    m => ({
      default: m.MeetingProvidersTab,
    })
  )
);

const TAB_PANELS: readonly TabPanelDefinition[] = [
  { id: "paymentCatalogs", permissions: PAGE_PERMISSIONS.paymentCatalogsTab, Component: LazyPaymentCatalogsTab },
  {
    id: "meetingProviders",
    permissions: PAGE_PERMISSIONS.paymentCatalogsMeetingProviders,
    Component: LazyMeetingProvidersTab,
  },
];

function TabPanelFallback() {
  return (
    <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
      <CircularProgress size={28} />
    </Box>
  );
}

function getTabPanelSx(isActive: boolean) {
  if (isActive) {
    return {
      position: "relative" as const,
      width: "100%",
      visibility: "visible" as const,
      overflow: "visible" as const,
      pointerEvents: "auto" as const,
    };
  }
  return {
    position: "absolute" as const,
    top: 0,
    left: 0,
    width: "100%",
    visibility: "hidden" as const,
    height: 0,
    overflow: "hidden" as const,
    pointerEvents: "none" as const,
  };
}

export function PaymentCatalogsTabPanels({ activeTab }: Readonly<PaymentCatalogsTabPanelsProps>) {
  const visitedTabs = usePaymentCatalogsTabsStore(state => state.visitedTabs);

  return (
    <Box sx={{ position: "relative", width: "100%" }}>
      {TAB_PANELS.map(({ id, permissions, Component }) => {
        if (!visitedTabs[id]) {
          return null;
        }
        const isActive = activeTab === id;
        return (
          <Box
            key={id}
            role="tabpanel"
            id={`payment-catalogs-tabpanel-${id}`}
            aria-labelledby={`payment-catalogs-tab-${id}`}
            aria-hidden={!isActive}
            sx={getTabPanelSx(isActive)}
          >
            <RequirePermission permissions={permissions} fallback={null}>
              <Suspense fallback={<TabPanelFallback />}>
                <Component />
              </Suspense>
            </RequirePermission>
          </Box>
        );
      })}
    </Box>
  );
}
