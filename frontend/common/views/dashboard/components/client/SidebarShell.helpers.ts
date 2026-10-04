import { useEffect } from "react";
import { useLayoutStore } from "@/frontend/common/stores/layoutStore";
import type {
  RenderedGroup,
  TranslatedNavGroup,
  TranslatedNavItem,
} from "@/frontend/common/views/dashboard/components/client/SidebarShell.types";
import { SIDEBAR_END_NAV_ITEM_KEYS } from "@/frontend/common/views/dashboard/config/navigationConfig";

/**
 * Splits the (filtered, translated) items into per-group buckets AND a
 * `noGroup` bucket for items that have no `groupId`. The `noGroup` items
 * render as a flat list before any groups — this is how portal-audience
 * items (teacher/parent/student) appear, since they intentionally carry no
 * `groupId`.
 */
export function bucketItemsByGroup(
  groups: readonly TranslatedNavGroup[],
  items: readonly TranslatedNavItem[]
): {
  readonly grouped: readonly RenderedGroup[];
  readonly noGroup: readonly TranslatedNavItem[];
  readonly endItems: readonly TranslatedNavItem[];
} {
  const itemsByGroupId = new Map<string, TranslatedNavItem[]>();
  const noGroup: TranslatedNavItem[] = [];
  const endItems: TranslatedNavItem[] = [];
  for (const item of items) {
    if (SIDEBAR_END_NAV_ITEM_KEYS.has(item.key)) {
      endItems.push(item);
      continue;
    }
    if (item.groupId) {
      const arr = itemsByGroupId.get(item.groupId);
      if (arr) {
        arr.push(item);
      } else {
        itemsByGroupId.set(item.groupId, [item]);
      }
    } else {
      noGroup.push(item);
    }
  }
  const grouped: RenderedGroup[] = [];
  for (const group of groups) {
    const groupItems = itemsByGroupId.get(group.id);
    if (groupItems && groupItems.length > 0) {
      grouped.push({ group, items: groupItems });
    }
  }
  return { grouped, noGroup, endItems };
}

export function useCollapsedGroupState(groups: readonly TranslatedNavGroup[]): void {
  // Initialize persisted collapse state for any group whose id we haven't
  // seen before. The first paint writes `group.defaultCollapsed ?? false`
  // into the Zustand persisted store; thereafter the user's choice wins.
  const initGroupCollapsed = useLayoutStore(state => state.initGroupCollapsed);
  useEffect(() => {
    for (const group of groups) {
      initGroupCollapsed(group.id, group.defaultCollapsed ?? false);
    }
  }, [groups, initGroupCollapsed]);
}
