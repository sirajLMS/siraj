/**
 * Mock for next/dynamic to make lazy-loaded components render synchronously in tests
 * This preload must be registered before tests that use ResponsiveViewSwitch
 */
import { mock } from "bun:test";
import React from "react";

// Cache for loaded modules. The cached views have heterogeneous, view-specific prop
// types (Readonly<ScheduleOverviewViewModel>, Readonly<PendingReviewsViewModel>, ...),
// so no single non-`any` ComponentType<P> is a sound supertype of all of them. We
// therefore store them under the empty-props component type and assert on insertion;
// the retrieved component is re-cast to ComponentType<T> at the call site so
// React.createElement receives a prop-compatible component for the generic prop type T.
const moduleCache = new Map<string, React.ComponentType<Record<string, never>>>();

// Helper that absorbs any concrete view component and stores it under the empty-props
// cache type. The assertion is intentional: dropping prop-type specificity in the
// cache is safe because the caller always re-casts to the correct prop type on read.
function cacheComponent<TProps>(key: string, component: React.ComponentType<TProps>): void {
  moduleCache.set(key, component as unknown as React.ComponentType<Record<string, never>>);
}

// Pre-load all lazy views synchronously by importing them directly
async function preloadViews() {
  try {
    // Import mobile views
    const [mobileScheduleOverview, mobilePendingReviews] = await Promise.all([
      import("@/frontend/mobile/views/dashboard/admin/home/scheduleOverview/scheduleOverview.mobile"),
      import("@/frontend/mobile/views/dashboard/supervisor/lesson-reviews/pendingReviews.mobile"),
    ]);
    cacheComponent("mobile-scheduleOverview", mobileScheduleOverview.ScheduleOverviewMobileView);
    cacheComponent("mobile-pendingReviews", mobilePendingReviews.PendingReviewsMobileView);

    // Import desktop views
    const [desktopScheduleOverview, desktopPendingReviews] = await Promise.all([
      import("@/frontend/desktop/views/dashboard/admin/home/scheduleOverview/scheduleOverview.desktop"),
      import("@/frontend/desktop/views/dashboard/supervisor/lesson-reviews/pendingReviews.desktop"),
    ]);
    cacheComponent("desktop-scheduleOverview", desktopScheduleOverview.ScheduleOverviewDesktopView);
    cacheComponent("desktop-pendingReviews", desktopPendingReviews.PendingReviewsDesktopView);
  } catch (err) {
    globalThis.console.error("Failed to preload views:", err);
  }
}

// Start preloading immediately
preloadViews();

mock.module("next/dynamic", () => {
  const dynamic = <T extends Record<string, unknown>>(
    importer: () => Promise<{ default: React.ComponentType<T> }>,
    options?: { ssr?: boolean; loading?: () => React.ReactNode }
  ) => {
    // Determine which view this is based on the importer function
    const importerStr = importer.toString();
    let cacheKey: string;

    if (importerStr.includes("scheduleOverview.mobile")) {
      cacheKey = "mobile-scheduleOverview";
    } else if (importerStr.includes("scheduleOverview.desktop")) {
      cacheKey = "desktop-scheduleOverview";
    } else if (importerStr.includes("pendingReviews.mobile")) {
      cacheKey = "mobile-pendingReviews";
    } else if (importerStr.includes("pendingReviews.desktop")) {
      cacheKey = "desktop-pendingReviews";
    } else {
      // For any other dynamic imports, use the function string as key
      cacheKey = importerStr;
    }

    // Create synchronous component
    const DynamicComponent = ({ ...props }: T) => {
      const Component = moduleCache.get(cacheKey);

      if (Component) {
        // Re-cast the cached empty-props component to ComponentType<T> so
        // React.createElement receives a prop-compatible component for props: T.
        const TypedComponent = Component as unknown as React.ComponentType<T>;
        return React.createElement(TypedComponent, props);
      }

      // Show loading or null if not loaded yet
      return options?.loading?.() ?? null;
    };

    DynamicComponent.displayName = "DynamicComponent";
    return DynamicComponent;
  };

  return { default: dynamic };
});

export { moduleCache };
