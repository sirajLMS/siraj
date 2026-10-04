import { Box } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import {
  autoGenProvider,
  fullFieldsProvider,
  zoomProvider,
} from "@/frontend/common/components/ui/input/meetingConfigTypeFields/meetingConfigTypeFields.fixtures";
import type { MeetingProviderFieldsFragment } from "@/frontend/common/graphql/generated/gql/graphql";
import {
  type MeetingConfigDetailsFormValue,
  MeetingConfigTypeFieldsDesktop,
  type MeetingConfigTypeFieldsProps,
} from "@/frontend/desktop/components/ui/input/meetingConfigTypeFields/meetingConfigTypeFields.desktop";

function MeetingConfigTypeFieldsStory({
  initialValue,
  provider = zoomProvider,
  ...props
}: Readonly<
  Partial<MeetingConfigTypeFieldsProps> & {
    initialValue?: MeetingConfigDetailsFormValue;
    provider?: MeetingProviderFieldsFragment;
  }
>) {
  const [value, setValue] = useState<MeetingConfigDetailsFormValue>(initialValue ?? { meetingUrl: "" });

  return (
    <Box sx={{ width: 480, p: 2 }}>
      <MeetingConfigTypeFieldsDesktop provider={provider} value={value} onChangeAction={setValue} {...props} />
    </Box>
  );
}

const meta: Meta<typeof MeetingConfigTypeFieldsStory> = {
  title: "UI/MeetingConfigTypeFields/Desktop",
  component: MeetingConfigTypeFieldsStory,
  tags: ["ai-generated"],
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
