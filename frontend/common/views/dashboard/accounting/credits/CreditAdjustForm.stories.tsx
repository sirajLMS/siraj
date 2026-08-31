import type { MockLink } from "@apollo/client/testing";
import { MockedProvider } from "@apollo/client/testing/react";
import { Box } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { NotificationsProvider } from "@toolpad/core/useNotifications";
import { type ReactNode, useEffect } from "react";
import {
  CreditAdjustmentType as CreditAdjustmentGqlType,
  type CreditAdjustmentInput,
} from "@/frontend/common/graphql/generated/gql/graphql";
import { recordCreditAdjustmentMutationDocument } from "@/frontend/common/graphql/sharedDocuments/billing/credit-adjustment.documents";
import { studentByIdQueryDocument } from "@/frontend/common/graphql/sharedDocuments/students/student.documents";
import { studentsDirectoryQueryDocument } from "@/frontend/common/graphql/sharedDocuments/students/student-directory.documents";
import { teachersQueryDocument } from "@/frontend/common/graphql/sharedDocuments/teachers/teacher.documents";
import { useCreditAdjustFormStore } from "@/frontend/common/stores/creditAdjustFormStore";
import { CreditAdjustForm } from "@/frontend/common/views/dashboard/accounting/credits/CreditAdjustForm";
import { CreditAdjustmentType } from "@/shared/constants/billing";

const STUDENT_ID = "s-1";
const STUDENT_NAME = "Layla Haddad";
const TEACHER_ID = "t-1";
const TEACHER_NAME = "Karim Mansour";

// The student picker fires its directory query on mount (empty search → null).
const studentDirectoryMock: MockLink.MockedResponse = {
  request: { query: studentsDirectoryQueryDocument, variables: { search: null, limit: 20 } },
  result: {
    data: {
      studentsDirectory: [
        {
          __typename: "StudentDirectoryRow",
          id: STUDENT_ID,
          name: STUDENT_NAME,
          email: null,
          avatarUrl: null,
          status: "REGULAR",
          classesRemaining: 14,
          classesTotal: 20,
          hoursPerWeek: 2,
          teacherName: TEACHER_NAME,
          createdAt: "2026-01-01T00:00:00.000Z",
          updatedAt: "2026-01-01T00:00:00.000Z",
        },
      ],
    },
  },
  maxUsageCount: Number.POSITIVE_INFINITY,
};

// The carryover teacher picker fires its options query when the banner expands.
const teachersMock: MockLink.MockedResponse = {
  request: { query: teachersQueryDocument, variables: { search: "", limit: 20 } },
  result: {
    data: {
      teachers: [
        { __typename: "TeacherSimple", id: TEACHER_ID, name: TEACHER_NAME, avatarUrl: null },
        { __typename: "TeacherSimple", id: "teacher-2", name: "Huda Nasser", avatarUrl: null },
      ],
    },
  },
  maxUsageCount: Number.POSITIVE_INFINITY,
};

const preselectedStudentMock: MockLink.MockedResponse = {
  request: { query: studentByIdQueryDocument, variables: { studentId: STUDENT_ID } },
  result: {
    data: {
      studentById: {
        __typename: "AssociatedStudent",
        id: STUDENT_ID,
        name: STUDENT_NAME,
        avatarUrl: null,
        status: "REGULAR",
        primaryTeacherId: TEACHER_ID,
        teacherName: TEACHER_NAME,
        hoursPerWeek: "2",
        classesRemaining: 14,
        classesTotal: 20,
        language: "en",
        gender: "FEMALE",
        version: 3,
        updatedAt: "2026-01-01T00:00:00.000Z",
      },
    },
  },
  maxUsageCount: Number.POSITIVE_INFINITY,
};

const carryoverInput: CreditAdjustmentInput = {
  studentId: STUDENT_ID,
  adjustmentType: CreditAdjustmentGqlType.SubtractWithCarryover,
  hours: 4,
  notes: "<p>Schedule conflict — carrying over to teacher payout</p>",
  carryoverTeacherId: TEACHER_ID,
  carryoverFromDate: "2026-08-01",
  carryoverToDate: "2026-08-15",
  carryoverPaymentDate: "2026-08-20",
};

const successMutationMock: MockLink.MockedResponse = {
  request: { query: recordCreditAdjustmentMutationDocument, variables: { input: carryoverInput } },
  result: {
    data: {
      recordCreditAdjustment: {
        __typename: "CreditAdjustmentResult",
        id: "tx-1",
        studentId: STUDENT_ID,
        changeAmount: -carryoverInput.hours,
        changeAmountHours: String(carryoverInput.hours),
        reason: "CREDIT_ADJUSTMENT_CARRYOVER",
        adjustmentType: CreditAdjustmentGqlType.SubtractWithCarryover,
        carryoverTeacherId: TEACHER_ID,
        carryoverFromDate: carryoverInput.carryoverFromDate,
        carryoverToDate: carryoverInput.carryoverToDate,
        carryoverPaymentDate: carryoverInput.carryoverPaymentDate,
        notes: carryoverInput.notes,
        creditedByUserId: "admin-1",
        createdAt: "2026-08-29T00:00:00.000Z",
        updatedAt: "2026-08-29T00:00:00.000Z",
      },
    },
  },
  maxUsageCount: Number.POSITIVE_INFINITY,
};

/**
 * Seeds a complete carryover draft (the pickers keep their display values
 * locally, so only the store-bound fields render pre-populated) and restores
 * the pristine form on unmount so values never leak between stories.
 */
function StoreSeed({ children }: Readonly<{ children: ReactNode }>) {
  useEffect(() => {
    useCreditAdjustFormStore.setState({
      studentId: STUDENT_ID,
      adjustmentType: CreditAdjustmentType.SUBTRACT_WITH_CARRYOVER,
      hours: 4,
      notes: carryoverInput.notes ?? "",
      carryoverTeacherId: TEACHER_ID,
      fromDate: carryoverInput.carryoverFromDate,
      toDate: carryoverInput.carryoverToDate,
      paymentDate: carryoverInput.carryoverPaymentDate,
    });
    return () => {
      useCreditAdjustFormStore.getState().reset();
    };
  }, []);
  return children;
}

const meta: Meta<typeof CreditAdjustForm> = {
  title: "Views/dashboard/accounting/credits/CreditAdjustForm",
  component: CreditAdjustForm,
  tags: ["autodocs"],
  parameters: { layout: "fullscreen" },
  args: { studentId: null },
  decorators: [
    Story => (
      <Box sx={{ width: "100%", maxWidth: 960, mx: "auto" }}>
        <Story />
      </Box>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {
  decorators: [
    Story => (
      <MockedProvider mocks={[studentDirectoryMock, teachersMock]}>
        <NotificationsProvider>
          <Story />
        </NotificationsProvider>
      </MockedProvider>
    ),
  ],
};

export const PreselectedStudent: Story = {
  args: { studentId: STUDENT_ID },
  decorators: [
    Story => (
      <MockedProvider mocks={[studentDirectoryMock, teachersMock, preselectedStudentMock]}>
        <NotificationsProvider>
          <Story />
        </NotificationsProvider>
      </MockedProvider>
    ),
  ],
};

export const CarryoverExpanded: Story = {
  decorators: [
    Story => (
      <StoreSeed>
        <MockedProvider mocks={[studentDirectoryMock, teachersMock, successMutationMock]}>
          <NotificationsProvider>
            <Story />
          </NotificationsProvider>
        </MockedProvider>
      </StoreSeed>
    ),
  ],
};
