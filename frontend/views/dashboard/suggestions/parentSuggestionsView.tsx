"use client";

import { createLazyView } from "@/frontend/common/components/ui/container/createLazyView";
import { ResponsiveViewSwitch } from "@/frontend/common/components/ui/container/ResponsiveViewSwitch";
import {
  type ParentSuggestionsViewModel,
  type UseParentSuggestionsViewModelProps,
  useParentSuggestionsViewModel,
} from "@/frontend/views/dashboard/suggestions/useParentSuggestionsViewModel";

export type { ParentSuggestionsViewModel };

const lazyViews = createLazyView<ParentSuggestionsViewModel>(
  () =>
    import("@/frontend/mobile/views/dashboard/suggestions/parentSuggestions.mobile").then(m => ({
      default: m.ParentSuggestionsMobileView,
    })),
  () =>
    import("@/frontend/desktop/views/dashboard/suggestions/parentSuggestions.desktop").then(m => ({
      default: m.ParentSuggestionsDesktopView,
    }))
);

export function ParentSuggestionsView(props: Readonly<UseParentSuggestionsViewModelProps>) {
  const viewModel = useParentSuggestionsViewModel(props);
  return <ResponsiveViewSwitch mobile={lazyViews.mobile} desktop={lazyViews.desktop} props={viewModel} />;
}
