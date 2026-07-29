"use client";

import { createLazyView } from "@/frontend/common/components/ui/container/createLazyView";
import { ResponsiveViewSwitch } from "@/frontend/common/components/ui/container/ResponsiveViewSwitch";
import type { TabNavVariantProps } from "@/frontend/common/views/dashboard/lib/tabbedPane";

export type GenericTabNavVariantProps<TabId extends string> = TabNavVariantProps<TabId> & {
  /** Optional aria-label for the mobile tablist. Defaults to "Sections". */
  readonly ariaLabel?: string;
};

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
 * TIL: We mirror `SettingsTabNav` exactly to keep the tier contract intact
 * — a single shared/tier-neutral entry that delegates to per-tier lazy
 * views via `createLazyView` + `ResponsiveViewSwitch`. Inline-rendering
 * either tier here would break the convention that tier-specific styling
 * (the chip row scrollrail on mobile vs the MUI Tabs on desktop) lives in
 * its own tier-named file.
 */
export function GenericTabNav<TabId extends string>(props: Readonly<GenericTabNavVariantProps<TabId>>) {
  if (props.tabs.length === 0) {
    return null;
  }

  return (
    <ResponsiveViewSwitch
      mobile={lazyViews.mobile as never}
      desktop={lazyViews.desktop as never}
      props={props as GenericTabNavVariantProps<string>}
    />
  );
}
