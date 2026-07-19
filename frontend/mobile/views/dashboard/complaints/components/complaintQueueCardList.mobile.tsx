"use client";

import { buildServerPaginationOptions } from "@/frontend/common/components/ui/filter/listPaginationOptions";
import type { AdminComplaintRow } from "@/frontend/common/views/dashboard/complaints/types/complaints.types";
import { MobileCardList } from "@/frontend/mobile/components/ui";
import { ComplaintQueueCardMobile } from "@/frontend/mobile/views/dashboard/complaints/components/complaintQueueCard.mobile";
import type { ComplaintsAdminLabels } from "@/shared/locale";

interface ComplaintQueueCardListMobileProps {
  readonly rows: readonly AdminComplaintRow[];
  readonly labels: ComplaintsAdminLabels;
  readonly draftResponses: Readonly<Record<string, string>>;
  readonly canManage: boolean;
  readonly canDelete: boolean;
  readonly page: number;
  readonly pageSize: number;
  readonly totalCount: number;
  readonly onDraftChange: (id: string, text: string) => void;
  readonly onAnswer: (id: string, options: { readonly sendEmail: boolean }) => void;
  readonly onDelete: (id: string) => void;
  readonly onPageChange: (page: number) => void;
}

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
}: Readonly<ComplaintQueueCardListMobileProps>) {
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
          row={row}
          labels={labels}
          draftResponse={draftResponses[row.id] ?? ""}
          canManage={canManage}
          canDelete={canDelete}
          onDraftChange={text => {
            onDraftChange(row.id, text);
          }}
          onAnswer={options => {
            onAnswer(row.id, options);
          }}
          onDelete={() => {
            onDelete(row.id);
          }}
        />
      )}
    />
  );
}
