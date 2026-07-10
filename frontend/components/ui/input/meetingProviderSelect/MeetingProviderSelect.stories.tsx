import type { Meta, StoryObj } from "@storybook/react";
import { MeetingProviderSelect } from "@/frontend/components/ui/input/meetingProviderSelect/MeetingProviderSelect";

const mockProvider = {
  id: "provider-1",
  slug: "zoom",
  name: { en: "Zoom", ar: "زووم" },
  description: null,
  instructions: null,
  urlAllowlist: ["zoom.us"],
  urlExample: "https://zoom.us/j/123456789",
  logoUrl: null,
  fieldSchema: {
    requiresMeetingUrl: true,
    supportsUsername: true,
    supportsPassword: true,
    supportsTenantId: null,
  },
  isActive: true,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

const meta: Meta<typeof MeetingProviderSelect> = {
  title: "UI/Input/MeetingProviderSelect",
  component: MeetingProviderSelect,
};

export default meta;

type Story = StoryObj<typeof MeetingProviderSelect>;

export const WithValue: Story = {
  render: () => (
    <MeetingProviderSelect value={mockProvider} onChangeAction={() => {}} label="Meeting provider" />
  ),
};
