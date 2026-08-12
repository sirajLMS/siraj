import { lazy } from "react";

export const LazyComplaintsTab = lazy(() =>
  import("@/frontend/common/views/dashboard/feedback/tabs/complaints/ComplaintsTab").then(m => ({
    default: m.ComplaintsTab,
  }))
);

export const LazySuggestionsTab = lazy(() =>
  import("@/frontend/common/views/dashboard/feedback/tabs/suggestions/SuggestionsTab").then(m => ({
    default: m.SuggestionsTab,
  }))
);
