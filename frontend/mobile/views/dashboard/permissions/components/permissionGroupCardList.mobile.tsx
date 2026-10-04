"use client";

import type { BasePermissionGroupListProps } from "@/frontend/common/views/dashboard/permissions/types";
import { MobileCardList } from "@/frontend/mobile/components/ui";
import { GroupCardMobile } from "@/frontend/mobile/views/dashboard/permissions/components/permissionGroupCardList.parts";

export function PermissionGroupCardListMobile({
  labels,
  groups,
  onViewGroup,
  onEditGroup,
  onDeleteGroup,
  onAssignGroup,
  groupRowMenuAnchor,
}: Readonly<BasePermissionGroupListProps>) {
  const t = labels;

  return (
    <MobileCardList
      rows={groups}
      emptyMessage={t.noPermissionsFound}
      getKey={group => group.id ?? group.slug ?? ""}
      paginationOptions={{ mode: "client" }}
      layout="edge-to-edge"
      renderItem={group => (
        <GroupCardMobile
          labels={labels}
          group={group}
          onViewGroup={onViewGroup}
          onEditGroup={onEditGroup}
          onDeleteGroup={onDeleteGroup}
          onAssignGroup={onAssignGroup}
          rowMenuAnchor={groupRowMenuAnchor}
        />
      )}
    />
  );
}
