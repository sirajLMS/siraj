import { create } from "zustand";
import { logger } from "@/frontend/utils/logger";
import type { ComplaintFormData } from "@/frontend/views/dashboard/complaints/schemas/complaintFormSchema";
import type {
  ParentComplaintRecord,
  ParentStudentOption,
} from "@/frontend/views/dashboard/complaints/types/complaints.types";
import { ComplaintStatus } from "@/frontend/views/dashboard/complaints/types/complaints.types";

export type { ParentComplaintRecord, ParentStudentOption };

interface ParentComplaintsState {
  readonly studentOptions: readonly ParentStudentOption[];
  readonly records: readonly ParentComplaintRecord[];
  readonly isSubmitting: boolean;
  readonly showSuccess: boolean;
  readonly hasOlderRecords: boolean;
  setSubmitting: (value: boolean) => void;
  setShowSuccess: (value: boolean) => void;
  resetSuccess: () => void;
  submitComplaint: (data: ComplaintFormData) => void;
  loadOlderRecords: () => void;
}

const MOCK_STUDENT_OPTIONS: ParentStudentOption[] = [
  { id: "stu-zaid", label: "Zaid Ahmad (Grade 4-B)" },
  { id: "stu-ayesha", label: "Ayesha Ahmad (Grade 1-A)" },
];

const MOCK_RECORDS: ParentComplaintRecord[] = [
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

const OLDER_RECORDS: ParentComplaintRecord[] = [
  {
    id: "rec-1004",
    regarding: "Class Schedule Change",
    summary: "The updated timetable for Grade 4-B was not reflected in the parent portal.",
    status: ComplaintStatus.Answered,
    adminResponse: {
      text: "The schedule has been synchronized. Please log out and back in to see the updated timetable.",
      answeredAt: "Aug 5, 2023 • 09:30 AM",
    },
  },
];

export const useParentComplaintsStore = create<ParentComplaintsState>(set => ({
  studentOptions: MOCK_STUDENT_OPTIONS,
  records: MOCK_RECORDS,
  isSubmitting: false,
  showSuccess: false,
  hasOlderRecords: true,
  setSubmitting: value => {
    set({ isSubmitting: value });
  },
  setShowSuccess: value => {
    set({ showSuccess: value });
  },
  resetSuccess: () => {
    set({ showSuccess: false });
  },
  submitComplaint: data => {
    logger.info("Parent complaint submitted", { data });
    const studentLabel = MOCK_STUDENT_OPTIONS.find(option => option.id === data.studentId)?.label ?? "Student";

    const newRecord: ParentComplaintRecord = {
      id: `rec-${Date.now()}`,
      regarding: `Regarding: ${studentLabel}`,
      summary: data.complaintDetails,
      status: ComplaintStatus.Unanswered,
    };

    set(state => ({
      records: [newRecord, ...state.records],
      showSuccess: true,
    }));
  },
  loadOlderRecords: () => {
    set(state => ({
      records: [...state.records, ...OLDER_RECORDS],
      hasOlderRecords: false,
    }));
  },
}));
