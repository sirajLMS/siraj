"use client";

import { Box, CircularProgress } from "@mui/material";
import { type ComponentType, lazy, Suspense } from "react";
import { RequirePermission } from "@/frontend/common/components/auth/RequirePermission";
import { useFeedbackManageTabsStore } from "@/frontend/common/stores/feedbackManageTabsStore";
import { PAGE_PERMISSIONS } from "@/frontend/common/types/page-permissions.types";
import type { FeedbackManageTabId } from "@/frontend/common/views/dashboard/feedback/tabs/types";

type FeedbackManageTabPanelsProps = { readonly activeTab: FeedbackManageTabId };
type TabPanelDefinition = {
  readonly id: FeedbackManageTabId;
  readonly permissions: (typeof PAGE_PERMISSIONS)[keyof typeof PAGE_PERMISSIONS];
  readonly Component: ComponentType;
};

const LazyComplaintsTab = lazy(() =>
  import("@/frontend/common/views/dashboard/feedback/tabs/complaints/ComplaintsTab").then(m => ({
    default: m.ComplaintsTab,
  }))
);
const LazySuggestionsTab = lazy(() =>
  import("@/frontend/common/views/dashboard/feedback/tabs/suggestions/SuggestionsTab").then(m => ({
    default: m.SuggestionsTab,
  }))
);

const TAB_PANELS: readonly TabPanelDefinition[] = [
  { id: "complaints", permissions: PAGE_PERMISSIONS.feedbackComplaints, Component: LazyComplaintsTab },
  { id: "suggestions", permissions: PAGE_PERMISSIONS.feedbackSuggestions, Component: LazySuggestionsTab },
];

function TabPanelFallback() {
  return (
    <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
      <CircularProgress size={28} />
    </Box>
  );
}

function getTabPanelSx(isActive: boolean) {
  return isActive
    ? {
        position: "relative" as const,
        width: "100%",
        visibility: "visible" as const,
        overflow: "visible" as const,
        pointerEvents: "auto" as const,
      }
    : {
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

export function FeedbackManageTabPanels({ activeTab }: Readonly<FeedbackManageTabPanelsProps>) {
  const visitedTabs = useFeedbackManageTabsStore(state => state.visitedTabs);
  return (
    <Box sx={{ position: "relative", width: "100%" }}>
      {TAB_PANELS.map(({ id, permissions, Component }) => {
        if (!visitedTabs[id]) return null;
        const isActive = activeTab === id;
        return (
          <Box
            key={id}
            role="tabpanel"
            id={`feedback-manage-tabpanel-${id}`}
            aria-labelledby={`feedback-manage-tab-${id}`}
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
