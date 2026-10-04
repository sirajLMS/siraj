import { Box, Divider, List } from "@mui/material";
import { SidebarGroupBlock } from "@/frontend/common/views/dashboard/components/client/SidebarShell.group.parts";
import {
  bucketItemsByGroup,
  useCollapsedGroupState,
} from "@/frontend/common/views/dashboard/components/client/SidebarShell.helpers";
import { SidebarNavItem } from "@/frontend/common/views/dashboard/components/client/SidebarShell.nav.parts";
import { getNavListSx } from "@/frontend/common/views/dashboard/components/client/SidebarShell.styles";
import type {
  GroupedNavListProps,
  TranslatedNavItem,
} from "@/frontend/common/views/dashboard/components/client/SidebarShell.types";

function renderNavItems(items: readonly TranslatedNavItem[], activeKey: string | null, isCollapsed: boolean) {
  return items.map(item => (
    <SidebarNavItem key={item.key} item={item} isActive={item.key === activeKey} isCollapsed={isCollapsed} />
  ));
}

export function GroupedNavList({
  groups,
  items,
  activeKey,
  isCollapsed,
  navListRef,
  toggleGroupAriaLabel,
}: GroupedNavListProps) {
  const { grouped, noGroup, endItems } = bucketItemsByGroup(groups, items);
  useCollapsedGroupState(groups);
  const hasLeadingNav = noGroup.length > 0 || grouped.length > 0;

  return (
    <Box ref={navListRef} sx={getNavListSx(isCollapsed)}>
      <List component="nav" sx={{ p: 0 }}>
        {noGroup.length > 0 ? renderNavItems(noGroup, activeKey, isCollapsed) : null}
        {grouped.map((entry, index) => (
          <SidebarGroupBlock
            key={entry.group.id}
            entry={entry}
            activeKey={activeKey}
            isCollapsed={isCollapsed}
            showSeparator={index > 0 || noGroup.length > 0}
            toggleGroupAriaLabel={toggleGroupAriaLabel}
          />
        ))}
        {endItems.length > 0 && hasLeadingNav ? (
          <Divider
            sx={{
              borderColor: "var(--mui-palette-outlineVariant)",
              my: 1,
              mx: isCollapsed ? 0 : 0.5,
              width: isCollapsed ? "100%" : undefined,
            }}
          />
        ) : null}
        {renderNavItems(endItems, activeKey, isCollapsed)}
      </List>
    </Box>
  );
}
