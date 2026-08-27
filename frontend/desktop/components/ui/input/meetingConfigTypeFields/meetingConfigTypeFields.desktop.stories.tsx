import { Box } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import type { MeetingProviderFieldsFragment } from "@/frontend/common/graphql/generated/gql/graphql";
import {
  type MeetingConfigDetailsFormValue,
  MeetingConfigTypeFieldsDesktop,
  type MeetingConfigTypeFieldsProps,
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
    supportsAutoGeneration: false,
    supportsUsername: false,
    supportsPassword: false,
    supportsTenantId: false,
  },
  providerKind: "manual",
};

const fullFieldsProvider: MeetingProviderFieldsFragment = {
  id: "provider-teams",
  slug: "microsoft_teams",
  name: { en: "Microsoft Teams", ar: "مايكروسوفت Team" },
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
    supportsAutoGeneration: false,
    supportsUsername: true,
    supportsPassword: true,
    supportsTenantId: true,
  },
  providerKind: "manual",
};

const autoGenProvider: MeetingProviderFieldsFragment = {
  id: "provider-zoom-auto",
  slug: "zoom",
  name: { en: "Zoom (Auto)", ar: "زوم (تلقائي)" },
  description: null,
  instructions: null,
  urlAllowlist: ["*.zoom.us"],
  urlExample: "https://zoom.us/j/123456789",
  logoUrl: null,
  isActive: true,
  createdAt: null,
  updatedAt: null,
  fieldSchema: {
    requiresMeetingUrl: false,
    supportsAutoGeneration: true,
    supportsUsername: false,
    supportsPassword: false,
    supportsTenantId: false,
  },
  providerKind: "zoom",
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
