"use client";

import { createLazyView } from "@/frontend/components/ui/container/createLazyView";
import { ResponsiveViewSwitch } from "@/frontend/components/ui/container/ResponsiveViewSwitch";
import type { SearchScheduleDraftFilters } from "@/frontend/common/stores/searchScheduleStore";

export interface SearchScheduleFilterDrawerProps {
  readonly open: boolean;
  readonly draft: SearchScheduleDraftFilters;
  readonly onClose: () => void;
  readonly onDraftChange: (draft: Partial<SearchScheduleDraftFilters>) => void;
  readonly onApply: () => void;
}

/**
 * Switcher for the Search Schedule filter drawer.
 *
 * This is the ONLY file in this domain that reads the viewport tier for the
 * filter drawer. It delegates rendering to either the mobile (bottom sheet)
 * or desktop (right-anchored panel) tier-specific variant. The form
 * (`SearchScheduleForm.tsx`) consumes this component with the same
 * `SearchScheduleFilterDrawerProps` interface.
 *
 * The mobile and desktop variants contain no viewport logic — they render
 * the drawer anchored and sized appropriately for their tier.
 */
const lazyViews = createLazyView<SearchScheduleFilterDrawerProps>(
  () =>
    import("@/frontend/views/dashboard/search-schedule/searchScheduleFilterDrawer.mobile").then(m => ({
      default: m.SearchScheduleFilterDrawerMobile,
    })),
  () =>
    import("@/frontend/views/dashboard/search-schedule/searchScheduleFilterDrawer.desktop").then(m => ({
      default: m.SearchScheduleFilterDrawerDesktop,
    }))
);

export function SearchScheduleFilterDrawer(props: Readonly<SearchScheduleFilterDrawerProps>) {
  return <ResponsiveViewSwitch mobile={lazyViews.mobile} desktop={lazyViews.desktop} props={props} />;
}
