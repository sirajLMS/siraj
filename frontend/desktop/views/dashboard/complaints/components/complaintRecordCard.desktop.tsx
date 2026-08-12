"use client";

import {
  COMPLAINT_RECORD_CARD_DESKTOP_OPTIONS,
  ComplaintRecordCardShared,
} from "@/frontend/common/views/dashboard/complaints/components/__shared__/complaintRecordCardShared";
import type { ParentComplaintRecord } from "@/frontend/common/views/dashboard/complaints/types/complaints.types";
import { DesktopStatusBadge } from "@/frontend/desktop/components/ui/badge";
import type { ComplaintsParentLabels } from "@/shared/locale";

interface ComplaintRecordCardDesktopProps {
  readonly record: ParentComplaintRecord;
  readonly labels: ComplaintsParentLabels;
}

export function ComplaintRecordCardDesktop({ record, labels }: Readonly<ComplaintRecordCardDesktopProps>) {
  return (
    <ComplaintRecordCardShared
      record={record}
      labels={labels}
      options={COMPLAINT_RECORD_CARD_DESKTOP_OPTIONS}
      slots={{ StatusBadge: DesktopStatusBadge }}
    />
  );
}
