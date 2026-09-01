import type { TabNavVariantProps } from "@/frontend/common/views/dashboard/lib/tabbedPane";

export interface DateTabNavItem<TabId extends string = string> {
  readonly id: TabId;
  readonly weekdayLabel: string;
  readonly dayNumber: number;
  readonly hasSession: boolean;
}

type DefaultGenericTabNavVariantProps<TabId extends string> = TabNavVariantProps<TabId> & {
  readonly variant?: "default";
  readonly ariaLabel: string;
};

export type DateGenericTabNavVariantProps<TabId extends string> = {
  readonly variant: "date";
  readonly mode: "button";
  readonly activeTab: TabId;
  readonly tabs: readonly DateTabNavItem<TabId>[];
  readonly onTabChange: (id: TabId) => void;
  readonly ariaLabel: string;
};

export type GenericTabNavVariantProps<TabId extends string> =
  | DefaultGenericTabNavVariantProps<TabId>
  | DateGenericTabNavVariantProps<TabId>;

export function isDateTabNavProps<TabId extends string>(
  props: GenericTabNavVariantProps<TabId>
): props is DateGenericTabNavVariantProps<TabId> {
  return props.variant === "date";
}
