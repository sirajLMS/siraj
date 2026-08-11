"use client";

import { createLazyView } from "@/frontend/common/components/ui/container/createLazyView";
import { ResponsiveViewSwitch } from "@/frontend/common/components/ui/container/ResponsiveViewSwitch";
import {
  type AdminSuggestionsViewModel,
  useAdminSuggestionsViewModel,
} from "@/frontend/common/views/dashboard/suggestions/useAdminSuggestionsViewModel";

const lazyViews = createLazyView<AdminSuggestionsViewModel>(
  () =>
    import("@/frontend/mobile/views/dashboard/suggestions/adminSuggestions.mobile").then(m => ({
      default: m.AdminSuggestionsMobileView,
    })),
  () =>
    import("@/frontend/desktop/views/dashboard/suggestions/adminSuggestions.desktop").then(m => ({
      default: m.AdminSuggestionsDesktopView,
    }))
);

export function AdminSuggestionsContainer() {
  const viewModel = useAdminSuggestionsViewModel();

  return <ResponsiveViewSwitch mobile={lazyViews.mobile} desktop={lazyViews.desktop} props={viewModel} />;
}
