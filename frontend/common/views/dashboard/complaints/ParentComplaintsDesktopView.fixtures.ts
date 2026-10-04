import { AppPermission, ComplaintStatus } from "@/frontend/common/graphql/generated/gql/graphql";
import { logger } from "@/frontend/common/utils/logger";
import type { ParentComplaintRecord } from "@/frontend/common/views/dashboard/complaints/types/complaints.types";

export const MOCK_PARENT_COMPLAINTS: readonly ParentComplaintRecord[] = [
  {
    id: "rec-1001",
    regarding: "Tuition Fee Processing",
    summary: "The online payment portal is not reflecting the scholarship discount for Semester 2.",
    status: ComplaintStatus.Answered,
    adminResponse: {
      text: "We have updated the ledger to reflect the 15% academic scholarship. Please refresh your portal; the balance should now be correct.",
      answeredAt: "Oct 24, 2023 • 10:15 AM",
    },
  },
  {
    id: "rec-1002",
    regarding: "Transportation Service",
    summary: "Bus #42 was delayed by 30 minutes this morning without notification.",
    status: ComplaintStatus.Unanswered,
  },
  {
    id: "rec-1003",
    regarding: "Grade Discrepancy",
    summary: "Mathematics mid-term score shows 78, but the physical script has 87.",
    status: ComplaintStatus.Answered,
    adminResponse: {
      text: "This was a clerical error during data entry. The system has been updated to reflect the correct score of 87. Apologies for the confusion.",
      answeredAt: "Sep 12, 2023 • 02:45 PM",
    },
  },
];

export const PARENT_PERMISSIONS = [AppPermission.SupportSubmitComplaint, AppPermission.SupportViewHistory];

export const mockActions = {
  onDismissSuccess: () => {
    logger.info("onDismissSuccess");
  },
  onFormSubmit: () => {
    logger.info("onFormSubmit");
  },
  onLoadOlderRecords: () => {
    logger.info("onLoadOlderRecords");
  },
};
