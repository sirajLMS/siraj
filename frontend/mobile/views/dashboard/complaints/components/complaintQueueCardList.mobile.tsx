"use client";

import { buildServerPaginationOptions } from "@/frontend/common/components/ui/filter/listPaginationOptions";
import {
  buildQueueCardProps,
  type ComplaintQueueCardListSharedProps,
} from "@/frontend/common/views/dashboard/complaints/components/__shared__/complaintQueueCardListShared";
import { MobileCardList } from "@/frontend/mobile/components/ui";
import { ComplaintQueueCardMobile } from "@/frontend/mobile/views/dashboard/complaints/components/complaintQueueCard.mobile";

export function ComplaintQueueCardListMobile({
  rows,
  labels,
  draftResponses,
  canManage,
  canDelete,
  page,
  pageSize,
  totalCount,
  onDraftChange,
  onAnswer,
  onDelete,
  onPageChange,
}: Readonly<ComplaintQueueCardListSharedProps>) {
  return (
    <MobileCardList
      rows={rows}
      emptyMessage={labels.queue.noEntries}
      getKey={row => row.id}
      layout="rounded"
      gap={2}
      paginationOptions={buildServerPaginationOptions({
        page,
        pageSize,
        totalCount,
        onPageChange,
      })}
      renderItem={row => (
        <ComplaintQueueCardMobile
          {...buildQueueCardProps(row, labels, draftResponses, canManage, canDelete, onDraftChange, onAnswer, onDelete)}
        />
      )}
    />
  );
}
