"use client";

import type { ReactNode } from "react";
import type { StudentProgressFeedItem } from "@/frontend/common/types/shared.types";
import {
  StudentProgressFeedShared,
  type StudentProgressFeedSharedSlots,
} from "@/frontend/common/views/dashboard/teachers/dashboard/components/__shared__/studentProgressFeedShared";
import type { StudentProgressFeedProps } from "@/frontend/common/views/dashboard/teachers/dashboard/types/teacherDashboardComponentProps";
import { MobileCardList, MobileCardListItem } from "@/frontend/mobile/components/ui";
import { MobilePersonProfileLink } from "@/frontend/mobile/components/ui/display/personProfileLink";

function renderMobileList(
  items: readonly StudentProgressFeedItem[],
  renderItemContent: (item: StudentProgressFeedItem) => ReactNode
): ReactNode {
  return (
    <MobileCardList
      rows={items}
      getKey={item => item.id}
      paginationOptions={false}
      layout="edge-to-edge"
      renderItem={item => <MobileCardListItem variant="edge-to-edge">{renderItemContent(item)}</MobileCardListItem>}
    />
  );
}

const MOBILE_SLOTS: StudentProgressFeedSharedSlots = {
  PersonProfileLink: MobilePersonProfileLink,
  renderList: renderMobileList,
};

/**
 * Mobile variant of the student progress feed.
 * Renders items in an edge-to-edge MobileCardList.
 */
export function StudentProgressFeedMobile({ items, title, labels }: Readonly<StudentProgressFeedProps>) {
  return <StudentProgressFeedShared items={items} title={title} labels={labels} slots={MOBILE_SLOTS} />;
}
