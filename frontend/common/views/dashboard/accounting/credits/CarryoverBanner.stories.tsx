import type { MockLink } from "@apollo/client/testing";
import { MockedProvider } from "@apollo/client/testing/react";
import { Box } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { type ReactNode, useEffect } from "react";
import { teachersQueryDocument } from "@/frontend/common/graphql/sharedDocuments";
import { useCreditAdjustFormStore } from "@/frontend/common/stores/creditAdjustFormStore";
import { CarryoverBanner } from "@/frontend/common/views/dashboard/accounting/credits/CarryoverBanner";

// The teacher picker fires its options query on mount (empty search, page-size limit).
const teachersMock: MockLink.MockedResponse = {
  request: { query: teachersQueryDocument, variables: { search: "", limit: 20 } },
  result: {
    data: {
      teachers: [
        { __typename: "TeacherSimple", id: "teacher-1", name: "Karim Mansour", avatarUrl: null },
        { __typename: "TeacherSimple", id: "teacher-2", name: "Huda Nasser", avatarUrl: null },
      ],
    },
  },
  maxUsageCount: Number.POSITIVE_INFINITY,
};

/**
 * Seeds the carryover date fields and restores the pristine form on unmount so
 * seeded values never leak between stories. The teacher picker's display value
 * is its own local state, so only the store-bound dates render pre-populated.
 */
function StoreSeed({ children }: Readonly<{ children: ReactNode }>) {
  useEffect(() => {
    useCreditAdjustFormStore.setState({
      carryoverTeacherId: "teacher-1",
      fromDate: "2026-08-01",
      toDate: "2026-08-15",
      paymentDate: "2026-08-20",
    });
    return () => {
      useCreditAdjustFormStore.getState().reset();
    };
  }, []);
  return children;
}

const meta: Meta<typeof CarryoverBanner> = {
  title: "Views/dashboard/accounting/credits/CarryoverBanner",
  component: CarryoverBanner,
  tags: ["autodocs"],
  decorators: [
    Story => (
      <Box sx={{ width: "100%", maxWidth: 960, p: 2 }}>
        <MockedProvider mocks={[teachersMock]}>
          <Story />
        </MockedProvider>
      </Box>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {};

export const DatesSeeded: Story = {
  decorators: [
    Story => (
      <StoreSeed>
        <Story />
      </StoreSeed>
    ),
  ],
};

export const WithErrors: Story = {
  args: {
    errors: {
      teacher: "Teacher is required",
      fromDate: "From date is required",
      toDate: "To date is required",
      paymentDate: "Payment date is required",
    },
  },
};
