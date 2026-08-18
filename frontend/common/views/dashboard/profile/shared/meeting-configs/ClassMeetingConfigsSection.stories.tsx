import { MockedProvider } from "@apollo/client/testing/react";
import { Stack } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { EffectiveMeetingSource } from "@/frontend/common/graphql/generated/gql/graphql-types";
import {
  classMeetingConfigsQueryDocument,
  classMeetingConfigsWithStatusQueryDocument,
  recurringMeetingConfigsQueryDocument,
} from "@/frontend/common/graphql/sharedDocuments/meeting/meeting.documents";
import {
  ClassMeetingConfigsSection,
  type ClassMeetingConfigsSectionProps,
} from "@/frontend/common/views/dashboard/profile/shared/meeting-configs/ClassMeetingConfigsSection";

const meta = {
  title: "Views/dashboard/profile/shared/meeting-configs/ClassMeetingConfigsSection",
  component: ClassMeetingConfigsSection,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
  decorators: [
    Story => (
      <MockedProvider
        mocks={[
          {
            request: { query: classMeetingConfigsQueryDocument, variables: { classInstanceId: "class-1" } },
            result: { data: { classMeetingConfigs: [] } },
          },
          {
            request: { query: classMeetingConfigsWithStatusQueryDocument, variables: { classInstanceId: "class-1" } },
            result: { data: { classMeetingConfigs: [] } },
          },
          {
            request: {
              query: recurringMeetingConfigsQueryDocument,
              variables: { recurringScheduleId: "sched-1" },
            },
            result: { data: { recurringMeetingConfigs: [] } },
          },
        ]}
      >
        <Stack sx={{ width: 640 }}>
          <Story />
        </Stack>
      </MockedProvider>
    ),
  ],
} satisfies Meta<typeof ClassMeetingConfigsSection>;

export default meta;
type Story = StoryObj<typeof meta>;

const baseProps: ClassMeetingConfigsSectionProps = {
  classInstanceId: "class-1",
  canManage: true,
};

/** Empty class scope — no configs yet; the section renders its empty state. */
export const ClassScopeEmpty: Story = {
  args: baseProps,
};

/** Read-only viewer — cannot manage; the "Add" button is hidden. */
export const ClassScopeReadOnly: Story = {
  args: { ...baseProps, canManage: false },
};

/** Recurring schedule scope instead of a single class instance. */
export const RecurringScope: Story = {
  args: { recurringScheduleId: "sched-1", canManage: true },
};

/** Effective meeting preview banner — shows the auto-resolved meeting source. */
export const WithEffectiveMeeting: Story = {
  args: {
    ...baseProps,
    effectiveMeeting: {
      id: "story-effective-meeting-1",
      joinUrl: "https://zoom.us/j/987654321",
      providerSlug: "zoom",
      providerName: { en: "Zoom", ar: "Zoom" },
      logoUrl: null,
      meetingId: "987654321",
      source: EffectiveMeetingSource.Recurring,
      configId: "config-1",
      providerId: "prov-zoom-1",
      supportsAutoGeneration: true,
    },
  },
};
