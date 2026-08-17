/**
 * Mock for next/dynamic to make lazy-loaded components render synchronously in tests
 * This preload must be registered before tests that use ResponsiveViewSwitch
 */
import { mock } from "bun:test";
import type React from "react";
import { createElement, useState } from "react";

// Type guard: narrows `unknown` to a React component type so we can pass it to
// createElement without an unsafe `as` assertion (oxlint no-unsafe-type-assertion).
function isComponentType(value: unknown): value is React.ComponentType<unknown> {
  return typeof value === "function";
}

// Cache for loaded modules. The cached views have heterogeneous, view-specific prop
// types (Readonly<ScheduleOverviewViewModel>, Readonly<PendingReviewsViewModel>, ...),
// so no single non-`any` ComponentType<P> is a sound supertype of all of them. We store
// components as `unknown` and use the `isComponentType` type guard on retrieval to
// safely narrow back to ComponentType<unknown> — createElement then accepts props of
// any generic type T since T extends Record<string, unknown> is assignable to unknown.
const moduleCache = new Map<string, unknown>();

function cacheComponent<TProps extends Record<string, unknown>>(
  key: string,
  component: React.ComponentType<TProps>
): void {
  // ComponentType<TProps> is assignable to `unknown` — no assertion needed.
  const entry: unknown = component;
  moduleCache.set(key, entry);
}

// Pre-load all lazy views synchronously by importing them directly
async function preloadViews() {
  try {
    // Import mobile views
    const [mobileScheduleOverview, mobilePendingReviews, mobileSearchSchedule, mobileCron] = await Promise.all([
      import("@/frontend/mobile/views/dashboard/admin/home/scheduleOverview/scheduleOverview.mobile"),
      import("@/frontend/mobile/views/dashboard/supervisor/lesson-reviews/pendingReviews.mobile"),
      import("@/frontend/mobile/views/dashboard/search-schedule/searchSchedule.mobile"),
      import("@/frontend/mobile/views/dashboard/cron/cronView.mobile"),
    ]);
    cacheComponent("mobile-scheduleOverview", mobileScheduleOverview.ScheduleOverviewMobileView);
    cacheComponent("mobile-pendingReviews", mobilePendingReviews.PendingReviewsMobileView);
    cacheComponent("mobile-searchSchedule", mobileSearchSchedule.SearchScheduleMobileView);
    cacheComponent("mobile-cron", mobileCron.CronMobileView);

    // Import desktop views
    const [desktopScheduleOverview, desktopPendingReviews, desktopSearchSchedule, desktopCron] = await Promise.all([
      import("@/frontend/desktop/views/dashboard/admin/home/scheduleOverview/scheduleOverview.desktop"),
      import("@/frontend/desktop/views/dashboard/supervisor/lesson-reviews/pendingReviews.desktop"),
      import("@/frontend/desktop/views/dashboard/search-schedule/searchSchedule.desktop"),
      import("@/frontend/desktop/views/dashboard/cron/cronView.desktop"),
    ]);
    cacheComponent("desktop-scheduleOverview", desktopScheduleOverview.ScheduleOverviewDesktopView);
    cacheComponent("desktop-pendingReviews", desktopPendingReviews.PendingReviewsDesktopView);
    cacheComponent("desktop-searchSchedule", desktopSearchSchedule.SearchScheduleDesktopView);
    cacheComponent("desktop-cron", desktopCron.CronDesktopView);
  } catch (err) {
    globalThis.console.error("Failed to preload views:", err);
  }
}

// Start preloading immediately
void preloadViews();

void mock.module("next/dynamic", () => {
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
    } else if (importerStr.includes("searchSchedule.mobile")) {
      cacheKey = "mobile-searchSchedule";
    } else if (importerStr.includes("searchSchedule.desktop")) {
      cacheKey = "desktop-searchSchedule";
    } else if (importerStr.includes("cronView.mobile")) {
      cacheKey = "mobile-cron";
    } else if (importerStr.includes("cronView.desktop")) {
      cacheKey = "desktop-cron";
    } else {
      // For any other dynamic imports, use the function string as key
      cacheKey = importerStr;
    }

    // Create component that resolves the importer for uncached dynamic imports.
    // Uses a state + promise pattern that works with findByTestId (async polling).
    const cached = moduleCache.get(cacheKey);
    let resolvedComp: React.ComponentType<unknown> | null = cached && isComponentType(cached) ? cached : null;
    let _importPromise: Promise<React.ComponentType<unknown>> | null = null;

    const DynamicComponent = (props: T): React.ReactNode => {
      const [, forceRender] = useState({});

      let content: React.ReactNode;
      if (resolvedComp) {
        content = createElement(resolvedComp, props);
      } else {
        _importPromise ??= importer().then(mod => {
          const comp: unknown = mod.default;
          if (isComponentType(comp)) {
            moduleCache.set(cacheKey, comp);
            resolvedComp = comp;
            forceRender({});
            return comp;
          }
          throw new Error(`Dynamic import for ${cacheKey} did not resolve to a component`);
        });
        content = options?.loading?.() ?? null;
      }

      return content;
    };

    DynamicComponent.displayName = "DynamicComponent";
    return DynamicComponent;
  };

  return { default: dynamic };
});

export { moduleCache };
