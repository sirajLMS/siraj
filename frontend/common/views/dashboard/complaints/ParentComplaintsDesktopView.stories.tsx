import { zodResolver } from "@hookform/resolvers/zod";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useForm } from "react-hook-form";
import {
  AccountStatus,
  AppPermission,
  ComplaintCategory,
  ComplaintStatus,
  CurrencyCode,
} from "@/frontend/common/graphql/generated/gql/graphql-types";
import { useUserStore } from "@/frontend/common/stores/userStore";
import { logger } from "@/frontend/common/utils/logger";
import type { ComplaintFormData } from "@/frontend/common/views/dashboard/complaints/schemas/complaintFormSchema";
import { complaintFormSchema } from "@/frontend/common/views/dashboard/complaints/schemas/complaintFormSchema";
import type { ParentComplaintRecord } from "@/frontend/common/views/dashboard/complaints/types/complaints.types";
import { buildComplaintsLabels } from "@/frontend/common/views/dashboard/complaints/utils/buildComplaintsLabels";
import { ParentComplaintsDesktopView } from "@/frontend/desktop/views/dashboard/complaints/parentComplaints.desktop";
import { useAppTranslation } from "@/shared/locale";

const MOCK_PARENT_COMPLAINTS: readonly ParentComplaintRecord[] = [
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

const PARENT_PERMISSIONS = [AppPermission.SupportSubmitComplaint, AppPermission.SupportViewHistory];

const mockActions = {
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

interface ParentComplaintsDesktopStoryProps {
  readonly records: readonly ParentComplaintRecord[];
  readonly hasOlderRecords: boolean;
  readonly isSubmitting: boolean;
  readonly showSuccess: boolean;
  readonly canSubmit: boolean;
}

function ParentComplaintsDesktopStoryRenderer({
  records,
  hasOlderRecords,
  isSubmitting,
  showSuccess,
  canSubmit,
}: Readonly<ParentComplaintsDesktopStoryProps>) {
  const t = useAppTranslation();
  const labels = buildComplaintsLabels(t.dashboardTranslations.complaints).parent;
  const {
    control,
    formState: { errors },
  } = useForm<ComplaintFormData>({
    resolver: zodResolver(complaintFormSchema(labels.validation)),
    defaultValues: {
      category: ComplaintCategory.Other,
      studentId: "",
      contactEmail: "",
      complaintDetails: "",
    },
  });

  return (
    <ParentComplaintsDesktopView
      labels={labels}
      records={records}
      hasOlderRecords={hasOlderRecords}
      control={control}
      errors={errors}
      isSubmitting={isSubmitting}
      showSuccess={showSuccess}
      canSubmit={canSubmit}
      {...mockActions}
    />
  );
}

const meta: Meta<typeof ParentComplaintsDesktopStoryRenderer> = {
  title: "Views/dashboard/complaints/ParentComplaintsDesktopView",
  component: ParentComplaintsDesktopStoryRenderer,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
  decorators: [
    Story => {
      const mockUser = {
        id: "mock-parent-id",
        name: "Sarah Jenkins",
        role: "Parent",
        avatarUrl: "",
        permissions: PARENT_PERMISSIONS,
        notificationCount: 0,
        teacherId: null,
        parentId: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        emailVerifiedAt: new Date().toISOString(),
        email: "sarah.j@example.com",
        phone: null,
        status: AccountStatus.Activated,
        displayCurrency: CurrencyCode.Usd,
        __typename: "User" as const,
      };
      useUserStore.setState({ permissions: PARENT_PERMISSIONS, user: mockUser });
      return <Story />;
    },
  ],
};

export default meta;
type Story = StoryObj<typeof ParentComplaintsDesktopStoryRenderer>;

export const Default: Story = {
  args: {
    records: MOCK_PARENT_COMPLAINTS,
    hasOlderRecords: true,
    isSubmitting: false,
    showSuccess: false,
    canSubmit: true,
  },
};

export const Empty: Story = {
  args: {
    ...Default.args,
    records: [],
    hasOlderRecords: false,
  },
};

export const Submitting: Story = {
  args: {
    ...Default.args,
    isSubmitting: true,
  },
};

export const Success: Story = {
  args: {
    ...Default.args,
    showSuccess: true,
  },
};
