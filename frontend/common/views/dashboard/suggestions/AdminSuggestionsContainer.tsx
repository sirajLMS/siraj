"use client";

import { RequirePermission } from "@/frontend/common/components/auth/RequirePermission";
import { createLazyView } from "@/frontend/common/components/ui/container/createLazyView";
import { ResponsiveViewSwitch } from "@/frontend/common/components/ui/container/ResponsiveViewSwitch";
import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql-types";
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

  return (
    <RequirePermission permissions={[AppPermission.SuggestionsList]}>
      <ResponsiveViewSwitch mobile={lazyViews.mobile} desktop={lazyViews.desktop} props={viewModel} />
    </RequirePermission>
  );
}

export type { AdminSuggestionsViewModel } from "@/frontend/common/views/dashboard/suggestions/useAdminSuggestionsViewModel";
