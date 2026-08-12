"use client";

import {
  COMPLAINT_RECORD_CARD_MOBILE_OPTIONS,
  ComplaintRecordCardShared,
} from "@/frontend/common/views/dashboard/complaints/components/__shared__/complaintRecordCardShared";
import type { ParentComplaintRecord } from "@/frontend/common/views/dashboard/complaints/types/complaints.types";
import { MobileStatusBadge } from "@/frontend/mobile/components/ui/badge";
import type { ComplaintsParentLabels } from "@/shared/locale";

interface ComplaintRecordCardMobileProps {
  readonly record: ParentComplaintRecord;
  readonly labels: ComplaintsParentLabels;
  /** When true, omit outer Paper chrome (parent provides MobileCardListItem). */
  readonly bare?: boolean;
}

export function ComplaintRecordCardMobile({ record, labels, bare = false }: Readonly<ComplaintRecordCardMobileProps>) {
  return (
    <ComplaintRecordCardShared
      record={record}
      labels={labels}
      options={{ ...COMPLAINT_RECORD_CARD_MOBILE_OPTIONS, bare }}
      slots={{ StatusBadge: MobileStatusBadge }}
    />
  );
}
