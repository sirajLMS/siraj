"use client";

import { createLazyView } from "@/frontend/components/ui/container/createLazyView";
import { ResponsiveViewSwitch } from "@/frontend/components/ui/container/ResponsiveViewSwitch";
import type { AdminSuggestionsViewModel } from "@/frontend/views/dashboard/suggestions/useAdminSuggestionsViewModel";

export type { AdminSuggestionsViewModel };

const lazyViews = createLazyView<AdminSuggestionsViewModel>(
  () =>
    import("@/frontend/views/dashboard/suggestions/mobile/adminSuggestions.mobile").then(m => ({
      default: m.AdminSuggestionsMobileView,
    })),
  () =>
    import("@/frontend/views/dashboard/suggestions/desktop/adminSuggestions.desktop").then(m => ({
      default: m.AdminSuggestionsDesktopView,
    }))
);

export function AdminSuggestionsView(props: Readonly<AdminSuggestionsViewModel>) {
  return <ResponsiveViewSwitch mobile={lazyViews.mobile} desktop={lazyViews.desktop} props={props} />;
}
