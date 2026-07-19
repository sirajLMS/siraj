import { Box } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import {
  type MeetingConfigDetailsFormValue,
  MeetingConfigTypeFieldsDesktop,
  type MeetingConfigTypeFieldsProps,
  type MeetingProviderFieldsFragment,
} from "@/frontend/desktop/components/ui/input/meetingConfigTypeFields/meetingConfigTypeFields.desktop";

const zoomProvider: MeetingProviderFieldsFragment = {
  id: "provider-zoom",
  slug: "zoom",
  name: { en: "Zoom", ar: "زوم" },
  description: null,
  instructions: null,
  urlAllowlist: ["*.zoom.us"],
  urlExample: "https://zoom.us/j/123456789",
  logoUrl: null,
  isActive: true,
  createdAt: null,
  updatedAt: null,
  fieldSchema: {
    requiresMeetingUrl: true,
    supportsUsername: false,
    supportsPassword: false,
    supportsTenantId: false,
  },
};

const fullFieldsProvider: MeetingProviderFieldsFragment = {
  id: "provider-teams",
  slug: "microsoft_teams",
  name: { en: "Microsoft Teams", ar: "مايكروسوفت Teams" },
  description: null,
  instructions: null,
  urlAllowlist: ["*.teams.microsoft.com"],
  urlExample: "https://teams.microsoft.com/l/meetup-join/example",
  logoUrl: null,
  isActive: true,
  createdAt: null,
  updatedAt: null,
  fieldSchema: {
    requiresMeetingUrl: true,
    supportsUsername: true,
    supportsPassword: true,
    supportsTenantId: true,
  },
};

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
