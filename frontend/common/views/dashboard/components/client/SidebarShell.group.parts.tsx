import { Box, Collapse, Divider, List } from "@mui/material";
import { useLayoutStore } from "@/frontend/common/stores/layoutStore";
import {
  SidebarGroupHeader,
  SidebarGroupStaticTitle,
  SidebarNavItem,
} from "@/frontend/common/views/dashboard/components/client/SidebarShell.nav.parts";
import { getGroupItemsListSx } from "@/frontend/common/views/dashboard/components/client/SidebarShell.styles";
import type { SidebarGroupBlockProps } from "@/frontend/common/views/dashboard/components/client/SidebarShell.types";

export function SidebarGroupBlock({
  entry,
  activeKey,
  isCollapsed,
  showSeparator,
  toggleGroupAriaLabel,
}: SidebarGroupBlockProps) {
  const { group, items: groupItems } = entry;
  const toggleGroupCollapsed = useLayoutStore(state => state.toggleGroupCollapsed);
  const collapsedGroups = useLayoutStore(state => state.collapsedGroups);
  const collapsed = collapsedGroups[group.id] ?? group.defaultCollapsed ?? false;
  const isSingleItemGroup = groupItems.length === 1;

  return (
    <Box>
      {group.separator && showSeparator && !isCollapsed ? (
        <Divider sx={{ borderColor: "var(--mui-palette-outlineVariant)", my: 1, mx: 0.5 }} />
      ) : null}
      {isSingleItemGroup ? (
        <>
          <SidebarGroupStaticTitle group={group} isCollapsed={isCollapsed} />
          {groupItems.map(item => (
            <SidebarNavItem key={item.key} item={item} isActive={item.key === activeKey} isCollapsed={isCollapsed} />
          ))}
        </>
      ) : (
        <>
          <SidebarGroupHeader
            group={group}
            isCollapsed={isCollapsed}
            collapsed={collapsed}
            onToggle={() => toggleGroupCollapsed(group.id)}
            toggleGroupAriaLabel={toggleGroupAriaLabel}
          />
          <Collapse in={!collapsed} timeout="auto" unmountOnExit>
            <List component="div" disablePadding sx={getGroupItemsListSx(isCollapsed)}>
              {groupItems.map(item => (
                <SidebarNavItem
                  key={item.key}
                  item={item}
                  isActive={item.key === activeKey}
                  isCollapsed={isCollapsed}
                />
              ))}
            </List>
          </Collapse>
        </>
      )}
    </Box>
  );
}
