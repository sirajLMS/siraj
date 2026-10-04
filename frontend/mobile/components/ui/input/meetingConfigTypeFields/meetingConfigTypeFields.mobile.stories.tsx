import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import {
  autoGenProvider,
  fullFieldsProvider,
} from "@/frontend/common/components/ui/input/meetingConfigTypeFields/meetingConfigTypeFields.fixtures";
import { MOBILE_VIEWPORTS } from "@/frontend/common/stories";
import { MeetingConfigTypeFieldsStory } from "@/frontend/mobile/components/ui/input/meetingConfigTypeFields/meetingConfigTypeFields.mobile.stories.helpers";

const meta: Meta<typeof MeetingConfigTypeFieldsStory> = {
  title: "UI/MeetingConfigTypeFields/Mobile",
  component: MeetingConfigTypeFieldsStory,
  tags: ["ai-generated"],
  parameters: {
    viewport: {
      defaultViewport: "mobile1",
      viewports: MOBILE_VIEWPORTS,
    },
  },
};

export default meta;
type Story = StoryObj<typeof MeetingConfigTypeFieldsStory>;

export const Default: Story = {
  args: {
    initialValue: {
      meetingUrl: "https://zoom.us/j/987654321",
    },
  },
};

export const AllFields: Story = {
  args: {
    provider: fullFieldsProvider,
    initialValue: {
      meetingUrl: "https://teams.microsoft.com/l/meetup-join/example-session",
      username: "teacher@school.edu",
      password: "secret-pass",
      tenantId: "contoso-tenant-id",
    },
    passwordHelperText: "Stored securely and never shown to students.",
  },
};

export const Empty: Story = {
  args: {
    initialValue: {
      meetingUrl: "",
    },
  },
};

export const Arabic: Story = {
  globals: {
    locale: "ar",
  },
  args: {
    initialValue: {
      meetingUrl: "https://zoom.us/j/987654321",
    },
  },
};

export const AutoGenerate: Story = {
  args: {
    provider: autoGenProvider,
    initialValue: {
      meetingUrl: "",
    },
    onGenerateUrl: () => {},
  },
};

export const Generating: Story = {
  args: {
    provider: autoGenProvider,
    initialValue: {
      meetingUrl: "",
    },
    onGenerateUrl: () => {},
    generating: true,
  },
};

export const GenerationError: Story = {
  args: {
    provider: autoGenProvider,
    initialValue: {
      meetingUrl: "",
    },
    onGenerateUrl: () => {},
    generationError: "Failed to generate meeting URL. Please try again.",
  },
};

export const RegenerateUrl: Story = {
  args: {
    provider: autoGenProvider,
    initialValue: {
      meetingUrl: "https://zoom.us/j/987654321",
    },
    onGenerateUrl: () => {},
  },
};
