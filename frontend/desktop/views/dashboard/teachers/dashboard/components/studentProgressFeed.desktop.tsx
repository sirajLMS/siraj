"use client";

import { Box, Paper, Stack } from "@mui/material";
import type { ReactNode } from "react";
import type { StudentProgressFeedItem } from "@/frontend/common/types/shared.types";
import {
  StudentProgressFeedShared,
  type StudentProgressFeedSharedSlots,
} from "@/frontend/common/views/dashboard/teachers/dashboard/components/__shared__/studentProgressFeedShared";
import type { StudentProgressFeedProps } from "@/frontend/common/views/dashboard/teachers/dashboard/types/teacherDashboardComponentProps";
import { DesktopPersonProfileLink } from "@/frontend/desktop/components/ui/display/personProfileLink/PersonProfileLink.desktop";

function renderDesktopList(
  items: readonly StudentProgressFeedItem[],
  renderItemContent: (item: StudentProgressFeedItem) => ReactNode
): ReactNode {
  return (
    <Paper variant="outlined" sx={{ overflow: "hidden", borderColor: theme => theme.palette.border.light }}>
      <Stack divider={<Box sx={{ borderBottom: theme => `1px solid ${theme.palette.border.light}` }} />}>
        {items.map(item => (
          <Box key={item.id} sx={{ p: 2 }}>
            {renderItemContent(item)}
          </Box>
        ))}
      </Stack>
    </Paper>
  );
}

const DESKTOP_SLOTS: StudentProgressFeedSharedSlots = {
  PersonProfileLink: DesktopPersonProfileLink,
  renderList: renderDesktopList,
};

/**
 * Desktop variant of the student progress feed.
 * Renders items in a dense, panel-style card with outlined Paper container.
 */
export function StudentProgressFeedDesktop({ items, title, labels }: Readonly<StudentProgressFeedProps>) {
  return <StudentProgressFeedShared items={items} title={title} labels={labels} slots={DESKTOP_SLOTS} />;
}
