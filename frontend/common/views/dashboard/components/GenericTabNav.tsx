"use client";

import { createLazyView } from "@/frontend/common/components/ui/container/createLazyView";
import { ResponsiveViewSwitch } from "@/frontend/common/components/ui/container/ResponsiveViewSwitch";
import type { GenericTabNavVariantProps } from "@/frontend/common/views/dashboard/components/genericTabNav.types";

export type {
  DateTabNavItem,
  GenericTabNavVariantProps,
} from "@/frontend/common/views/dashboard/components/genericTabNav.types";

const lazyViews = createLazyView<GenericTabNavVariantProps<string>>(
  () =>
    import("@/frontend/mobile/views/dashboard/components/genericTabNav.mobile").then(m => ({
      default: m.GenericTabNavMobileView,
    })),
  () =>
    import("@/frontend/desktop/views/dashboard/components/genericTabNav.desktop").then(m => ({
      default: m.GenericTabNavDesktopView,
    }))
);

/**
 * Generic tab nav — replicates `SettingsTabNav` for any tabbed parent page.
 * The desktop tier uses MUI `<Tabs>` with Next.js `<Link scroll={false}>`;
 * the mobile tier uses a chip row via `MobileHorizontalScrollRow`. Tabs are
 * entirely owned by the caller's ViewModel (resolved against permissions),
 * so this component never reads search params itself.
 *
 * Supports `variant="date"` for scrollable month-day strips (button mode).
 */
export function GenericTabNav<TabId extends string>(props: Readonly<GenericTabNavVariantProps<TabId>>) {
  if (props.tabs.length === 0) {
    return null;
  }

  return (
    <ResponsiveViewSwitch
      mobile={lazyViews.mobile}
      desktop={lazyViews.desktop}
      props={props as GenericTabNavVariantProps<string>}
    />
  );
}
