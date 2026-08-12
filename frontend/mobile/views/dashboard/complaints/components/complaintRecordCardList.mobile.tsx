"use client";

import type { ListPaginationOptions } from "@/frontend/common/components/ui/filter/listPaginationOptions";
import { ComplaintRecordCardListShared } from "@/frontend/common/views/dashboard/complaints/components/__shared__/complaintRecordCardListShared";
import { MOBILE_OPTIONS } from "@/frontend/common/views/dashboard/complaints/components/__shared__/complaintRecordCardListShared.options";
import type { ParentComplaintRecord } from "@/frontend/common/views/dashboard/complaints/types/complaints.types";
import { MobileCardListItem } from "@/frontend/mobile/components/ui";
import { MobileCardList } from "@/frontend/mobile/components/ui/container/MobileCardList";
import { ComplaintRecordCardMobile } from "@/frontend/mobile/views/dashboard/complaints/components/complaintRecordCard.mobile";
import type { ComplaintsParentLabels } from "@/shared/locale";

interface ComplaintRecordCardListMobileProps {
  readonly records: readonly ParentComplaintRecord[];
  readonly labels: ComplaintsParentLabels;
  readonly hasOlderRecords: boolean;
  readonly onLoadOlderRecords: () => void;
  readonly paginationOptions: ListPaginationOptions;
}

export function ComplaintRecordCardListMobile({
  records,
  labels,
  hasOlderRecords,
  onLoadOlderRecords,
  paginationOptions,
}: Readonly<ComplaintRecordCardListMobileProps>) {
  const totalCount =
    paginationOptions !== false && paginationOptions.mode === "server" ? paginationOptions.totalCount : records.length;
  const showLoadMore = paginationOptions === false && hasOlderRecords;

  return (
    <ComplaintRecordCardListShared
      labels={labels}
      totalCount={totalCount}
      showLoadMore={showLoadMore}
      onLoadOlderRecords={onLoadOlderRecords}
      options={MOBILE_OPTIONS}
    >
      <MobileCardList
        rows={records}
        getKey={record => record.id}
        paginationOptions={paginationOptions}
        layout="edge-to-edge"
        renderItem={record => (
          <MobileCardListItem variant="edge-to-edge">
            <ComplaintRecordCardMobile record={record} labels={labels} bare />
          </MobileCardListItem>
        )}
      />
    </ComplaintRecordCardListShared>
  );
}
